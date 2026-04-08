from __future__ import annotations

import json
from datetime import date
from pathlib import Path
from typing import Any

from common import today_iso, write_json
from series_store import read_series, write_series

BASE_DIR = Path(__file__).resolve().parent
SOURCES_PATH = BASE_DIR / "sources.json"


def _load_sources() -> dict[str, Any]:
  with SOURCES_PATH.open("r", encoding="utf-8") as handle:
    return json.load(handle)


def _splice_ratio(
  base: list[tuple[date, float]],
  incoming: list[tuple[date, float]],
) -> list[tuple[date, float]]:
  if not base:
    return incoming
  if not incoming:
    return base

  base_map = {d: v for d, v in base}
  overlap = [d for d, _ in incoming if d in base_map]
  ratio = None
  if overlap:
    last_overlap = overlap[-1]
    if base_map[last_overlap] != 0:
      ratio = base_map[last_overlap] / dict(incoming)[last_overlap]

  adjusted = []
  for d, v in incoming:
    if ratio is not None:
      adjusted.append((d, v * ratio))
    else:
      adjusted.append((d, v))

  merged = {d: v for d, v in base}
  for d, v in adjusted:
    if d not in merged:
      merged[d] = v
  return sorted(merged.items(), key=lambda item: item[0])


def build_empalme() -> dict[str, Any]:
  sources = _load_sources()
  cfg = sources.get("inflacion_empalme", {})
  segments = cfg.get("segments") or ["inflacion_mensual.json"]
  method = cfg.get("method", "splice_ratio")

  series: list[tuple[date, float]] = []
  for name in segments:
    points = read_series(name)
    if method == "splice_ratio":
      series = _splice_ratio(series, points)
    else:
      series = series + [p for p in points if p not in series]
      series = sorted(series, key=lambda item: item[0])

  write_series("inflacion_empalmada.json", series)

  return {
    "updated_at": today_iso(),
    "segments": segments,
    "method": method,
    "points": len(series),
  }


def main() -> None:
  payload = build_empalme()
  write_json("inflacion_empalme.json", payload)


if __name__ == "__main__":
  main()
