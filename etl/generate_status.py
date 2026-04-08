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


def main() -> None:
  init_db()
  rows = get_series_status_rows()
  payload = []
  for row in rows:
    payload.append(
      {
        "series_id": row.get("series_id"),
        "last_status": row.get("last_status"),
        "last_run_at": _to_iso(row.get("last_run_at")),
        "last_date": _to_iso(row.get("last_date")),
        "row_count": int(row.get("row_count") or 0),
        "error_message": row.get("error_message"),
      }
    )

  STATUS_PATH.parent.mkdir(parents=True, exist_ok=True)
  with STATUS_PATH.open("w", encoding="utf-8") as handle:
    json.dump(payload, handle, ensure_ascii=False, indent=2)

  print(f"status rows: {len(payload)}")
  print(f"wrote: {STATUS_PATH}")


if __name__ == "__main__":
  main()
