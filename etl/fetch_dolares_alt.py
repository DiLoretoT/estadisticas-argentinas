"""
Fetcher para los dólares alternativos de Argentina via argentinadatos.com.

Cubre: blue, MEP (bolsa), CCL (contadoconliqui), mayorista, cripto, tarjeta.
El dólar oficial sigue obteniéndose via BCRA (fetch_dolar.py) por confiabilidad.

Para cada casa escribe:
  - data/series/dolar_<key>_diario.json
  - data/series/dolar_<key>_mensual.json
  - data/dolar_<key>.json (summary)
"""

from __future__ import annotations

import logging
import os
from datetime import date, datetime
from typing import Any

import certifi
import requests

from common import merge_series_points, now_iso, today_iso, write_json
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

# Casas de argentinadatos.com a ingerir, en orden de relevancia.
# Cada entrada: (casa_api, key_interno, display_name).
_CASAS: list[tuple[str, str, str]] = [
    ("blue", "blue", "Dólar blue"),
    ("bolsa", "mep", "Dólar MEP (bolsa)"),
    ("contadoconliqui", "ccl", "Dólar CCL (contado con liqui)"),
    ("mayorista", "mayorista", "Dólar mayorista"),
    ("cripto", "cripto", "Dólar cripto"),
    ("tarjeta", "tarjeta", "Dólar tarjeta / turista"),
]

_API_BASE = "https://api.argentinadatos.com/v1/cotizaciones/dolares"


def _parse_date(value: str) -> date:
    return datetime.strptime(value, "%Y-%m-%d").date()


def _http_get_json(url: str) -> Any:
    allow_insecure = os.getenv("ALLOW_INSECURE_SSL") == "1"
    verify = False if allow_insecure else certifi.where()
    resp = requests.get(url, timeout=30, verify=verify)
    resp.raise_for_status()
    return resp.json()


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


def _fetch_casa(casa_api: str, key: str, display_name: str) -> dict[str, Any]:
    """Fetch one casa and persist diario + mensual + summary JSONs."""

    series_key = f"dolar_{key}"
    run_id: int | None = None
    diario_file = f"dolar_{key}_diario.json"
    mensual_file = f"dolar_{key}_mensual.json"
    summary_file = f"dolar_{key}.json"

    upsert_series(
        series_id=series_key,
        display_name=display_name,
        source_name="ArgentinaDatos",
        dataset=f"cotizaciones/dolares/{casa_api}",
        official=False,
        frequency="daily",
        unit="pesos_por_dolar",
        provider_series_id=casa_api,
    )
    run_id = start_refresh_run(series_key)

    try:
        url = f"{_API_BASE}/{casa_api}"
        payload = _http_get_json(url)

        points: list[tuple[date, float]] = []
        for row in payload:
            fecha = row.get("fecha")
            venta = row.get("venta")
            if not fecha or venta is None:
                continue
            try:
                points.append((_parse_date(fecha), float(venta)))
            except (ValueError, TypeError):
                logger.warning("Punto inválido en %s: %s", casa_api, row)
                continue

        history = read_series(diario_file)
        merged = merge_series_points(history, points)
        write_series(diario_file, merged)

        monthly_points = _aggregate_month_end(merged)
        write_series(mensual_file, monthly_points)

        rows_upserted = upsert_observations(series_key, merged)
        logger.info(
            "%s (%s): %d puntos diarios, %d puntos mensuales, %d filas upserted",
            series_key,
            casa_api,
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
                "source": {"name": "ArgentinaDatos", "official": False},
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
            "value": round(latest_value, 2),
            "monthly_change": monthly_change,
            "source": {"name": "ArgentinaDatos", "official": False},
        }

        finish_refresh_run(run_id, "success", rows_upserted, None)
        update_series_refresh_status(
            series_key, "success", latest_date, len(merged), None
        )
        if os.getenv("ETL_EXPORT_JSON", "1") == "1":
            write_json(summary_file, payload_out)
        return payload_out

    except Exception as exc:
        logger.exception("Error fetcheando %s", casa_api)
        if run_id is not None:
            finish_refresh_run(run_id, "error", 0, str(exc))
            update_series_refresh_status(series_key, "error", None, 0, str(exc))
        raise


def fetch_dolares_alt() -> dict[str, Any]:
    """Fetch all alternative dollars and return a combined summary."""
    init_db()

    results: dict[str, Any] = {}
    failed: list[str] = []
    for casa_api, key, display_name in _CASAS:
        try:
            results[key] = _fetch_casa(casa_api, key, display_name)
        except Exception as exc:
            logger.error("Falló casa %s: %s", casa_api, exc)
            failed.append(casa_api)

    if failed:
        logger.warning("Casas con error: %s", ", ".join(failed))

    return results


def main() -> None:
    fetch_dolares_alt()


if __name__ == "__main__":
    main()
