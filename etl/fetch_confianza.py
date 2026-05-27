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
  dataset: str,
) -> tuple[Any, int]:
  """Fetches a single confidence/expectations index and persists it.

  Devuelve (último_punto_o_None, filas_upserted). A diferencia de los
  indicadores oficiales del INDEC, estas series provienen de la UTDT
  (re-publicadas vía datos.gob.ar) — son consenso/encuesta, NO oficiales.
  """
  run_id: int | None = None

  init_db()
  upsert_series(
    series_id=series_key,
    display_name=display_name,
    source_name="UTDT",
    dataset=dataset,
    official=False,
    frequency="monthly",
    unit="index",
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


def fetch_confianza() -> dict[str, Any]:
  sources = load_sources()
  cfg = sources.get("confianza", {})
  series_api = cfg.get("series_api", "")
  icg_id = cfg.get("icg_id", "")
  icc_id = cfg.get("icc_id", "")

  latest_icg, _ = _fetch_one(
    series_key="icg_mensual",
    display_name="ICG — Índice de Confianza en el Gobierno (UTDT)",
    series_api=series_api,
    provider_series_id=icg_id,
    dataset="Índice de Confianza en el Gobierno (UTDT, vía datos.gob.ar)",
  )
  latest_icc, _ = _fetch_one(
    series_key="icc_mensual",
    display_name="ICC — Índice de Confianza del Consumidor (UTDT)",
    series_api=series_api,
    provider_series_id=icc_id,
    dataset="Índice de Confianza del Consumidor (UTDT, vía datos.gob.ar)",
  )

  payload: dict[str, Any] = {
    "updated_at": today_iso(),
    "source": {"name": "UTDT", "official": False, "via": "datos.gob.ar"},
  }
  if latest_icg:
    payload["icg"] = {
      "period": latest_icg[0].strftime("%Y-%m-%d"),
      "value": round(latest_icg[1], 4),
    }
  if latest_icc:
    payload["icc"] = {
      "period": latest_icc[0].strftime("%Y-%m-%d"),
      "value": round(latest_icc[1], 4),
    }
  return payload


def main() -> None:
  payload = fetch_confianza()
  if os.getenv("ETL_EXPORT_JSON", "1") == "1":
    write_json("confianza.json", payload)


if __name__ == "__main__":
  main()
