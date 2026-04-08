from __future__ import annotations

import json
from datetime import date
from pathlib import Path
from typing import Any

from common import parse_series_points

BASE_DIR = Path(__file__).resolve().parent
SERIES_DIR = BASE_DIR.parent / "data" / "series"


def read_series(file_name: str) -> list[tuple[date, float]]:
  path = SERIES_DIR / file_name
  if not path.exists():
    return []
  with path.open("r", encoding="utf-8") as handle:
    payload = json.load(handle)
  if isinstance(payload, dict) and "data" in payload:
    return parse_series_points(payload)
  if isinstance(payload, list):
    points: list[tuple[date, float]] = []
    for row in payload:
      if not row or row[0] in ("date", "fecha") or row[1] is None:
        continue
      points.append((date.fromisoformat(row[0]), float(row[1])))
    return points
  return []


def write_series(file_name: str, points: list[tuple[date, float]]) -> None:
  SERIES_DIR.mkdir(parents=True, exist_ok=True)
  payload = [[point_date.isoformat(), value] for point_date, value in points]
  path = SERIES_DIR / file_name
  with path.open("w", encoding="utf-8") as handle:
    json.dump(payload, handle, ensure_ascii=False, indent=2)
