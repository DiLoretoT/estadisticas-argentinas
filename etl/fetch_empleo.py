from __future__ import annotations

import logging
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

logger = logging.getLogger(__name__)


def _fetch_one(
  series_key: str,
  display_name: str,
  series_api: str,
  provider_series_id: str,
  file_name: str,
  frequency: str,
) -> tuple[Any, int]:
  """Fetches a single series and persists it. Returns (latest_point_or_None, rows_upserted)."""
  run_id: int | None = None

  init_db()
  upsert_series(
    series_id=series_key,
    display_name=display_name,
    source_name="INDEC",
    dataset="EPH - Encuesta Permanente de Hogares",
    official=True,
    frequency=frequency,
    unit="percent",
    provider_series_id=provider_series_id,
  )
  run_id = start_refresh_run(series_key)

  try:
    history_points = read_series(f"{series_key}.json")
    last_date = history_points[-1][0] if history_points else None

    try:
      points = fetch_series_points_paged(
        series_api,
        provider_series_id,
        extra_params={"sort": "asc"},
        start_date=last_date,
      )
    except requests.HTTPError as exc:
      logger.error("HTTPError al obtener %s: %s", series_key, exc)
      finish_refresh_run(run_id, "error", 0, str(exc))
      update_series_refresh_status(series_key, "error", None, 0, str(exc))
      return None, 0

    points = merge_series_points(history_points, points)
    write_series(f"{series_key}.json", points)
    rows_upserted = upsert_observations(series_key, points)
    logger.info("%s: %d puntos totales, %d filas upserted", series_key, len(points), rows_upserted)

    latest = points[-1] if points else None
    last_date_out = latest[0] if latest else None
    finish_refresh_run(run_id, "success", rows_upserted, None)
    update_series_refresh_status(series_key, "success", last_date_out, len(points), None)
    return latest, rows_upserted

  except Exception as exc:
    logger.exception("Error inesperado en %s", series_key)
    finish_refresh_run(run_id, "error", 0, str(exc))
    update_series_refresh_status(series_key, "error", None, 0, str(exc))
    raise


def fetch_empleo() -> dict[str, Any]:
  sources = load_sources()
  cfg = sources.get("empleo", {})
  series_api = cfg.get("series_api", "")
  desocupacion_id = cfg.get("tasa_desocupacion_id", "")
  empleo_id = cfg.get("tasa_empleo_id", "")

  latest_desocupacion, _ = _fetch_one(
    series_key="tasa_desocupacion",
    display_name="Tasa de desocupación (EPH)",
    series_api=series_api,
    provider_series_id=desocupacion_id,
    file_name="tasa_desocupacion.json",
    frequency="quarterly",
  )
  latest_empleo, _ = _fetch_one(
    series_key="tasa_empleo",
    display_name="Tasa de empleo (EPH)",
    series_api=series_api,
    provider_series_id=empleo_id,
    file_name="tasa_empleo.json",
    frequency="quarterly",
  )

  payload: dict[str, Any] = {
    "updated_at": today_iso(),
    "source": {"name": "INDEC", "official": True},
  }
  if latest_desocupacion:
    payload["tasa_desocupacion"] = {
      "period": latest_desocupacion[0].strftime("%Y-%m-%d"),
      "value": round(latest_desocupacion[1], 2),
    }
  if latest_empleo:
    payload["tasa_empleo"] = {
      "period": latest_empleo[0].strftime("%Y-%m-%d"),
      "value": round(latest_empleo[1], 2),
    }
  return payload


def main() -> None:
  payload = fetch_empleo()
  if os.getenv("ETL_EXPORT_JSON", "1") == "1":
    write_json("empleo.json", payload)


if __name__ == "__main__":
  main()
