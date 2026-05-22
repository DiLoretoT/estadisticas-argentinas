"""
Fetcher de exportaciones por provincia (OPEX - Origen Provincial de Exportaciones).

Fuente: INDEC, anexo Excel del informe OPEX semestral/anual.
URL pattern: https://www.indec.gob.ar/ftp/cuadros/economia/opex_anexo_cuadros_DD_MM_AA.xls

El fetcher:
1. Intenta encontrar el último archivo .xls disponible probando fechas recientes.
2. Parsea las 24 provincias × 4 grandes rubros (productos primarios, MOA, MOI, combustibles).
3. Agrega al data/provincias_stats.json el campo export_total por provincia.

NO sobreescribe los otros campos del JSON, solo actualiza export_total y
opcionalmente export_primarios/moa/moi/combustibles si están como columnas
identificables en el Excel.
"""

from __future__ import annotations

import io
import json
import logging
import os
import re
from datetime import date, timedelta
from pathlib import Path
from typing import Any

import certifi
import pandas as pd
import requests
import xlrd

logger = logging.getLogger(__name__)

_BASE_URL = "https://www.indec.gob.ar/ftp/cuadros/economia"
_FILENAME_PATTERN = "opex_anexo_cuadros_{day:02d}_{month:02d}_{year_2d:02d}.xls"

# Nombres canónicos de las 24 provincias en el formato de provincias_stats.json
_CANONICAL_PROVINCES = [
    "Buenos Aires",
    "Capital Federal",
    "Catamarca",
    "Chaco",
    "Chubut",
    "Cordoba",
    "Corrientes",
    "Entre Rios",
    "Formosa",
    "Jujuy",
    "La Pampa",
    "La Rioja",
    "Mendoza",
    "Misiones",
    "Neuquen",
    "Rio Negro",
    "Salta",
    "San Juan",
    "San Luis",
    "Santa Cruz",
    "Santa Fe",
    "Santiago del Estero",
    "Tierra del Fuego",
    "Tucuman",
]

# Variaciones de cómo INDEC escribe los nombres (sin acentos, sin tildes)
_PROVINCE_NORMALIZATIONS = {
    "buenos aires": "Buenos Aires",
    "caba": "Capital Federal",
    "ciudad de buenos aires": "Capital Federal",
    "ciudad autónoma de buenos aires": "Capital Federal",
    "ciudad autonoma de buenos aires": "Capital Federal",
    "capital federal": "Capital Federal",
    "catamarca": "Catamarca",
    "chaco": "Chaco",
    "chubut": "Chubut",
    "córdoba": "Cordoba",
    "cordoba": "Cordoba",
    "corrientes": "Corrientes",
    "entre ríos": "Entre Rios",
    "entre rios": "Entre Rios",
    "formosa": "Formosa",
    "jujuy": "Jujuy",
    "la pampa": "La Pampa",
    "la rioja": "La Rioja",
    "mendoza": "Mendoza",
    "misiones": "Misiones",
    "neuquén": "Neuquen",
    "neuquen": "Neuquen",
    "río negro": "Rio Negro",
    "rio negro": "Rio Negro",
    "salta": "Salta",
    "san juan": "San Juan",
    "san luis": "San Luis",
    "santa cruz": "Santa Cruz",
    "santa fe": "Santa Fe",
    "santiago del estero": "Santiago del Estero",
    "tierra del fuego": "Tierra del Fuego",
    "tierra del fuego, antártida e islas del atlántico sur": "Tierra del Fuego",
    "tucumán": "Tucuman",
    "tucuman": "Tucuman",
}


def _http_get(url: str) -> tuple[bytes, str] | None:
    """Descarga binario. Devuelve (content, content_type) o None si 404 o inválido.

    INDEC devuelve un HTML genérico de 36KB con status 200 cuando el archivo
    no existe. Filtramos por content-type real para descartar esos casos.
    """
    allow_insecure = os.getenv("ALLOW_INSECURE_SSL") == "1"
    verify = False if allow_insecure else certifi.where()
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (compatible; estadisticas-argentinas-bot/1.0)"
        )
    }
    try:
        # HEAD primero para chequear sin descargar todo
        head = requests.head(url, headers=headers, timeout=15, verify=verify, allow_redirects=True)
        if head.status_code != 200:
            return None
        ct = head.headers.get("content-type", "").lower()
        # Aceptamos solo archivos Excel reales
        if "excel" not in ct and "spreadsheet" not in ct and "octet-stream" not in ct:
            return None
        resp = requests.get(url, headers=headers, timeout=60, verify=verify)
        resp.raise_for_status()
        return resp.content, ct
    except requests.RequestException as exc:
        logger.warning("HTTP error %s: %s", url, exc)
        return None


def find_latest_xls() -> tuple[bytes, str] | None:
    """Prueba fechas hacia atrás hasta encontrar un .xls real (no HTML genérico).

    OPEX se publica semestral/anual con fecha de publicación. La nomenclatura
    es opex_anexo_cuadros_DD_MM_AA.xls. Probamos todos los días de los últimos
    36 meses (silencioso) hasta el primer archivo Excel real.
    """
    today = date.today()
    # Probamos todos los días de los últimos 36 meses
    for delta_days in range(0, 1080):
        d = today - timedelta(days=delta_days)
        fname = _FILENAME_PATTERN.format(
            day=d.day, month=d.month, year_2d=d.year % 100
        )
        url = f"{_BASE_URL}/{fname}"
        result = _http_get(url)
        if result:
            content, ct = result
            logger.info("OPEX encontrado: %s (%s, %d bytes)", url, ct, len(content))
            return content, url
    return None


def _normalize_province(raw: str) -> str | None:
    if not raw:
        return None
    cleaned = re.sub(r"\s+", " ", raw.strip().lower())
    return _PROVINCE_NORMALIZATIONS.get(cleaned)


def _rows_from_xls_bytes(content: bytes) -> list[list[Any]]:
    """Devuelve filas de todas las hojas. Soporta .xls real (BIFF) y HTML."""
    # Caso 1: HTML disfrazado de xls (INDEC frecuente)
    if content[:200].lstrip().lower().startswith(b"<!doctype") or b"<table" in content[:5000].lower():
        try:
            tables = pd.read_html(io.BytesIO(content), encoding="utf-8")
        except Exception as exc:
            logger.error("read_html falló: %s", exc)
            return []
        rows: list[list[Any]] = []
        for df in tables:
            for _, row in df.iterrows():
                rows.append([cell for cell in row.values])
        return rows
    # Caso 2: .xls binario real
    try:
        wb = xlrd.open_workbook(file_contents=content)
    except Exception as exc:
        logger.error("xlrd.open_workbook falló: %s", exc)
        return []
    rows = []
    for sheet in wb.sheets():
        for row_idx in range(sheet.nrows):
            rows.append(sheet.row_values(row_idx))
    return rows


def _coerce_number(cell: Any) -> float | None:
    """Intenta convertir una celda en número. Soporta strings con ',' como separador."""
    if cell is None:
        return None
    if isinstance(cell, (int, float)):
        if not (cell != cell):  # NaN check
            return float(cell)
        return None
    if isinstance(cell, str):
        s = cell.strip().replace(".", "").replace(",", ".")
        # Si tiene puntos como miles (formato AR), el reemplazo de arriba ya manejó
        try:
            return float(s)
        except ValueError:
            return None
    return None


def parse_opex(content: bytes) -> dict[str, float]:
    """Parsea el archivo OPEX y devuelve {provincia: total_USD_M}.

    Soporta tanto .xls BIFF como HTML disfrazado de xls.
    Estrategia: buscar filas con nombre de provincia + el mayor valor numérico
    de esa fila como "Total" anual de exportaciones (formato típico OPEX).
    """
    rows = _rows_from_xls_bytes(content)
    if not rows:
        return {}

    results: dict[str, float] = {}
    for row in rows:
        # Buscar provincia en las primeras 4 columnas
        prov_cell = None
        for cell in row[:4]:
            if isinstance(cell, str):
                prov = _normalize_province(cell)
                if prov:
                    prov_cell = prov
                    break
        if not prov_cell:
            continue
        numeric_values: list[float] = []
        for c in row:
            n = _coerce_number(c)
            if n is not None and n > 0:
                numeric_values.append(n)
        if not numeric_values:
            continue
        total = max(numeric_values)
        if prov_cell not in results or total > results[prov_cell]:
            results[prov_cell] = float(total)

    return results


def update_provincias_stats(exports_by_provincia: dict[str, float]) -> None:
    """Actualiza data/provincias_stats.json con los exports nuevos. Conserva el resto."""
    if not exports_by_provincia:
        logger.warning("No hay exports nuevos para actualizar.")
        return

    stats_path = (
        Path(__file__).resolve().parent.parent / "data" / "provincias_stats.json"
    )
    with stats_path.open("r", encoding="utf-8") as f:
        stats = json.load(f)

    # Update data
    for entry in stats["data"]:
        prov = entry["provincia"]
        if prov in exports_by_provincia:
            entry["export_total"] = round(exports_by_provincia[prov], 2)

    # Update notes
    if "notes" not in stats:
        stats["notes"] = {}
    stats["notes"]["export_total"] = (
        "Fuente: INDEC OPEX (anexo Excel). Valor anual o semestral según último publicado."
    )

    with stats_path.open("w", encoding="utf-8") as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)

    logger.info(
        "provincias_stats.json actualizado: %d provincias con exports.",
        len(exports_by_provincia),
    )


def fetch_opex_provincial() -> dict[str, Any]:
    result = find_latest_xls()
    if result is None:
        logger.error("No se encontró ningún Excel OPEX reciente.")
        return {"updated": 0, "error": "no_excel_found"}

    content, url = result
    parsed = parse_opex(content)
    update_provincias_stats(parsed)
    return {"updated": len(parsed), "source_url": url}


def main() -> None:
    fetch_opex_provincial()


if __name__ == "__main__":
    main()
