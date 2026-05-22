"""
Fetcher comparativa LATAM contra Banco Mundial WDI.

Endpoint: https://api.worldbank.org/v2/country/{ARG;BRA;...}/indicator/{ID}?format=json
Sin auth. Datos anuales.

10 países: Argentina + 9 vecinos/comparables LATAM.
9 indicadores comparables.

Output:
  data/comparativa/{indicator_key}.json
    {
      "indicator": {...},
      "countries": ["ARG", "BRA", ...],
      "series": {
        "ARG": [["2020", 12345], ...],
        "BRA": [["2020", 67890], ...]
      }
    }
  data/comparativa_summary.json
    Tabla ranking del último año disponible para cada indicador.
"""

from __future__ import annotations

import json
import logging
import os
from datetime import date
from pathlib import Path
from typing import Any

import certifi
import requests

from common import now_iso, today_iso

logger = logging.getLogger(__name__)

_BASE_URL = "https://api.worldbank.org/v2/country"

# 10 países LATAM, código ISO3
_COUNTRIES = ["ARG", "BRA", "CHL", "URY", "COL", "MEX", "PER", "BOL", "PRY", "ECU"]

_COUNTRY_LABELS = {
    "ARG": "Argentina",
    "BRA": "Brasil",
    "CHL": "Chile",
    "URY": "Uruguay",
    "COL": "Colombia",
    "MEX": "México",
    "PER": "Perú",
    "BOL": "Bolivia",
    "PRY": "Paraguay",
    "ECU": "Ecuador",
}

# (indicator_id, key, display_name, unit, higher_is_better)
_INDICATORS: list[tuple[str, str, str, str, bool]] = [
    ("NY.GDP.PCAP.PP.CD", "pbi_pc_ppp", "PBI per cápita (USD PPP)", "USD", True),
    ("FP.CPI.TOTL.ZG", "inflacion_anual", "Inflación anual (% IPC)", "%", False),
    ("SL.UEM.TOTL.ZS", "desempleo", "Desempleo (% fuerza laboral)", "%", False),
    ("SI.POV.GINI", "gini", "Gini (desigualdad)", "índice", False),
    ("SP.DYN.LE00.IN", "esperanza_vida", "Esperanza de vida (años)", "años", True),
    ("DT.DOD.DECT.CD", "deuda_externa", "Deuda externa total (USD M)", "USD M", False),
    ("BX.GSR.GNFS.CD", "exports_total", "Exportaciones bienes y servicios (USD)", "USD", True),
    ("NE.IMP.GNFS.ZS", "imports_pct_gdp", "Importaciones (% del PBI)", "%", False),
    ("SP.URB.TOTL.IN.ZS", "urbanizacion", "Urbanización (% población)", "%", True),
]

_DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "comparativa"


def _http_get_json(url: str, params: dict[str, Any] | None = None) -> Any:
    allow_insecure = os.getenv("ALLOW_INSECURE_SSL") == "1"
    verify = False if allow_insecure else certifi.where()
    headers = {"User-Agent": "estadisticas-argentinas-bot/1.0"}
    resp = requests.get(url, params=params, headers=headers, timeout=90, verify=verify)
    resp.raise_for_status()
    return resp.json()


def _fetch_indicator(indicator_id: str) -> dict[str, list[tuple[str, float]]]:
    """Devuelve {ISO3: [(year_str, value), ...]} para un indicator."""
    countries_str = ";".join(_COUNTRIES)
    url = f"{_BASE_URL}/{countries_str}/indicator/{indicator_id}"
    params = {
        "format": "json",
        "per_page": 1000,
        "date": "2000:2025",
    }
    payload = _http_get_json(url, params=params)
    # WB devuelve [meta, [rows]]
    if not isinstance(payload, list) or len(payload) < 2:
        logger.warning("Respuesta WB inesperada para %s: %s", indicator_id, str(payload)[:200])
        return {}

    rows = payload[1] or []
    result: dict[str, list[tuple[str, float]]] = {c: [] for c in _COUNTRIES}
    for row in rows:
        iso3 = row.get("countryiso3code")
        date_str = row.get("date")
        value = row.get("value")
        if iso3 not in _COUNTRIES or not date_str or value is None:
            continue
        try:
            v = float(value)
        except (TypeError, ValueError):
            continue
        result[iso3].append((date_str, v))

    # Ordenar por fecha ascendente
    for iso3 in result:
        result[iso3].sort(key=lambda p: p[0])
    return result


def _write_indicator(
    key: str,
    indicator_id: str,
    display_name: str,
    unit: str,
    higher_is_better: bool,
    data: dict[str, list[tuple[str, float]]],
) -> dict[str, Any]:
    """Persiste un JSON por indicador y devuelve el snapshot del último año."""
    _DATA_DIR.mkdir(parents=True, exist_ok=True)
    out_path = _DATA_DIR / f"{key}.json"

    payload = {
        "indicator": {
            "id": indicator_id,
            "key": key,
            "name": display_name,
            "unit": unit,
            "higher_is_better": higher_is_better,
            "source": "World Bank WDI",
        },
        "countries": _COUNTRIES,
        "country_labels": _COUNTRY_LABELS,
        "series": {iso3: data.get(iso3, []) for iso3 in _COUNTRIES},
    }
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    # Snapshot: último valor por país
    snapshot: list[dict[str, Any]] = []
    for iso3 in _COUNTRIES:
        series = data.get(iso3, [])
        if not series:
            snapshot.append({"iso3": iso3, "country": _COUNTRY_LABELS[iso3], "year": None, "value": None})
            continue
        last_year, last_value = series[-1]
        snapshot.append(
            {
                "iso3": iso3,
                "country": _COUNTRY_LABELS[iso3],
                "year": last_year,
                "value": round(last_value, 2),
            }
        )
    return {
        "key": key,
        "display_name": display_name,
        "unit": unit,
        "higher_is_better": higher_is_better,
        "snapshot": snapshot,
    }


def fetch_comparativa_latam() -> dict[str, Any]:
    _DATA_DIR.mkdir(parents=True, exist_ok=True)
    results: list[dict[str, Any]] = []
    failed: list[str] = []

    for indicator_id, key, display_name, unit, higher_is_better in _INDICATORS:
        try:
            data = _fetch_indicator(indicator_id)
            row = _write_indicator(key, indicator_id, display_name, unit, higher_is_better, data)
            results.append(row)
            logger.info(
                "Comparativa %s: %d países con datos",
                key,
                sum(1 for iso3 in _COUNTRIES if data.get(iso3)),
            )
        except Exception as exc:
            logger.error("Falló indicador WB %s: %s", indicator_id, exc)
            failed.append(indicator_id)

    summary = {
        "updated_at": today_iso(),
        "updated_at_time": now_iso(),
        "countries": _COUNTRIES,
        "country_labels": _COUNTRY_LABELS,
        "indicators": results,
        "source": {"name": "World Bank — World Development Indicators", "official": True},
    }
    summary_path = _DATA_DIR.parent / "comparativa_latam_summary.json"
    with summary_path.open("w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    if failed:
        logger.warning("Indicadores WB con error: %s", ", ".join(failed))
    return {"indicators": len(results), "failed": failed}


def main() -> None:
    fetch_comparativa_latam()


if __name__ == "__main__":
    main()
