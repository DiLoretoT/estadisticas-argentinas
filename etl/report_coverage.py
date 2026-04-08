from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from common import http_get_json
from series_store import read_series

BASE_DIR = Path(__file__).resolve().parent
SOURCES_PATH = BASE_DIR / "sources.json"


def _load_sources() -> dict[str, Any]:
  with SOURCES_PATH.open("r", encoding="utf-8") as handle:
    return json.load(handle)


def _extract_series_meta(payload: dict[str, Any]) -> list[dict[str, Any]]:
  meta = payload.get("meta", {}) if isinstance(payload, dict) else {}
  if isinstance(meta, dict):
    series = meta.get("series")
    if isinstance(series, dict):
      return [series]
    if isinstance(series, list):
      return series
    data = meta.get("data")
    if isinstance(data, list):
      return data
  return []


def _print_series(series_list: list[dict[str, Any]]) -> None:
  for series in series_list:
    series_id = series.get("id") or series.get("serie_id") or "(sin id)"
    title = series.get("title") or series.get("titulo") or ""
    start_date = series.get("start_date") or series.get("start_date")
    end_date = series.get("end_date") or series.get("end_date")
    print(f"- {series_id} {title} :: {start_date} -> {end_date}")


def main() -> None:
  sources = _load_sources()
  tasks = []

  inflacion = sources.get("inflacion", {})
  if inflacion.get("series_api") and inflacion.get("series_id_mensual"):
    tasks.append(
      (
        "Inflacion IPC",
        inflacion["series_api"],
        inflacion["series_id_mensual"],
      )
    )

  dolar = sources.get("dolar_oficial", {})
  if dolar.get("series_api") and dolar.get("series_id"):
    tasks.append(("Dolar oficial", dolar["series_api"], dolar["series_id"]))

  for label, api, series_id in tasks:
    print(f"\n{label}:")
    payload = http_get_json(
      api,
      params={"ids": series_id, "format": "json", "metadata": "full"},
    )
    series_list = _extract_series_meta(payload)
    if series_list:
      _print_series(series_list)
    else:
      print("- No se encontro metadata de series en la API")

  print("\nCobertura local (data/series):")
  inflacion = read_series("inflacion_mensual.json")
  if inflacion:
    print(f"- inflacion_mensual.json :: {inflacion[0][0]} -> {inflacion[-1][0]}")
  dolar = read_series("dolar_oficial_mensual.json")
  if dolar:
    print(f"- dolar_oficial_mensual.json :: {dolar[0][0]} -> {dolar[-1][0]}")
  blue = read_series("dolar_blue_mensual.json")
  if blue:
    print(f"- dolar_blue_mensual.json :: {blue[0][0]} -> {blue[-1][0]}")


if __name__ == "__main__":
  main()
