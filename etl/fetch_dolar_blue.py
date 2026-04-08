from __future__ import annotations

from datetime import date, datetime
from typing import Any

from common import load_sources, merge_series_points, now_iso, today_iso, write_json
from series_store import read_series, write_series
import requests
import certifi
import os


def _parse_date(value: str) -> date:
  return datetime.strptime(value, "%Y-%m-%d").date()


def _http_get_json(url: str) -> Any:
  allow_insecure = os.getenv("ALLOW_INSECURE_SSL") == "1"
  verify = False if allow_insecure else certifi.where()
  resp = requests.get(url, timeout=30, verify=verify)
  resp.raise_for_status()
  return resp.json()


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


def fetch_dolar_blue() -> dict[str, Any]:
  sources = load_sources()
  cfg = sources.get("dolar_blue", {})
  base_url = cfg.get("api_base", "https://api.argentinadatos.com/v1")
  casa = cfg.get("casa", "blue")
  url = f"{base_url}/cotizaciones/dolares/{casa}"

  payload = _http_get_json(url)
  points: list[tuple[date, float]] = []
  for row in payload:
    fecha = row.get("fecha")
    venta = row.get("venta")
    if not fecha or venta is None:
      continue
    points.append((_parse_date(fecha), float(venta)))

  history_points = read_series("dolar_blue_diario.json")
  merged = merge_series_points(history_points, points)
  write_series("dolar_blue_diario.json", merged)

  monthly_points = _aggregate_month_end(merged)
  write_series("dolar_blue_mensual.json", monthly_points)

  if not merged:
    return {
      "updated_at": None,
      "updated_at_time": None,
      "period": None,
      "value": None,
      "monthly_change": None,
      "source": {"name": "ArgentinaDatos", "official": False},
    }

  latest_date, latest_value = merged[-1]
  monthly_change = None
  if len(monthly_points) >= 2:
    prev_value = monthly_points[-2][1]
    if prev_value:
      monthly_change = round(((latest_value - prev_value) / prev_value) * 100, 2)

  return {
    "updated_at": today_iso(),
    "updated_at_time": now_iso(),
    "period": latest_date.strftime("%Y-%m-%d"),
    "value": round(latest_value, 2),
    "monthly_change": monthly_change,
    "source": {"name": "ArgentinaDatos", "official": False},
  }


def main() -> None:
  payload = fetch_dolar_blue()
  write_json("dolar_blue.json", payload)


if __name__ == "__main__":
  main()
