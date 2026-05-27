"""Genera data/reporte.json: el parte diario de indicadores.

Determinístico y autocontenido (solo stdlib). NO toca la base de datos: la
fuente de verdad son los archivos `data/series/*.json`, que el ETL escribe y
commitea siempre, sin importar qué workflow corrió (a diferencia de
`status.json`, que solo refleja las series del run actual porque la DB es
efímera en CI).

Para detectar qué se publicó "hoy" compara el archivo de cada serie en el
working tree contra su versión commiteada (`git show HEAD:...`). Si el último
período avanzó, la serie aparece como novedad (`is_new`).

Deja intacto el bloque `editorial` (señal del día / propuesta / para leer):
esos huecos los completa una rutina de Claude por separado. Este script solo
es dueño de la parte determinística.

Orden en el ETL diario: corre DESPUÉS de generate_status.py y ANTES del commit.
"""

from __future__ import annotations

import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

BASE_DIR = Path(__file__).resolve().parent
REPO_ROOT = BASE_DIR.parent
SERIES_DIR = REPO_ROOT / "data" / "series"
REPORT_PATH = REPO_ROOT / "data" / "reporte.json"

SCHEMA_VERSION = 1

# Indicadores "titulares": series de baja frecuencia con valor noticioso.
# A propósito NO incluye los tipos de cambio diarios ni las cotizaciones de
# mercado: se mueven todos los días y ensuciarían el parte. detail_path apunta
# a la página /detalle/* existente cuando la hay (ver app/sitemap.ts).
HEADLINE_SERIES: list[dict[str, Any]] = [
  {"file": "inflacion_mensual.json", "series_id": "ipc_mensual",
   "label": "Inflación mensual (IPC)", "category": "precios",
   "unit": "percent_decimal", "official": True, "source": "INDEC",
   "detail_path": "/detalle/inflacion"},
  {"file": "emae_mensual.json", "series_id": "emae_mensual",
   "label": "Actividad económica (EMAE)", "category": "actividad",
   "unit": "indice", "official": True, "source": "INDEC",
   "detail_path": "/detalle/actividad"},
  {"file": "pbi_trimestral.json", "series_id": "pbi_trimestral",
   "label": "PBI trimestral", "category": "actividad",
   "unit": "millones_pesos", "official": True, "source": "INDEC",
   "detail_path": "/detalle/actividad"},
  {"file": "tasa_desocupacion.json", "series_id": "tasa_desocupacion",
   "label": "Tasa de desocupación", "category": "empleo",
   "unit": "percent_decimal", "official": True, "source": "INDEC",
   "detail_path": "/detalle/empleo"},
  {"file": "tasa_pobreza.json", "series_id": "tasa_pobreza",
   "label": "Tasa de pobreza", "category": "social",
   "unit": "percent_decimal", "official": True, "source": "INDEC",
   "detail_path": "/detalle/pobreza"},
  {"file": "linea_indigencia.json", "series_id": "linea_indigencia",
   "label": "Línea de indigencia", "category": "social",
   "unit": "peso_ars", "official": True, "source": "INDEC",
   "detail_path": "/detalle/pobreza"},
  {"file": "comercio_exportaciones_total.json", "series_id": "export_total",
   "label": "Exportaciones totales", "category": "comercio",
   "unit": "millones_usd", "official": True, "source": "INDEC",
   "detail_path": None},
  {"file": "comercio_importaciones_total.json", "series_id": "import_total",
   "label": "Importaciones totales", "category": "comercio",
   "unit": "millones_usd", "official": True, "source": "INDEC",
   "detail_path": None},
  {"file": "comercio_balanza_comercial.json", "series_id": "balanza_comercial",
   "label": "Balanza comercial", "category": "comercio",
   "unit": "millones_usd", "official": True, "source": "INDEC",
   "detail_path": None},
  {"file": "monetario_reservas_mensual.json", "series_id": "reservas_bcra",
   "label": "Reservas internacionales BCRA", "category": "monetario",
   "unit": "millones_usd", "official": True, "source": "BCRA",
   "detail_path": None},
  {"file": "ripte_mensual.json", "series_id": "ripte_mensual",
   "label": "Salarios RIPTE (var. mensual)", "category": "salarios",
   "unit": "percent_decimal", "official": True, "source": "MTEySS",
   "detail_path": "/detalle/salarios"},
  {"file": "icg_mensual.json", "series_id": "icg_mensual",
   "label": "Confianza en el Gobierno (ICG)", "category": "confianza",
   "unit": "indice", "official": False, "source": "UTDT",
   "detail_path": None},
  {"file": "icc_mensual.json", "series_id": "icc_mensual",
   "label": "Confianza del Consumidor (ICC)", "category": "confianza",
   "unit": "indice", "official": False, "source": "UTDT",
   "detail_path": None},
]

# Orden de presentación por categoría (las novedades igual van primero).
CATEGORY_ORDER = [
  "precios", "actividad", "empleo", "social",
  "comercio", "monetario", "salarios", "confianza",
]

EDITORIAL_TEMPLATE: dict[str, Any] = {
  "for_date": None,
  "senal_del_dia": None,
  "propuesta": None,
  "para_leer": [],
}


def _load_points(raw: str) -> list[tuple[str, float]]:
  """Parsea el contenido JSON de un archivo de serie a (fecha_iso, valor)."""
  payload = json.loads(raw)
  if not isinstance(payload, list):
    return []
  points: list[tuple[str, float]] = []
  for row in payload:
    if not row or len(row) < 2 or row[0] in ("date", "fecha") or row[1] is None:
      continue
    try:
      points.append((str(row[0]), float(row[1])))
    except (ValueError, TypeError):
      continue
  return points


def _read_working_points(file_name: str) -> list[tuple[str, float]]:
  path = SERIES_DIR / file_name
  if not path.exists():
    return []
  return _load_points(path.read_text(encoding="utf-8"))


def _read_head_points(file_name: str) -> list[tuple[str, float]]:
  """Versión commiteada del archivo (HEAD). [] si no existe en HEAD."""
  result = subprocess.run(
    ["git", "show", f"HEAD:data/series/{file_name}"],
    cwd=REPO_ROOT,
    capture_output=True,
    text=True,
  )
  if result.returncode != 0 or not result.stdout.strip():
    return []
  try:
    return _load_points(result.stdout)
  except json.JSONDecodeError:
    return []


def _build_entry(meta: dict[str, Any]) -> dict[str, Any] | None:
  points = _read_working_points(meta["file"])
  if not points:
    return None

  latest_date, latest_value = points[-1]
  prev_date, prev_value = (points[-2] if len(points) >= 2 else (None, None))

  change_abs = None
  change_pct = None
  if prev_value is not None:
    change_abs = round(latest_value - prev_value, 6)
    if prev_value != 0:
      change_pct = round((latest_value - prev_value) / abs(prev_value), 6)

  head_points = _read_head_points(meta["file"])
  head_latest_date = head_points[-1][0] if head_points else None
  is_new = head_latest_date is None or latest_date > head_latest_date

  return {
    "series_id": meta["series_id"],
    "label": meta["label"],
    "category": meta["category"],
    "unit": meta["unit"],
    "official": meta["official"],
    "source": meta["source"],
    "detail_path": meta["detail_path"],
    "period": latest_date,
    "value": round(latest_value, 6),
    "prev_period": prev_date,
    "prev_value": round(prev_value, 6) if prev_value is not None else None,
    "change_abs": change_abs,
    "change_pct": change_pct,
    "is_new": is_new,
  }


def _load_existing_editorial() -> dict[str, Any]:
  """Preserva el bloque editorial del reporte previo (lo completa Claude)."""
  if not REPORT_PATH.exists():
    return dict(EDITORIAL_TEMPLATE)
  try:
    prev = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
  except (json.JSONDecodeError, OSError):
    return dict(EDITORIAL_TEMPLATE)
  editorial = prev.get("editorial")
  if not isinstance(editorial, dict):
    return dict(EDITORIAL_TEMPLATE)
  merged = dict(EDITORIAL_TEMPLATE)
  merged.update({k: editorial.get(k, merged[k]) for k in merged})
  return merged


def build_report() -> dict[str, Any]:
  entries: list[dict[str, Any]] = []
  for meta in HEADLINE_SERIES:
    entry = _build_entry(meta)
    if entry is not None:
      entries.append(entry)

  cat_rank = {c: i for i, c in enumerate(CATEGORY_ORDER)}
  entries.sort(
    key=lambda e: (
      0 if e["is_new"] else 1,
      cat_rank.get(e["category"], len(CATEGORY_ORDER)),
      e["label"],
    )
  )

  now = datetime.now(timezone.utc)
  return {
    "schema_version": SCHEMA_VERSION,
    "generated_at": now.isoformat(timespec="seconds"),
    "report_date": now.date().isoformat(),
    "novedades_count": sum(1 for e in entries if e["is_new"]),
    "indicadores": entries,
    "editorial": _load_existing_editorial(),
  }


def main() -> None:
  report = build_report()
  REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
  with REPORT_PATH.open("w", encoding="utf-8") as handle:
    json.dump(report, handle, ensure_ascii=False, indent=2)
  print(f"reporte: {len(report['indicadores'])} indicadores, "
        f"{report['novedades_count']} novedades")
  print(f"wrote: {REPORT_PATH}")


if __name__ == "__main__":
  main()
