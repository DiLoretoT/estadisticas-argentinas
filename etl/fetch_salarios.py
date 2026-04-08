from __future__ import annotations

from typing import Any

from common import fetch_series_points_paged, load_sources, merge_series_points
from series_store import read_series, write_series


def _fetch_series(
  series_api: str,
  series_id: str,
  file_name: str,
  percent_change: bool = True,
) -> None:
  history_points = read_series(file_name)
  last_date = history_points[-1][0] if history_points else None

  extra_params = {"sort": "asc"}
  if percent_change:
    extra_params["representation_mode"] = "percent_change"

  new_points = fetch_series_points_paged(
    series_api,
    series_id,
    extra_params=extra_params,
    start_date=last_date,
  )

  merged = merge_series_points(history_points, new_points)
  write_series(file_name, merged)


def fetch_salarios() -> dict[str, Any]:
  sources = load_sources()
  cfg = sources.get("salarios", {})
  series_api = cfg.get("series_api")
  ripte_id = cfg.get("ripte_id")
  indice_id = cfg.get("indice_salarios_id")

  if not series_api or not ripte_id or not indice_id:
    return {"ok": False}

  _fetch_series(series_api, ripte_id, "ripte_mensual.json")
  _fetch_series(series_api, ripte_id, "ripte_nivel.json", percent_change=False)
  _fetch_series(series_api, indice_id, "salarios_mensual.json")
  _fetch_series(series_api, indice_id, "salarios_indice.json", percent_change=False)
  return {"ok": True}


def main() -> None:
  fetch_salarios()


if __name__ == "__main__":
  main()
