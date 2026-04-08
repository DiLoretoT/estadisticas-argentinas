import json
import logging
import os
import time
from datetime import date, datetime
from typing import Any

import certifi
import requests
from requests.exceptions import ConnectionError as RequestsConnectionError
from requests.exceptions import Timeout

logger = logging.getLogger(__name__)

# Códigos HTTP que vale la pena reintentar
_RETRYABLE_STATUSES = {429, 500, 502, 503, 504}


def load_sources() -> dict[str, Any]:
  from pathlib import Path

  base_dir = Path(__file__).resolve().parent
  sources_path = base_dir / "sources.json"
  with sources_path.open("r", encoding="utf-8") as handle:
    return json.load(handle)


def http_get_json(
  url: str,
  params: dict[str, Any] | None = None,
  max_retries: int = 3,
  backoff_factor: float = 2.0,
) -> dict[str, Any]:
  allow_insecure = os.getenv("ALLOW_INSECURE_SSL") == "1"
  if allow_insecure:
    logger.warning("SSL verification disabled (ALLOW_INSECURE_SSL=1) for %s", url)
  verify = False if allow_insecure else certifi.where()

  last_exc: Exception | None = None
  for attempt in range(1, max_retries + 1):
    try:
      response = requests.get(url, params=params, timeout=30, verify=verify)
      if response.status_code in _RETRYABLE_STATUSES:
        logger.warning(
          "HTTP %s en %s (intento %d/%d)",
          response.status_code, url, attempt, max_retries,
        )
        last_exc = requests.HTTPError(response=response)
      else:
        response.raise_for_status()
        return response.json()
    except (Timeout, RequestsConnectionError) as exc:
      logger.warning("Error de red en %s (intento %d/%d): %s", url, attempt, max_retries, exc)
      last_exc = exc

    if attempt < max_retries:
      wait = backoff_factor ** (attempt - 1)
      logger.info("Reintentando en %.1fs...", wait)
      time.sleep(wait)

  raise last_exc  # type: ignore[misc]


def write_json(file_name: str, payload: dict[str, Any]) -> None:
  from pathlib import Path

  base_dir = Path(__file__).resolve().parent
  data_dir = base_dir.parent / "data"
  data_dir.mkdir(parents=True, exist_ok=True)
  path = data_dir / file_name
  with path.open("w", encoding="utf-8") as handle:
    json.dump(payload, handle, ensure_ascii=False, indent=2)


def today_iso() -> str:
  return date.today().isoformat()


def now_iso() -> str:
  return datetime.now().isoformat(timespec="seconds")


def parse_series_points(payload: dict[str, Any]) -> list[tuple[date, float]]:
  points: list[tuple[date, float]] = []
  skipped = 0
  for row in payload.get("data", []):
    if not row or row[0] in ("date", "fecha"):
      continue
    if row[1] is None:
      skipped += 1
      continue
    try:
      point_date = datetime.strptime(row[0], "%Y-%m-%d").date()
    except (ValueError, TypeError):
      logger.warning("Fecha inválida, se omite fila: %s", row)
      skipped += 1
      continue
    try:
      value = float(row[1])
    except (ValueError, TypeError):
      logger.warning("Valor no numérico, se omite fila: %s", row)
      skipped += 1
      continue
    points.append((point_date, value))

  if skipped:
    logger.info("Se omitieron %d filas inválidas o nulas", skipped)
  return points


def fetch_series_points_paged(
  series_api: str,
  series_id: str,
  extra_params: dict[str, Any] | None = None,
  start_date: date | None = None,
  end_date: date | None = None,
  limit: int = 1000,
) -> list[tuple[date, float]]:
  params = {"ids": series_id, "format": "json", **(extra_params or {})}
  if start_date:
    params["start_date"] = start_date.isoformat()
  if end_date:
    params["end_date"] = end_date.isoformat()

  all_points: list[tuple[date, float]] = []
  start = 0
  while True:
    page_params = {**params, "start": start, "limit": limit}
    payload = http_get_json(series_api, params=page_params)
    points = parse_series_points(payload)
    all_points.extend(points)
    if len(points) < limit:
      break
    start += limit
  return all_points


def merge_series_points(
  existing: list[tuple[date, float]], incoming: list[tuple[date, float]]
) -> list[tuple[date, float]]:
  merged = {point_date: value for point_date, value in existing}
  for point_date, value in incoming:
    merged[point_date] = value
  return sorted(merged.items(), key=lambda item: item[0])
