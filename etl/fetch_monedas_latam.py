"""
Fetcher de cotizaciones LATAM contra USD usando el endpoint del BCRA.

El BCRA expone para cada divisa un `tipoPase` que representa cuántos USD vale
1 unidad de la moneda extranjera. Lo invertimos para obtener la convención
estándar: "unidades locales por USD" (lo que cuesta 1 USD en cada moneda).

Cobertura:
  - BRL (Brasil)
  - CLP (Chile)
  - UYU (Uruguay)
  - PEN (Perú)
  - COP (Colombia)
  - PYG (Paraguay)
  - MXP (México — código legacy del BCRA; el ETL lo expone como `mxn`)

Argentina (ARS) NO se ingiere acá: ya está cubierto por fetch_dolar.py
(BCRA tipo de cambio minorista vs USD).

Bolivia (BOB) y Venezuela (VES) no están en el catálogo BCRA. Se mencionan
en la UI como "Próximamente" o se omiten.

Output por moneda:
  - data/series/moneda_<key>_diario.json — pares (fecha, unidades_por_USD)
  - data/series/moneda_<key>_mensual.json — agregado al cierre del mes
  - data/moneda_<key>.json — summary con último valor y delta mensual
"""

from __future__ import annotations

import logging
import os
from datetime import date, datetime, timedelta
from typing import Any

import certifi
import requests

from common import now_iso, today_iso, write_json
from db import (
    finish_refresh_run,
    init_db,
    start_refresh_run,
    update_series_refresh_status,
    upsert_observations,
    upsert_series,
)
from series_store import read_series, write_series

logger = logging.getLogger(__name__)

# (codigo_bcra, key_interno, display_name)
_MONEDAS: list[tuple[str, str, str]] = [
    ("BRL", "brl", "Real brasileño (BRL)"),
    ("CLP", "clp", "Peso chileno (CLP)"),
    ("UYU", "uyu", "Peso uruguayo (UYU)"),
    ("PEN", "pen", "Sol peruano (PEN)"),
    ("COP", "cop", "Peso colombiano (COP)"),
    ("PYG", "pyg", "Guaraní paraguayo (PYG)"),
    ("MXP", "mxn", "Peso mexicano (MXN)"),
]

_BCRA_BASE = "https://api.bcra.gob.ar/estadisticascambiarias/v1.0"
_DEFAULT_START = "2015-01-01"
_PAGE_LIMIT = 1000


def _http_get_json(url: str, params: dict[str, Any] | None = None) -> Any:
    allow_insecure = os.getenv("ALLOW_INSECURE_SSL") == "1"
    verify = False if allow_insecure else certifi.where()
    resp = requests.get(url, params=params, timeout=30, verify=verify)
    resp.raise_for_status()
    return resp.json()


def _parse_date(value: str) -> date:
    return datetime.strptime(value, "%Y-%m-%d").date()


def _aggregate_month_end(
    points: list[tuple[date, float]],
) -> list[tuple[date, float]]:
    if not points:
        return []
    monthly: dict[tuple[int, int], tuple[date, float]] = {}
    for point_date, value in points:
        key = (point_date.year, point_date.month)
        current = monthly.get(key)
        if current is None or point_date > current[0]:
            monthly[key] = (point_date, value)
    return sorted(monthly.values(), key=lambda item: item[0])


def _fetch_bcra_pages(codigo: str, start: date, end: date) -> list[tuple[date, float]]:
    """Pega contra /Cotizaciones/{codigo} paginando hasta agotar resultados."""
    url = f"{_BCRA_BASE}/Cotizaciones/{codigo}"
    all_points: list[tuple[date, float]] = []
    offset = 0
    while True:
        params = {
            "fechaDesde": start.isoformat(),
            "fechaHasta": end.isoformat(),
            "limit": _PAGE_LIMIT,
            "offset": offset,
        }
        payload = _http_get_json(url, params=params)
        results = payload.get("results", [])
        for row in results:
            fecha = row.get("fecha")
            detalle = row.get("detalle") or []
            if not fecha or not detalle:
                continue
            # `detalle` puede traer varias filas; nos quedamos con la que
            # matchea el código pedido (típicamente 1 sola).
            tipo_pase = None
            for entry in detalle:
                if entry.get("codigoMoneda") == codigo:
                    tipo_pase = entry.get("tipoPase")
                    break
            if tipo_pase is None:
                # Fallback: tomar el primero
                tipo_pase = detalle[0].get("tipoPase")
            if tipo_pase is None:
                continue
            try:
                pase = float(tipo_pase)
            except (ValueError, TypeError):
                continue
            if pase == 0:
                continue
            # `tipoPase` = USD por unidad local → invertimos a "locales por USD".
            value = 1.0 / pase
            try:
                d = _parse_date(fecha)
            except ValueError:
                continue
            all_points.append((d, value))
        if len(results) < _PAGE_LIMIT:
            break
        offset += _PAGE_LIMIT
    return sorted(all_points, key=lambda item: item[0])


def _fetch_one_moneda(
    codigo: str, key: str, display_name: str
) -> dict[str, Any]:
    series_key = f"moneda_{key}"
    run_id: int | None = None
    diario_file = f"moneda_{key}_diario.json"
    mensual_file = f"moneda_{key}_mensual.json"
    summary_file = f"moneda_{key}.json"

    upsert_series(
        series_id=series_key,
        display_name=display_name,
        source_name="BCRA",
        dataset=f"estadisticascambiarias/Cotizaciones/{codigo}",
        official=True,
        frequency="daily",
        unit="unidades_locales_por_USD",
        provider_series_id=codigo,
    )
    run_id = start_refresh_run(series_key)

    try:
        history = read_series(diario_file)
        # Continuar desde el último punto si ya tenemos histórico; sino, 2015-01-01.
        if history:
            last_date = history[-1][0]
            start = max(
                _parse_date(_DEFAULT_START),
                last_date + timedelta(days=1) if isinstance(last_date, date) else _parse_date(last_date),
            )
        else:
            start = _parse_date(_DEFAULT_START)

        end = date.today()
        if start > end:
            # Ya está al día; mantenemos histórico tal cual.
            new_points: list[tuple[date, float]] = []
        else:
            new_points = _fetch_bcra_pages(codigo, start, end)

        # Merge con histórico previo
        merged_map: dict[date, float] = {}
        for d, v in history:
            d_obj = d if isinstance(d, date) else _parse_date(d)
            merged_map[d_obj] = v
        for d, v in new_points:
            merged_map[d] = v
        merged = sorted(merged_map.items(), key=lambda item: item[0])
        write_series(diario_file, merged)

        monthly_points = _aggregate_month_end(merged)
        write_series(mensual_file, monthly_points)

        rows_upserted = upsert_observations(series_key, merged)
        logger.info(
            "%s (%s): %d puntos diarios, %d mensuales, %d upserted",
            series_key,
            codigo,
            len(merged),
            len(monthly_points),
            rows_upserted,
        )

        if not merged:
            payload_out = {
                "updated_at": None,
                "updated_at_time": None,
                "period": None,
                "value": None,
                "monthly_change": None,
                "unit": "unidades_locales_por_USD",
                "source": {"name": "BCRA", "official": True},
            }
            finish_refresh_run(run_id, "success", 0, None)
            update_series_refresh_status(series_key, "success", None, 0, None)
            if os.getenv("ETL_EXPORT_JSON", "1") == "1":
                write_json(summary_file, payload_out)
            return payload_out

        latest_date, latest_value = merged[-1]
        monthly_change = None
        if len(monthly_points) >= 2:
            prev_value = monthly_points[-2][1]
            if prev_value:
                monthly_change = round(
                    ((latest_value - prev_value) / prev_value) * 100, 2
                )

        payload_out = {
            "updated_at": today_iso(),
            "updated_at_time": now_iso(),
            "period": latest_date.strftime("%Y-%m-%d"),
            "value": round(latest_value, 4),
            "monthly_change": monthly_change,
            "unit": "unidades_locales_por_USD",
            "source": {"name": "BCRA", "official": True},
        }

        finish_refresh_run(run_id, "success", rows_upserted, None)
        update_series_refresh_status(
            series_key, "success", latest_date, len(merged), None
        )
        if os.getenv("ETL_EXPORT_JSON", "1") == "1":
            write_json(summary_file, payload_out)
        return payload_out

    except Exception as exc:
        logger.exception("Error fetcheando moneda %s", codigo)
        if run_id is not None:
            finish_refresh_run(run_id, "error", 0, str(exc))
            update_series_refresh_status(series_key, "error", None, 0, str(exc))
        raise


def fetch_monedas_latam() -> dict[str, Any]:
    init_db()
    results: dict[str, Any] = {}
    failed: list[str] = []
    for codigo, key, display_name in _MONEDAS:
        try:
            results[key] = _fetch_one_moneda(codigo, key, display_name)
        except Exception as exc:
            logger.error("Falló moneda %s: %s", codigo, exc)
            failed.append(codigo)
    if failed:
        logger.warning("Monedas con error: %s", ", ".join(failed))
    return results


def main() -> None:
    fetch_monedas_latam()


if __name__ == "__main__":
    main()
