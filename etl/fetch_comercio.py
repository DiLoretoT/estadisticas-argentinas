"""
Fetcher de comercio exterior argentino (Intercambio Comercial Argentino - ICA).

Fuente: INDEC vía datos.gob.ar
Endpoint: https://apis.datos.gob.ar/series/api/series
Frecuencia: mensual
Unidad: Millones de USD (valor FOB para exportaciones, CIF para importaciones)

14 series ingestadas:
  - Exportaciones totales (FOB)
  - Importaciones totales (CIF)
  - Saldo / balanza comercial
  - Exports por gran rubro (4): productos primarios, MOA, MOI, combustibles
  - Imports por uso económico (7): intermedios, BK+piezas, piezas/accesorios BK,
    combustibles, consumo, vehículos pasajeros, resto

Bienes de Capital "puros" = IBCPP - IIPABC (se calcula en backend del frontend).
"""

from __future__ import annotations

import logging
import os
from datetime import date
from typing import Any

from common import (
    fetch_series_points_paged,
    load_sources,
    merge_series_points,
    now_iso,
    today_iso,
    write_json,
)
from db import (
    finish_refresh_run,
    init_db,
    start_refresh_run,
    update_series_refresh_status,
    upsert_observations,
    upsert_series,
)
from series_store import read_series, write_series

logger = logging.getLogger(__name__)

# (provider_id, key_interno, display_name, categoria)
# categoria: "total", "balanza", "export_rubro", "import_uso"
_SERIES: list[tuple[str, str, str, str]] = [
    # Totales y balanza
    ("74.3_IET_0_M_16", "exportaciones_total", "Exportaciones totales (FOB)", "total"),
    ("74.3_IIT_0_M_25", "importaciones_total", "Importaciones totales (CIF)", "total"),
    ("74.3_ISC_0_M_19", "balanza_comercial", "Saldo de balanza comercial", "balanza"),
    # Exports por gran rubro
    ("74.3_IEPP_0_M_35", "export_primarios", "Exportaciones · Productos primarios", "export_rubro"),
    ("74.3_IEMOA_0_M_48", "export_moa", "Exportaciones · MOA (Manuf. Origen Agropecuario)", "export_rubro"),
    ("74.3_IEMOI_0_M_46", "export_moi", "Exportaciones · MOI (Manuf. Origen Industrial)", "export_rubro"),
    ("74.3_IECE_0_M_35", "export_combustibles", "Exportaciones · Combustibles y energía", "export_rubro"),
    # Imports por uso económico
    ("74.3_IIBI_0_M_36", "import_intermedios", "Importaciones · Bienes intermedios", "import_uso"),
    ("74.3_IBCPP_0_M_32", "import_bk_y_piezas", "Importaciones · Bienes de capital + Piezas/accesorios", "import_uso"),
    ("74.3_IIPABC_0_M_50", "import_piezas_bk", "Importaciones · Piezas y accesorios BK", "import_uso"),
    ("74.3_IICL_0_M_42", "import_combustibles", "Importaciones · Combustibles y lubricantes", "import_uso"),
    ("74.3_IIBCO_0_M_32", "import_consumo", "Importaciones · Bienes de consumo", "import_uso"),
    ("74.3_IIVAP_0_M_49", "import_vehiculos", "Importaciones · Vehículos automotores pasajeros", "import_uso"),
    ("74.3_IIR_0_M_23", "import_resto", "Importaciones · Resto", "import_uso"),
]


def _fetch_one(
    provider_id: str,
    key: str,
    display_name: str,
    categoria: str,
    series_api: str,
) -> dict[str, Any]:
    series_key = f"comercio_{key}"
    diario_file = f"comercio_{key}.json"  # serie mensual (no hay diaria)
    summary_file = f"comercio_{key}_summary.json"

    upsert_series(
        series_id=series_key,
        display_name=display_name,
        source_name="INDEC (ICA)",
        dataset=f"datos.gob.ar series {provider_id}",
        official=True,
        frequency="monthly",
        unit="millones_USD",
        provider_series_id=provider_id,
    )
    run_id = start_refresh_run(series_key)

    try:
        # Ingesta incremental: empezar desde el último punto guardado.
        history = read_series(diario_file)
        last_date: date | None = None
        if history:
            last = history[-1][0]
            last_date = last if isinstance(last, date) else None

        new_points = fetch_series_points_paged(
            series_api,
            provider_id,
            extra_params={"sort": "asc"},
            start_date=last_date,
        )
        merged = merge_series_points(history, new_points)
        write_series(diario_file, merged)
        rows_upserted = upsert_observations(series_key, merged)

        logger.info(
            "%s (%s): %d puntos, %d upserted (cat=%s)",
            series_key,
            provider_id,
            len(merged),
            rows_upserted,
            categoria,
        )

        if not merged:
            payload = {
                "updated_at": None,
                "period": None,
                "value": None,
                "monthly_change": None,
                "yoy_change": None,
                "unit": "millones_USD",
                "categoria": categoria,
                "source": {"name": "INDEC (ICA)", "dataset": "datos.gob.ar", "official": True},
            }
            finish_refresh_run(run_id, "success", 0, None)
            update_series_refresh_status(series_key, "success", None, 0, None)
            if os.getenv("ETL_EXPORT_JSON", "1") == "1":
                write_json(summary_file, payload)
            return payload

        latest_date, latest_value = merged[-1]
        # Cambio mes contra mes
        monthly_change = None
        if len(merged) >= 2:
            prev = merged[-2][1]
            if prev:
                monthly_change = round(((latest_value - prev) / prev) * 100, 2)
        # Cambio interanual (vs hace 12 puntos)
        yoy_change = None
        if len(merged) >= 13:
            year_ago = merged[-13][1]
            if year_ago:
                yoy_change = round(((latest_value - year_ago) / year_ago) * 100, 2)

        payload = {
            "updated_at": today_iso(),
            "updated_at_time": now_iso(),
            "period": latest_date.strftime("%Y-%m-%d"),
            "value": round(latest_value, 2),
            "monthly_change": monthly_change,
            "yoy_change": yoy_change,
            "unit": "millones_USD",
            "categoria": categoria,
            "source": {
                "name": "INDEC (ICA)",
                "dataset": "datos.gob.ar series " + provider_id,
                "official": True,
            },
        }
        finish_refresh_run(run_id, "success", rows_upserted, None)
        update_series_refresh_status(
            series_key, "success", latest_date, len(merged), None
        )
        if os.getenv("ETL_EXPORT_JSON", "1") == "1":
            write_json(summary_file, payload)
        return payload

    except Exception as exc:
        logger.exception("Error fetcheando comercio %s", provider_id)
        finish_refresh_run(run_id, "error", 0, str(exc))
        update_series_refresh_status(series_key, "error", None, 0, str(exc))
        raise


def fetch_comercio() -> dict[str, Any]:
    init_db()
    sources = load_sources()
    # Permitir override del endpoint via sources.json si se necesita
    series_api = (
        sources.get("comercio", {}).get(
            "series_api", "https://apis.datos.gob.ar/series/api/series"
        )
    )

    results: dict[str, Any] = {}
    failed: list[str] = []
    for provider_id, key, display_name, categoria in _SERIES:
        try:
            results[key] = _fetch_one(
                provider_id, key, display_name, categoria, series_api
            )
        except Exception as exc:
            logger.error("Falló comercio %s: %s", provider_id, exc)
            failed.append(provider_id)
    if failed:
        logger.warning("Series comercio con error: %s", ", ".join(failed))
    return results


def main() -> None:
    fetch_comercio()


if __name__ == "__main__":
    main()
