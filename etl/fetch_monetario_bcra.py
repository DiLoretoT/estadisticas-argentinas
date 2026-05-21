"""
Fetcher de indicadores monetarios del BCRA.

Usa la API oficial v4.0 (Principales Variables).
  Base: https://api.bcra.gob.ar/estadisticas/v4.0/Monetarias/{idVariable}
  Auth: no requiere.
  Paginación: ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD&limit=1000&offset=0

Series ingestadas (idVariable confirmado al 2026-05):
  - 15  Base Monetaria total (millones de pesos)
  - 1   Reservas Internacionales (USD millones)
  - 160 Tasa de Política Monetaria (% nominal anual)
  - 35  BADLAR bancos privados (% nominal anual)
  - 12  Tasa depósitos a 30 días (% nominal anual)
  - 25  M2 privado, var. % interanual (proxy de crecimiento monetario)
  - 29  REM expectativas de inflación mediana 12m (% interanual)

Output por serie:
  - data/series/monetario_<key>_diario.json
  - data/series/monetario_<key>_mensual.json (cierre de mes)
  - data/monetario_<key>.json (summary)
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

# (idVariable, key_interno, display_name, unit_str, source_label)
_SERIES: list[tuple[int, str, str, str, str]] = [
    (15, "base_monetaria", "Base Monetaria", "millones_pesos", "BCRA"),
    (1, "reservas", "Reservas Internacionales BCRA", "millones_USD", "BCRA"),
    (160, "tpm", "Tasa de Política Monetaria", "porcentaje_anual", "BCRA"),
    (35, "badlar", "BADLAR bancos privados", "porcentaje_anual", "BCRA"),
    (12, "plazo_fijo_30d", "Tasa depósitos plazo fijo 30 días", "porcentaje_anual", "BCRA"),
    (25, "m2_privado_yoy", "M2 privado — variación interanual", "porcentaje_yoy", "BCRA"),
    (29, "rem_inflacion_12m", "REM expectativas inflación 12m", "porcentaje_yoy", "BCRA-REM"),
]

_BCRA_BASE = "https://api.bcra.gob.ar/estadisticas/v4.0/Monetarias"
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


def _fetch_bcra_pages(
    id_variable: int, start: date, end: date
) -> list[tuple[date, float]]:
    """Pega contra /Monetarias/{idVariable} paginando hasta agotar resultados.

    El payload tiene la estructura:
      {"results": [{"idVariable": N, "detalle": [{"fecha":..., "valor":...}]}]}
    O en algunas versiones:
      {"results": [{"fecha":..., "valor":...}]}
    Manejamos ambas.
    """
    url = f"{_BCRA_BASE}/{id_variable}"
    all_points: list[tuple[date, float]] = []
    offset = 0
    while True:
        params = {
            "desde": start.isoformat(),
            "hasta": end.isoformat(),
            "limit": _PAGE_LIMIT,
            "offset": offset,
        }
        payload = _http_get_json(url, params=params)
        results = payload.get("results", [])

        # Normalizamos a una lista plana de {fecha, valor}
        flat: list[dict[str, Any]] = []
        for row in results:
            if "detalle" in row and isinstance(row["detalle"], list):
                flat.extend(row["detalle"])
            elif "fecha" in row:
                flat.append(row)

        for entry in flat:
            fecha = entry.get("fecha")
            valor = entry.get("valor")
            if not fecha or valor is None:
                continue
            try:
                v = float(valor)
            except (ValueError, TypeError):
                continue
            try:
                d = _parse_date(fecha)
            except ValueError:
                continue
            all_points.append((d, v))

        # Salimos si la página vino con menos items que el límite.
        page_size = len(flat) if flat else len(results)
        if page_size < _PAGE_LIMIT:
            break
        offset += _PAGE_LIMIT

    return sorted(all_points, key=lambda item: item[0])


def _fetch_one(
    id_variable: int,
    key: str,
    display_name: str,
    unit: str,
    source_label: str,
) -> dict[str, Any]:
    series_key = f"monetario_{key}"
    run_id: int | None = None
    diario_file = f"monetario_{key}_diario.json"
    mensual_file = f"monetario_{key}_mensual.json"
    summary_file = f"monetario_{key}.json"

    upsert_series(
        series_id=series_key,
        display_name=display_name,
        source_name=source_label,
        dataset=f"estadisticas/v4.0/Monetarias/{id_variable}",
        official=True,
        frequency="daily",
        unit=unit,
        provider_series_id=str(id_variable),
    )
    run_id = start_refresh_run(series_key)

    try:
        history = read_series(diario_file)
        if history:
            last_date = history[-1][0]
            if isinstance(last_date, date):
                start = last_date + timedelta(days=1)
            else:
                start = _parse_date(str(last_date)) + timedelta(days=1)
            start = max(start, _parse_date(_DEFAULT_START))
        else:
            start = _parse_date(_DEFAULT_START)

        end = date.today()
        new_points: list[tuple[date, float]] = []
        if start <= end:
            new_points = _fetch_bcra_pages(id_variable, start, end)

        merged_map: dict[date, float] = {}
        for d, v in history:
            d_obj = d if isinstance(d, date) else _parse_date(str(d))
            merged_map[d_obj] = v
        for d, v in new_points:
            merged_map[d] = v
        merged = sorted(merged_map.items(), key=lambda item: item[0])
        write_series(diario_file, merged)

        monthly_points = _aggregate_month_end(merged)
        write_series(mensual_file, monthly_points)

        rows_upserted = upsert_observations(series_key, merged)
        logger.info(
            "%s (id=%d): %d puntos diarios, %d mensuales, %d upserted",
            series_key,
            id_variable,
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
                "unit": unit,
                "source": {"name": source_label, "official": True},
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
            "unit": unit,
            "source": {"name": source_label, "official": True},
        }

        finish_refresh_run(run_id, "success", rows_upserted, None)
        update_series_refresh_status(
            series_key, "success", latest_date, len(merged), None
        )
        if os.getenv("ETL_EXPORT_JSON", "1") == "1":
            write_json(summary_file, payload_out)
        return payload_out

    except Exception as exc:
        logger.exception("Error fetcheando monetario id=%d", id_variable)
        if run_id is not None:
            finish_refresh_run(run_id, "error", 0, str(exc))
            update_series_refresh_status(series_key, "error", None, 0, str(exc))
        raise


def fetch_monetario_bcra() -> dict[str, Any]:
    init_db()
    results: dict[str, Any] = {}
    failed: list[str] = []
    for id_variable, key, display_name, unit, source_label in _SERIES:
        try:
            results[key] = _fetch_one(
                id_variable, key, display_name, unit, source_label
            )
        except Exception as exc:
            logger.error("Falló serie monetaria id=%d: %s", id_variable, exc)
            failed.append(str(id_variable))
    if failed:
        logger.warning("Series monetarias con error: %s", ", ".join(failed))
    return results


def main() -> None:
    fetch_monetario_bcra()


if __name__ == "__main__":
    main()
