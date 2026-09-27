from __future__ import annotations

import json
from pathlib import Path

from db import get_series_status_rows, init_db

BASE_DIR = Path(__file__).resolve().parent
STATUS_PATH = BASE_DIR.parent / "data" / "status.json"


def _to_iso(value):
  if value is None:
    return None
  if hasattr(value, "isoformat"):
    return value.isoformat()
  return str(value)


def _load_existing() -> list[dict]:
  """Lee el status.json ya commiteado. Si no existe o esta roto, arranca vacio."""
  if not STATUS_PATH.exists():
    return []
  try:
    with STATUS_PATH.open("r", encoding="utf-8") as handle:
      data = json.load(handle)
  except (json.JSONDecodeError, OSError) as exc:
    print(f"status.json ilegible, se regenera desde cero: {exc}")
    return []
  return data if isinstance(data, list) else []


def merge_status(existing: list[dict], fresh: list[dict]) -> list[dict]:
  """Pisa por series_id solo las series de esta corrida y conserva el resto.

  Cada workflow levanta un Postgres efimero con las series que EL corre: el
  cron FX solo carga ~21 (dolar_*, moneda_*, mercado_*). Antes de este merge,
  generate_status.py volcaba esa tabla entera y borraba las ~29 del cron
  diario (inflacion, EMAE, PBI, empleo, pobreza), asi que /status las mostraba
  ausentes casi todo el dia habil y solo reaparecian tras el diario de las 23.

  Una serie retirada del ETL queda con su ultimo estado hasta que alguien la
  borre a mano del JSON; es preferible a perder 29 series dos veces por dia.
  """
  by_id = {row["series_id"]: row for row in existing if row.get("series_id")}
  for row in fresh:
    by_id[row["series_id"]] = row
  return sorted(by_id.values(), key=lambda row: row["series_id"])


def main() -> None:
  init_db()
  rows = get_series_status_rows()
  fresh = []
  for row in rows:
    fresh.append(
      {
        "series_id": row.get("series_id"),
        "last_status": row.get("last_status"),
        "last_run_at": _to_iso(row.get("last_run_at")),
        "last_date": _to_iso(row.get("last_date")),
        "row_count": int(row.get("row_count") or 0),
        "error_message": row.get("error_message"),
      }
    )

  payload = merge_status(_load_existing(), fresh)

  STATUS_PATH.parent.mkdir(parents=True, exist_ok=True)
  with STATUS_PATH.open("w", encoding="utf-8") as handle:
    json.dump(payload, handle, ensure_ascii=False, indent=2)

  print(f"status rows: {len(payload)}")
  print(f"wrote: {STATUS_PATH}")


if __name__ == "__main__":
  main()
