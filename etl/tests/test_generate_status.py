"""Tests para etl/generate_status.py — merge de status.json entre crons."""

import sys
from pathlib import Path

# Asegurar que el dir etl/ esté en path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from generate_status import merge_status  # noqa: E402


def _row(series_id, status="success", run_at="2026-09-27T09:00:00"):
    return {
        "series_id": series_id,
        "last_status": status,
        "last_run_at": run_at,
        "last_date": "2026-09-26",
        "row_count": 10,
        "error_message": None,
    }


def test_fx_run_conserva_las_series_del_diario():
    # El diario dejo 4 series; el cron FX solo trae las 2 de dolar.
    existing = [_row("dolar_blue"), _row("dolar_oficial"), _row("emae"), _row("inflacion")]
    fresh = [_row("dolar_blue", run_at="2026-09-27T13:00:00"), _row("dolar_oficial", run_at="2026-09-27T13:00:00")]

    merged = merge_status(existing, fresh)

    assert [r["series_id"] for r in merged] == ["dolar_blue", "dolar_oficial", "emae", "inflacion"]


def test_la_corrida_nueva_pisa_a_la_vieja_por_series_id():
    existing = [_row("dolar_blue", status="error", run_at="2026-09-26T13:00:00")]
    fresh = [_row("dolar_blue", status="success", run_at="2026-09-27T13:00:00")]

    merged = merge_status(existing, fresh)

    assert len(merged) == 1
    assert merged[0]["last_status"] == "success"
    assert merged[0]["last_run_at"] == "2026-09-27T13:00:00"


def test_sin_archivo_previo_devuelve_lo_fresco_ordenado():
    fresh = [_row("inflacion"), _row("dolar_blue")]

    merged = merge_status([], fresh)

    assert [r["series_id"] for r in merged] == ["dolar_blue", "inflacion"]


def test_descarta_entradas_previas_sin_series_id():
    existing = [{"last_status": "success"}, _row("emae")]
    fresh = [_row("dolar_blue")]

    merged = merge_status(existing, fresh)

    assert [r["series_id"] for r in merged] == ["dolar_blue", "emae"]
