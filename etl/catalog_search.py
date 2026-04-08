from __future__ import annotations

import sys
from datetime import date
from typing import Any

from common import http_get_json

SEARCH_URL = "https://apis.datos.gob.ar/series/api/search"


def _parse_date(value: str | None) -> date | None:
  if not value:
    return None
  try:
    return date.fromisoformat(value)
  except ValueError:
    return None


def _extract_rows(payload: dict[str, Any]) -> list[dict[str, Any]]:
  if "results" in payload and isinstance(payload["results"], list):
    return payload["results"]

  data = payload.get("data")
  if isinstance(data, list):
    # If data is list of dicts, return as-is
    if data and isinstance(data[0], dict):
      return data
    # If data is list of lists, map using meta.fields
    meta = payload.get("meta") or {}
    fields = meta.get("fields")
    if isinstance(fields, list):
      rows = []
      for row in data:
        if not isinstance(row, list):
          continue
        rows.append({fields[i]: row[i] for i in range(min(len(fields), len(row)))})
      return rows
  return []


def search(keyword_list: list[str], start_year: int) -> list[dict[str, Any]]:
  query = " ".join(keyword_list)
  payload = http_get_json(
    SEARCH_URL, params={"q": query, "format": "json", "limit": 2000}
  )
  rows = _extract_rows(payload)

  results = []
  for row in rows:
    title = (
      row.get("titulo")
      or row.get("title")
      or row.get("serie_titulo")
      or ""
    ).lower()
    description = (
      row.get("descripcion")
      or row.get("description")
      or row.get("serie_descripcion")
      or ""
    ).lower()
    start_date = _parse_date(
      row.get("start_date")
      or row.get("serie_indice_inicio")
      or row.get("serie_inicio")
    )
    if start_date and start_date.year > start_year:
      continue
    hay = f"{title} {description}"
    if any(k in hay for k in keyword_list):
      results.append(row)
  return results


def main() -> None:
  if len(sys.argv) < 3:
    print("Uso: python catalog_search.py <anio_inicio> <keyword1> [keyword2 ...]")
    raise SystemExit(1)

  start_year = int(sys.argv[1])
  keywords = [k.lower() for k in sys.argv[2:]]
  rows = search(keywords, start_year)
  print(f"Encontradas {len(rows)} series")
  if rows:
    print("Claves disponibles:", ", ".join(sorted({key for row in rows[:3] for key in row.keys()})))
  for row in rows[:50]:
    series_id = row.get("id") or row.get("serie_id")
    title = row.get("title") or row.get("titulo") or row.get("serie_titulo") or ""
    start = (
      row.get("start_date")
      or row.get("serie_indice_inicio")
      or row.get("serie_inicio")
    )
    end = (
      row.get("end_date")
      or row.get("serie_indice_final")
      or row.get("serie_fin")
    )
    print(f"- {series_id} | {title} | {start} -> {end}")


if __name__ == "__main__":
  main()
