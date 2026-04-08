from __future__ import annotations

import os
from datetime import date
from typing import Any

from common import (
  fetch_series_points_paged,
  load_sources,
  merge_series_points,
  today_iso,
  write_json,
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


def _value_for_month(points: list[tuple[date, float]], target: date) -> float | None:
  for point_date, value in reversed(points):
    if point_date.year == target.year and point_date.month == target.month:
      return value
  return None


def _ytd_from_monthly(points: list[tuple[date, float]], year: int) -> float | None:
  year_points = [value for point_date, value in points if point_date.year == year]
  if not year_points:
    return None
  total = 1.0
  for monthly_rate in year_points:
    total *= 1 + monthly_rate
  return (total - 1) * 100


def fetch_inflacion() -> dict[str, Any]:
  series_key = "inflacion"
  run_id: int | None = None
  sources = load_sources()
  inflacion_cfg = sources.get("inflacion", {})
  series_api = inflacion_cfg.get("series_api")
  monthly_id = inflacion_cfg.get("series_id_mensual")

  init_db()
  upsert_series(
    series_id=series_key,
    display_name="Inflacion mensual (IPC)",
    source_name="INDEC (IPC)",
    dataset="Series de Tiempo - datos.gob.ar",
    official=True,
    frequency="monthly",
    unit="percent_change",
    provider_series_id=monthly_id,
  )
  run_id = start_refresh_run(series_key)

  if not series_api or not monthly_id:
    payload = {
      "updated_at": None,
      "monthly": {"period": None, "value": None, "vs_prev_month": None, "vs_prev_year": None},
      "ytd": {"period": None, "value": None},
      "source": {"name": "INDEC (IPC)", "dataset": "Series de Tiempo - datos.gob.ar", "official": True},
    }
    finish_refresh_run(run_id, "error", 0, "Falta configuracion de inflacion en sources.json")
    update_series_refresh_status(series_key, "error", None, 0, "Falta configuracion de inflacion")
    return payload

  try:
    history_points = read_series("inflacion_mensual.json")
    last_date = history_points[-1][0] if history_points else None
    start_date = last_date if last_date else None

    new_points = fetch_series_points_paged(
      series_api,
      monthly_id,
      extra_params={
        "representation_mode": "percent_change",
        "sort": "asc",
      },
      start_date=start_date,
    )

    monthly_points = merge_series_points(history_points, new_points)
    write_series("inflacion_mensual.json", monthly_points)
    rows_upserted = upsert_observations(series_key, monthly_points)

    if not monthly_points:
      payload = {
        "updated_at": None,
        "monthly": {"period": None, "value": None, "vs_prev_month": None, "vs_prev_year": None},
        "ytd": {"period": None, "value": None},
        "source": {"name": "INDEC (IPC)", "dataset": "Series de Tiempo - datos.gob.ar", "official": True},
      }
      finish_refresh_run(run_id, "success", rows_upserted, None)
      update_series_refresh_status(series_key, "success", None, 0, None)
      return payload

    latest_date, latest_value = monthly_points[-1]
    prev_month_value = monthly_points[-2][1] if len(monthly_points) >= 2 else None
    prev_year_value = _value_for_month(
      monthly_points,
      date(latest_date.year - 1, latest_date.month, 1),
    )

    vs_prev_month = (
      (latest_value - prev_month_value) * 100 if prev_month_value is not None else None
    )
    vs_prev_year = (
      (latest_value - prev_year_value) * 100 if prev_year_value is not None else None
    )

    ytd_value = _ytd_from_monthly(monthly_points, latest_date.year)

    payload = {
      "updated_at": today_iso(),
      "monthly": {
        "period": latest_date.strftime("%Y-%m"),
        "value": round(latest_value * 100, 2),
        "vs_prev_month": round(vs_prev_month, 2) if vs_prev_month is not None else None,
        "vs_prev_year": round(vs_prev_year, 2) if vs_prev_year is not None else None,
      },
      "ytd": {
        "period": latest_date.strftime("%Y-%m"),
        "value": round(ytd_value, 2) if ytd_value is not None else None,
      },
      "source": {"name": "INDEC (IPC)", "dataset": "Series de Tiempo - datos.gob.ar", "official": True},
    }

    finish_refresh_run(run_id, "success", rows_upserted, None)
    update_series_refresh_status(series_key, "success", latest_date, len(monthly_points), None)
    return payload
  except Exception as exc:
    finish_refresh_run(run_id, "error", 0, str(exc))
    update_series_refresh_status(series_key, "error", None, 0, str(exc))
    raise


def main() -> None:
  payload = fetch_inflacion()
  if os.getenv("ETL_EXPORT_JSON", "1") == "1":
    write_json("inflacion.json", payload)


if __name__ == "__main__":
  main()
