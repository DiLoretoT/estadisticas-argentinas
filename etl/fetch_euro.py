from __future__ import annotations

from datetime import date, datetime
from typing import Any

import requests

from common import http_get_json, load_sources, merge_series_points, today_iso, now_iso, write_json
from series_store import read_series, write_series


def _parse_date(value: str) -> date:
  return datetime.strptime(value, "%Y-%m-%d").date()


def _aggregate_month_end(points: list[tuple[date, float]]) -> list[tuple[date, float]]:
  if not points:
    return []
  monthly: dict[tuple[int, int], tuple[date, float]] = {}
  for point_date, value in points:
    key = (point_date.year, point_date.month)
    current = monthly.get(key)
    if current is None or point_date > current[0]:
      monthly[key] = (point_date, value)
  return sorted(monthly.values(), key=lambda item: item[0])


def _fetch_bcra_series(
  base_url: str, currency_code: str, start_date: date, end_date: date, limit: int = 1000
) -> list[tuple[date, float]]:
  points: list[tuple[date, float]] = []
  offset = 0
  total = None

  while True:
    try:
      payload = http_get_json(
        f"{base_url}Cotizaciones/{currency_code}",
        params={
          "fechadesde": start_date.isoformat(),
          "fechahasta": end_date.isoformat(),
          "limit": limit,
          "offset": offset,
        },
      )
    except requests.exceptions.SSLError:
      break

    results = payload.get("results", [])
    meta = payload.get("metadata", {})
    resultset = meta.get("resultset", {}) if isinstance(meta, dict) else {}
    total = resultset.get("count", total)

    for item in results:
      fecha = item.get("fecha")
      detalle = item.get("detalle", [])
      if not fecha or not detalle:
        continue
      for row in detalle:
        code = str(row.get("codigoMoneda") or "").upper()
        if code != currency_code.upper():
          continue
        value = row.get("tipoCotizacion")
        if value is None:
          continue
        points.append((_parse_date(fecha), float(value)))
        break

    if total is None:
      break
    offset += limit
    if offset >= total:
      break

  return points


def fetch_euro() -> dict[str, Any]:
  sources = load_sources()
  cfg = sources.get("euro", {})
  bcra_base = cfg.get("bcra_base")
  bcra_start = cfg.get("bcra_start")

  if not bcra_base or not bcra_start:
    return {
      "updated_at": None,
      "updated_at_time": None,
      "period": None,
      "value": None,
      "monthly_change": None,
      "source": {"name": "BCRA", "official": True},
    }

  history_daily = read_series("euro_diario.json")
  last_daily = history_daily[-1][0] if history_daily else None
  start_date = last_daily if last_daily else _parse_date(bcra_start)
  end_date = date.today()

  try:
    daily_points = _fetch_bcra_series(bcra_base, "EUR", start_date, end_date)
  except requests.exceptions.SSLError:
    daily_points = []

  daily_points = merge_series_points(history_daily, daily_points)
  write_series("euro_diario.json", daily_points)

  monthly_points = _aggregate_month_end(daily_points)
  write_series("euro_mensual.json", monthly_points)

  latest_date, latest_value = daily_points[-1] if daily_points else (None, None)
  monthly_period = (
    monthly_points[-1][0].strftime("%Y-%m-%d") if monthly_points else None
  )
  prev_value = monthly_points[-2][1] if len(monthly_points) >= 2 else None
  monthly_change = (
    round(((monthly_points[-1][1] - prev_value) / prev_value) * 100, 2)
    if prev_value
    else None
  )

  return {
    "updated_at": today_iso(),
    "updated_at_time": now_iso(),
    "period": latest_date.strftime("%Y-%m-%d") if latest_date else None,
    "monthly_period": monthly_period,
    "value": round(latest_value, 2) if latest_value is not None else None,
    "monthly_change": monthly_change,
    "source": {"name": "BCRA", "official": True},
  }


def main() -> None:
  payload = fetch_euro()
  write_json("euro.json", payload)


if __name__ == "__main__":
  main()
