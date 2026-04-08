from __future__ import annotations

import os
from datetime import date, datetime
from typing import Any

from common import (
  fetch_series_points_paged,
  http_get_json,
  load_sources,
  merge_series_points,
  today_iso,
  write_json,
  now_iso,
)
from db import (
  finish_refresh_run,
  init_db,
  start_refresh_run,
  update_series_refresh_status,
  upsert_observations,
  upsert_series,
)
from series_store import read_series, write_series
import requests


def _parse_date(value: str) -> date:
  return datetime.strptime(value, "%Y-%m-%d").date()


def _aggregate_month_end(points: list[tuple[date, float]]) -> list[tuple[date, float]]:
  if not points:
    return []
  monthly: dict[tuple[int, int], tuple[date, float]] = {}
  for point_date, value in points:
    key = (point_date.year, point_date.month)
    current = monthly.get(key)
    if current is None or point_date > current[0]:
      monthly[key] = (point_date, value)
  return sorted(monthly.values(), key=lambda item: item[0])


def _fetch_bcra_usd_series(
  base_url: str, start_date: date, end_date: date, limit: int = 1000
) -> list[tuple[date, float]]:
  points: list[tuple[date, float]] = []
  offset = 0
  total = None

  while True:
    try:
      payload = http_get_json(
        f"{base_url}Cotizaciones/USD",
        params={
          "fechadesde": start_date.isoformat(),
          "fechahasta": end_date.isoformat(),
          "limit": limit,
          "offset": offset,
        },
      )
    except requests.exceptions.SSLError:
      break

    results = payload.get("results", [])
    meta = payload.get("metadata", {})
    resultset = meta.get("resultset", {}) if isinstance(meta, dict) else {}
    total = resultset.get("count", total)

    for item in results:
      fecha = item.get("fecha")
      detalle = item.get("detalle", [])
      if not fecha or not detalle:
        continue
      for row in detalle:
        code = str(row.get("codigoMoneda") or "").upper()
        if code != "USD":
          continue
        value = row.get("tipoCotizacion")
        if value is None:
          continue
        points.append((_parse_date(fecha), float(value)))
        break

    if total is None:
      break
    offset += limit
    if offset >= total:
      break

  return points


def _latest_point(
  series_api: str, series_id: str, extra_params: dict[str, Any] | None = None
) -> tuple[date | None, float | None]:
  points = fetch_series_points_paged(
    series_api,
    series_id,
    extra_params={"sort": "desc", "limit": 1, **(extra_params or {})},
  )
  if not points:
    return None, None
  return points[0]


def fetch_dolar_oficial() -> dict[str, Any]:
  series_key = "dolar_oficial"
  run_id: int | None = None
  sources = load_sources()
  cfg = sources.get("dolar_oficial", {})
  bcra_base = cfg.get("bcra_base")
  bcra_start = cfg.get("bcra_start")
  series_api = cfg.get("series_api")
  series_id = cfg.get("series_id")

  init_db()
  upsert_series(
    series_id=series_key,
    display_name="Dolar oficial (BNA vendedor)",
    source_name="BCRA",
    dataset="Estadisticas cambiarias BCRA / Series de Tiempo datos.gob.ar",
    official=True,
    frequency="monthly",
    unit="ars",
    provider_series_id=series_id,
  )
  run_id = start_refresh_run(series_key)

  if not bcra_base and (not series_api or not series_id):
    payload = {
      "updated_at": None,
      "updated_at_time": None,
      "period": None,
      "value": None,
      "monthly_change": None,
      "source": {"name": "BCRA", "official": True},
    }
    finish_refresh_run(run_id, "error", 0, "Falta configuracion de dolar_oficial en sources.json")
    update_series_refresh_status(series_key, "error", None, 0, "Falta configuracion de dolar_oficial")
    return payload

  try:
    if bcra_base and bcra_start:
      history_daily = read_series("dolar_oficial_diario.json")
      last_daily = history_daily[-1][0] if history_daily else None
      start_date = last_daily if last_daily else _parse_date(bcra_start)
      end_date = date.today()

      try:
        daily_points = _fetch_bcra_usd_series(bcra_base, start_date, end_date)
      except requests.exceptions.SSLError:
        daily_points = []

      daily_points = merge_series_points(history_daily, daily_points)
      write_series("dolar_oficial_diario.json", daily_points)

      monthly_points = _aggregate_month_end(daily_points)
      write_series("dolar_oficial_mensual.json", monthly_points)
      rows_upserted = upsert_observations(series_key, monthly_points)

      latest_date, latest_value = daily_points[-1] if daily_points else (None, None)
      monthly_period = (
        monthly_points[-1][0].strftime("%Y-%m-%d") if monthly_points else None
      )
      prev_value = monthly_points[-2][1] if len(monthly_points) >= 2 else None
      monthly_change = (
        round(((monthly_points[-1][1] - prev_value) / prev_value) * 100, 2)
        if prev_value
        else None
      )

      payload = {
        "updated_at": today_iso(),
        "updated_at_time": now_iso(),
        "period": latest_date.strftime("%Y-%m-%d") if latest_date else None,
        "monthly_period": monthly_period,
        "value": round(latest_value, 2) if latest_value is not None else None,
        "monthly_change": monthly_change,
        "source": {"name": "BCRA", "official": True},
      }
      status_last_date = monthly_points[-1][0] if monthly_points else None
      update_series_refresh_status(
        series_key,
        "success",
        status_last_date,
        len(monthly_points),
        None,
      )
      finish_refresh_run(run_id, "success", rows_upserted, None)
      return payload

    history_points = read_series("dolar_oficial_mensual.json")
    last_date = history_points[-1][0] if history_points else None
    start_date = last_date if last_date else None

    points = fetch_series_points_paged(
      series_api,
      series_id,
      extra_params={
        "collapse": cfg.get("collapse", "month"),
        "collapse_aggregation": cfg.get("collapse_aggregation", "end_of_period"),
        "sort": "asc",
      },
      start_date=start_date,
    )

    points = merge_series_points(history_points, points)
    write_series("dolar_oficial_mensual.json", points)
    rows_upserted = upsert_observations(series_key, points)

    latest_date, latest_value = _latest_point(series_api, series_id)
    monthly_period = points[-1][0].strftime("%Y-%m-%d") if points else None

    if len(points) < 1:
      payload = {
        "updated_at": None,
        "updated_at_time": None,
        "period": latest_date.strftime("%Y-%m-%d") if latest_date else None,
        "monthly_period": monthly_period,
        "value": round(latest_value, 2) if latest_value is not None else None,
        "monthly_change": None,
        "source": {"name": "Datos.gob.ar (BCRA/BNA)", "official": True},
      }
      update_series_refresh_status(series_key, "success", None, 0, None)
      finish_refresh_run(run_id, "success", rows_upserted, None)
      return payload

    prev_value = points[-2][1] if len(points) >= 2 else None
    monthly_change = (
      round(((points[-1][1] - prev_value) / prev_value) * 100, 2)
      if prev_value
      else None
    )

    payload = {
      "updated_at": today_iso(),
      "updated_at_time": now_iso(),
      "period": latest_date.strftime("%Y-%m-%d") if latest_date else None,
      "monthly_period": monthly_period,
      "value": round(latest_value, 2) if latest_value is not None else None,
      "monthly_change": monthly_change,
      "source": {"name": "Datos.gob.ar (BCRA/BNA)", "official": True},
    }
    status_last_date = points[-1][0] if points else None
    update_series_refresh_status(series_key, "success", status_last_date, len(points), None)
    finish_refresh_run(run_id, "success", rows_upserted, None)
    return payload
  except Exception as exc:
    finish_refresh_run(run_id, "error", 0, str(exc))
    update_series_refresh_status(series_key, "error", None, 0, str(exc))
    raise


def main() -> None:
  payload = fetch_dolar_oficial()
  if os.getenv("ETL_EXPORT_JSON", "1") == "1":
    write_json("dolar_oficial.json", payload)


if __name__ == "__main__":
  main()
