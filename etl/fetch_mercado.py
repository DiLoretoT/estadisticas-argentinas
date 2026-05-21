"""
Fetcher de indicadores de mercado de capitales argentino.

Cubre:
  - Riesgo país EMBI (ArgentinaDatos, fuente declarada Ámbito)
  - S&P Merval ^MERV (Yahoo Finance v8)
  - ADRs principales (Yahoo Finance v8): GGAL, YPF, PAM, BMA, TEO

ArgentinaDatos endpoint:
  https://api.argentinadatos.com/v1/finanzas/indices/riesgo-pais
Yahoo Finance endpoint:
  https://query1.finance.yahoo.com/v8/finance/chart/{ticker}?range=10y&interval=1d

Sin auth, sin rate limit declarado.

Output por serie:
  - data/series/mercado_<key>_diario.json
  - data/series/mercado_<key>_mensual.json (cierre de mes)
  - data/mercado_<key>.json (summary)
"""

from __future__ import annotations

import logging
import os
from datetime import date, datetime
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

# ----------------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------------


def _http_get_json(url: str, params: dict[str, Any] | None = None) -> Any:
    allow_insecure = os.getenv("ALLOW_INSECURE_SSL") == "1"
    verify = False if allow_insecure else certifi.where()
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (compatible; estadisticas-argentinas-bot/1.0; "
            "+https://estadisticas.datalogia.app)"
        )
    }
    resp = requests.get(url, params=params, headers=headers, timeout=30, verify=verify)
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


def _write_summary_and_series(
    key: str,
    display_name: str,
    source_name: str,
    dataset: str,
    unit: str,
    points: list[tuple[date, float]],
    official: bool,
) -> dict[str, Any]:
    """Persistencia común: serie diaria + mensual + summary JSON + Postgres."""

    series_key = f"mercado_{key}"
    diario_file = f"mercado_{key}_diario.json"
    mensual_file = f"mercado_{key}_mensual.json"
    summary_file = f"mercado_{key}.json"

    upsert_series(
        series_id=series_key,
        display_name=display_name,
        source_name=source_name,
        dataset=dataset,
        official=official,
        frequency="daily",
        unit=unit,
        provider_series_id=key,
    )

    # Merge con histórico previo
    history = read_series(diario_file)
    merged_map: dict[date, float] = {}
    for d, v in history:
        d_obj = d if isinstance(d, date) else datetime.strptime(d, "%Y-%m-%d").date()
        merged_map[d_obj] = v
    for d, v in points:
        merged_map[d] = v
    merged = sorted(merged_map.items(), key=lambda item: item[0])

    write_series(diario_file, merged)
    monthly_points = _aggregate_month_end(merged)
    write_series(mensual_file, monthly_points)
    rows_upserted = upsert_observations(series_key, merged)
    logger.info(
        "%s: %d puntos diarios, %d mensuales, %d upserted",
        series_key,
        len(merged),
        len(monthly_points),
        rows_upserted,
    )

    if not merged:
        return {
            "updated_at": None,
            "period": None,
            "value": None,
            "monthly_change": None,
            "unit": unit,
            "source": {"name": source_name, "official": official},
        }

    latest_date, latest_value = merged[-1]
    monthly_change = None
    if len(monthly_points) >= 2:
        prev_value = monthly_points[-2][1]
        if prev_value:
            monthly_change = round(
                ((latest_value - prev_value) / prev_value) * 100, 2
            )

    payload = {
        "updated_at": today_iso(),
        "updated_at_time": now_iso(),
        "period": latest_date.strftime("%Y-%m-%d"),
        "value": round(latest_value, 4),
        "monthly_change": monthly_change,
        "unit": unit,
        "source": {"name": source_name, "official": official},
    }
    if os.getenv("ETL_EXPORT_JSON", "1") == "1":
        write_json(summary_file, payload)
    return payload


# ----------------------------------------------------------------------------
# Riesgo país (ArgentinaDatos)
# ----------------------------------------------------------------------------


def fetch_riesgo_pais() -> dict[str, Any]:
    series_key = "mercado_riesgo_pais"
    run_id = start_refresh_run(series_key)
    try:
        url = "https://api.argentinadatos.com/v1/finanzas/indices/riesgo-pais"
        payload = _http_get_json(url)
        points: list[tuple[date, float]] = []
        for row in payload:
            fecha = row.get("fecha")
            valor = row.get("valor")
            if not fecha or valor is None:
                continue
            try:
                d = datetime.strptime(fecha, "%Y-%m-%d").date()
                v = float(valor)
            except (ValueError, TypeError):
                continue
            points.append((d, v))

        result = _write_summary_and_series(
            key="riesgo_pais",
            display_name="Riesgo país EMBI Argentina",
            source_name="ArgentinaDatos (Ámbito)",
            dataset="finanzas/indices/riesgo-pais",
            unit="puntos_basicos",
            points=points,
            official=False,
        )
        finish_refresh_run(run_id, "success", len(points), None)
        update_series_refresh_status(
            series_key, "success", points[-1][0] if points else None, len(points), None
        )
        return result
    except Exception as exc:
        logger.exception("Error fetcheando riesgo país")
        finish_refresh_run(run_id, "error", 0, str(exc))
        update_series_refresh_status(series_key, "error", None, 0, str(exc))
        raise


# ----------------------------------------------------------------------------
# Yahoo Finance — Merval + ADRs
# ----------------------------------------------------------------------------

_YF_TICKERS: list[tuple[str, str, str, str]] = [
    # (yahoo_ticker, key_interno, display_name, unit)
    ("^MERV", "merval", "S&P Merval (ARS)", "indice_ars"),
    ("GGAL", "ggal", "Grupo Galicia ADR (USD)", "usd"),
    ("YPF", "ypf", "YPF ADR (USD)", "usd"),
    ("PAM", "pam", "Pampa Energía ADR (USD)", "usd"),
    ("BMA", "bma", "Banco Macro ADR (USD)", "usd"),
    ("TEO", "teo", "Telecom Argentina ADR (USD)", "usd"),
]


def _fetch_yahoo_ticker(ticker: str) -> list[tuple[date, float]]:
    """Trae ~10 años de cierres diarios de Yahoo Finance v8."""
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
    payload = _http_get_json(url, params={"range": "10y", "interval": "1d"})
    chart = payload.get("chart", {})
    results = chart.get("result", [])
    if not results:
        return []
    result = results[0]
    timestamps = result.get("timestamp", [])
    indicators = result.get("indicators", {}).get("quote", [])
    if not indicators or not timestamps:
        return []
    closes = indicators[0].get("close", [])
    points: list[tuple[date, float]] = []
    for ts, close in zip(timestamps, closes):
        if close is None:
            continue
        try:
            d = datetime.utcfromtimestamp(ts).date()
            v = float(close)
        except (ValueError, TypeError, OSError):
            continue
        points.append((d, v))
    return points


def fetch_yahoo_series() -> dict[str, Any]:
    results: dict[str, Any] = {}
    failed: list[str] = []
    for yahoo_ticker, key, display_name, unit in _YF_TICKERS:
        series_key = f"mercado_{key}"
        run_id = start_refresh_run(series_key)
        try:
            points = _fetch_yahoo_ticker(yahoo_ticker)
            results[key] = _write_summary_and_series(
                key=key,
                display_name=display_name,
                source_name="Yahoo Finance",
                dataset=f"v8/finance/chart/{yahoo_ticker}",
                unit=unit,
                points=points,
                official=False,
            )
            finish_refresh_run(run_id, "success", len(points), None)
            update_series_refresh_status(
                series_key,
                "success",
                points[-1][0] if points else None,
                len(points),
                None,
            )
        except Exception as exc:
            logger.error("Falló %s (%s): %s", yahoo_ticker, key, exc)
            finish_refresh_run(run_id, "error", 0, str(exc))
            update_series_refresh_status(series_key, "error", None, 0, str(exc))
            failed.append(yahoo_ticker)
    if failed:
        logger.warning("Yahoo tickers con error: %s", ", ".join(failed))
    return results


# ----------------------------------------------------------------------------
# Orquestador
# ----------------------------------------------------------------------------


def fetch_mercado() -> dict[str, Any]:
    init_db()
    results: dict[str, Any] = {}

    try:
        results["riesgo_pais"] = fetch_riesgo_pais()
    except Exception as exc:
        logger.error("Riesgo país falló: %s", exc)

    results.update(fetch_yahoo_series())
    return results


def main() -> None:
    fetch_mercado()


if __name__ == "__main__":
    main()
