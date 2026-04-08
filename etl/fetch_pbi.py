from __future__ import annotations

from datetime import date
from typing import Any

from common import (
  fetch_series_points_paged,
  load_sources,
  merge_series_points,
  today_iso,
  write_json,
)
from series_store import read_series, write_series


def fetch_pbi() -> dict[str, Any]:
  sources = load_sources()
  cfg = sources.get("pbi", {})
  series_api = cfg.get("series_api")
  series_id = cfg.get("series_id_trimestral")

  if not series_api or not series_id or "COMPLETAR" in series_id:
    return {
      "updated_at": None,
      "period": None,
      "value": None,
      "source": {"name": "SSPM/INDEC", "official": True},
    }

  history_points = read_series("pbi_trimestral.json")
  last_date = history_points[-1][0] if history_points else None

  points = fetch_series_points_paged(
    series_api,
    series_id,
    extra_params={"sort": "asc"},
    start_date=last_date,
  )

  points = merge_series_points(history_points, points)
  write_series("pbi_trimestral.json", points)

  if not points:
    return {
      "updated_at": None,
      "period": None,
      "value": None,
      "source": {"name": "SSPM/INDEC", "official": True},
    }

  latest_date, latest_value = points[-1]
  return {
    "updated_at": today_iso(),
    "period": latest_date.strftime("%Y-%m-%d"),
    "value": round(latest_value, 2),
    "source": {"name": "SSPM/INDEC", "official": True},
  }


def main() -> None:
  payload = fetch_pbi()
  write_json("pbi.json", payload)


if __name__ == "__main__":
  main()
