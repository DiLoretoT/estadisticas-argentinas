from __future__ import annotations

import os
from typing import Any

import requests

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


def fetch_emae() -> dict[str, Any]:
  series_key = "emae"
  run_id: int | None = None
  sources = load_sources()
  cfg = sources.get("emae", {})
  series_api = cfg.get("series_api")
  series_id = cfg.get("series_id")

  init_db()
  upsert_series(
    series_id=series_key,
    display_name="EMAE mensual",
    source_name="INDEC",
    dataset="Series de Tiempo - datos.gob.ar",
    official=True,
    frequency="monthly",
    unit="index",
    provider_series_id=series_id,
  )
  run_id = start_refresh_run(series_key)

  if not series_api or not series_id or "COMPLETAR" in series_id:
    payload = {
      "updated_at": None,
      "period": None,
      "value": None,
      "source": {"name": "INDEC", "official": True},
    }
    finish_refresh_run(run_id, "error", 0, "Falta configuracion de emae en sources.json")
    update_series_refresh_status(series_key, "error", None, 0, "Falta configuracion de emae")
    return payload

  try:
    history_points = read_series("emae_mensual.json")
    last_date = history_points[-1][0] if history_points else None

    try:
      points = fetch_series_points_paged(
        series_api,
        series_id,
        extra_params={"sort": "asc"},
        start_date=last_date,
      )
    except requests.HTTPError as exc:
      finish_refresh_run(run_id, "error", 0, str(exc))
      update_series_refresh_status(series_key, "error", None, 0, str(exc))
      return {
        "updated_at": None,
        "period": None,
        "value": None,
        "source": {"name": "INDEC", "official": True},
      }

    points = merge_series_points(history_points, points)
    write_series("emae_mensual.json", points)
    rows_upserted = upsert_observations(series_key, points)

    if not points:
      payload = {
        "updated_at": None,
        "period": None,
        "value": None,
        "source": {"name": "INDEC", "official": True},
      }
      finish_refresh_run(run_id, "success", rows_upserted, None)
      update_series_refresh_status(series_key, "success", None, 0, None)
      return payload

    latest_date, latest_value = points[-1]
    payload = {
      "updated_at": today_iso(),
      "period": latest_date.strftime("%Y-%m-%d"),
      "value": round(latest_value, 2),
      "source": {"name": "INDEC", "official": True},
    }
    finish_refresh_run(run_id, "success", rows_upserted, None)
    update_series_refresh_status(series_key, "success", latest_date, len(points), None)
    return payload
  except Exception as exc:
    finish_refresh_run(run_id, "error", 0, str(exc))
    update_series_refresh_status(series_key, "error", None, 0, str(exc))
    raise


def main() -> None:
  payload = fetch_emae()
  if os.getenv("ETL_EXPORT_JSON", "1") == "1":
    write_json("emae.json", payload)


if __name__ == "__main__":
  main()
