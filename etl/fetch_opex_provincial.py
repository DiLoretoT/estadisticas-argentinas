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


def parse_opex(content: bytes) -> dict[str, dict[str, float]]:
    """Parsea el OPEX y devuelve, por provincia, total + composición por rubro.

    Estructura: {provincia: {'total': X, 'pp': X, 'moa': X, 'moi': X, 'cye': X}}

    El archivo tiene una hoja específica "OP-Rubros 2022-2025" donde las
    columnas están organizadas como:
      col 1: nombre de provincia
      col 2-5: Total por año 2022, 2023, 2024, 2025
      col 6-9: Productos Primarios (PP) por año
      col 10-13: MOA (Manuf. Origen Agropecuario) por año
      col 14-17: MOI (Manuf. Origen Industrial) por año
      col 18-21: CyE (Combustibles y Energía) por año

    Tomamos el ÚLTIMO año disponible (col 5/9/13/17/21).
    """
    try:
        wb = xlrd.open_workbook(file_contents=content)
    except Exception as exc:
        logger.error("xlrd.open_workbook falló: %s", exc)
        return _parse_opex_fallback(content)

    # Buscar la hoja "OP-Rubros"
    target_sheet = None
    for name in wb.sheet_names():
        if "rubros" in name.lower():
            target_sheet = wb.sheet_by_name(name)
            break
    if not target_sheet:
        logger.warning("Hoja 'OP-Rubros' no encontrada — usando fallback.")
        return _parse_opex_fallback(content)

    # Columnas del último año disponible
    LAST_YEAR_COLS = {
        "total": 5,
        "pp": 9,
        "moa": 13,
        "moi": 17,
        "cye": 21,
    }

    results: dict[str, dict[str, float]] = {}
    for r in range(target_sheet.nrows):
        row = target_sheet.row_values(r)
        # Provincia está en col 1 (a veces 0 si es región)
        prov_cell = None
        for cell in row[:3]:
            if isinstance(cell, str):
                prov = _normalize_province(cell)
                if prov:
                    prov_cell = prov
                    break
        if not prov_cell:
            continue
        # Extraer los 5 valores numéricos en sus columnas
        values: dict[str, float] = {}
        for key, col in LAST_YEAR_COLS.items():
            if col < len(row):
                n = _coerce_number(row[col])
                if n is not None and n >= 0:
                    values[key] = float(n)
        if "total" in values and values["total"] > 0:
            # Si ya existe esa provincia, conservar el de mayor total (debería ser único)
            if prov_cell not in results or values["total"] > results[prov_cell].get("total", 0):
                results[prov_cell] = values

    return results


def _parse_opex_fallback(content: bytes) -> dict[str, dict[str, float]]:
    """Fallback genérico: solo total, sin composición. Útil si cambia la estructura."""
    rows = _rows_from_xls_bytes(content)
    if not rows:
        return {}
    out: dict[str, dict[str, float]] = {}
    for row in rows:
        prov_cell = None
        for cell in row[:4]:
            if isinstance(cell, str):
                prov = _normalize_province(cell)
                if prov:
                    prov_cell = prov
                    break
        if not prov_cell:
            continue
        nums: list[float] = []
        for c in row:
            n = _coerce_number(c)
            if n is not None and n > 0:
                nums.append(n)
        if not nums:
            continue
        total = max(nums)
        if prov_cell not in out or total > out[prov_cell].get("total", 0):
            out[prov_cell] = {"total": total}
    return out


def _classify_economy(values: dict[str, float]) -> str | None:
    """Clasifica el tipo de economía según composición de exportaciones.

    Mira qué rubro tiene >50% del total y le pone un label descriptivo.
    Si ningún rubro supera 40%, es "diversificada".
    """
    total = values.get("total", 0)
    if total <= 0:
        return None
    rubros = {
        "pp": "Agropecuaria primaria",
        "moa": "Agroindustrial",
        "moi": "Industrial",
        "cye": "Energética / minera",
    }
    max_key, max_val = max(
        ((k, values.get(k, 0)) for k in rubros), key=lambda x: x[1]
    )
    pct = max_val / total
    if pct >= 0.50:
        return f"{rubros[max_key]} ({pct * 100:.0f}% del total)"
    if pct >= 0.40:
        return f"Predominantemente {rubros[max_key].lower()} ({pct * 100:.0f}%)"
    return "Diversificada"


def update_provincias_stats(
    exports_by_provincia: dict[str, dict[str, float]],
) -> None:
    """Actualiza data/provincias_stats.json con los exports nuevos + composición."""
    if not exports_by_provincia:
        logger.warning("No hay exports nuevos para actualizar.")
        return

    stats_path = (
        Path(__file__).resolve().parent.parent / "data" / "provincias_stats.json"
    )
    with stats_path.open("r", encoding="utf-8") as f:
        stats = json.load(f)

    # Update data — agrega total + composición + tipo_economia
    for entry in stats["data"]:
        prov = entry["provincia"]
        if prov in exports_by_provincia:
            values = exports_by_provincia[prov]
            if "total" in values:
                entry["export_total"] = round(values["total"], 2)
            if "pp" in values:
                entry["export_pp"] = round(values["pp"], 2)
            if "moa" in values:
                entry["export_moa"] = round(values["moa"], 2)
            if "moi" in values:
                entry["export_moi"] = round(values["moi"], 2)
            if "cye" in values:
                entry["export_cye"] = round(values["cye"], 2)
            tipo = _classify_economy(values)
            if tipo:
                entry["tipo_economia"] = tipo

    # Update notes
    if "notes" not in stats:
        stats["notes"] = {}
    stats["notes"]["export_total"] = (
        "Fuente: INDEC OPEX (anexo Excel). Total anual + composición por gran "
        "rubro: PP (Productos primarios), MOA (Manuf. Origen Agropecuario), "
        "MOI (Manuf. Origen Industrial), CyE (Combustibles y Energía)."
    )
    stats["notes"]["tipo_economia"] = (
        "Clasificación derivada: si un rubro concentra >50% de las "
        "exportaciones, define el tipo de economía provincial."
    )

    # Asegurar que los indicators incluyen los nuevos campos como meta
    existing_keys = {ind["key"] for ind in stats["indicators"]}
    if "tipo_economia" not in existing_keys:
        stats["indicators"].append({
            "key": "tipo_economia",
            "label": "Tipo de economía",
            "category": "Economía",
            "unit": "categórico",
            "higher_is_better": True,
            "source": "Derivado de OPEX (INDEC)",
            "description": "Clasificación según el rubro de exportaciones dominante.",
        })

    with stats_path.open("w", encoding="utf-8") as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)

    logger.info(
        "provincias_stats.json actualizado: %d provincias con exports + composición.",
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
