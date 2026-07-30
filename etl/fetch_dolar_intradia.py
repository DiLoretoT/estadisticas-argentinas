"""
Registro intradía de cotizaciones del dólar (compra/venta) para el día en curso.

A diferencia del resto del ETL —que guarda un punto de cierre por día—, este
fetcher mantiene un log liviano con los movimientos *del día de hoy* para que la
home pueda mostrar "qué pasó en la jornada": a qué hora cambió cada dólar y con
qué compra/venta.

Diseño (acordado con el producto):
  - Tira de DolarApi.com (la MISMA fuente que usa el badge en vivo del front),
    así el log intradía coincide con lo que ve el usuario en las tarjetas.
  - Es SOLO del día en curso. Al cambiar la fecha (hora de Buenos Aires) se
    resetea: no acumulamos un histórico multi-día.
  - Sólo se agrega un punto cuando compra **o** venta cambió respecto del último
    registrado para esa casa. Las lecturas sin variación no generan fila —así la
    tabla queda chica aunque el cron corra seguido.
  - Se descartan las lecturas cuyo `fechaActualizacion` no sea del día en curso
    (hora de Buenos Aires). DolarApi informa el último cambio conocido de cada
    casa, no una lectura del momento: las que no cotizaron todavía arrastran la
    fecha de jornadas anteriores y ensuciarían el log de hoy.
  - Tope de seguridad de _MAX_POINTS por casa por si algún día subimos la
    frecuencia del cron.

Escribe: data/dolar_intradia.json

Shape:
  {
    "date": "2026-06-03",                    # día (America/Argentina/Buenos_Aires)
    "updatedAt": "2026-06-03T15:00:00.000Z", # fechaActualizacion más reciente
    "source": "dolarapi.com",
    "casas": {
      "Oficial": [{"t": "...ISO...", "compra": 1405, "venta": 1455}, ...],
      "Blue": [...],
      ...
    }
  }
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

import certifi
import requests

logger = logging.getLogger(__name__)

_API_URL = "https://dolarapi.com/v1/dolares"
_OUTPUT_FILE = "dolar_intradia.json"
_TZ = ZoneInfo("America/Argentina/Buenos_Aires")
_MAX_POINTS = 48  # tope por casa (seguridad ante mayor frecuencia futura)

# casa (DolarApi) → label que usan las tarjetas de la home.
# Mismo mapeo que app/api/dolar/route.ts para mantener consistencia.
_CASA_TO_LABEL: dict[str, str] = {
    "oficial": "Oficial",
    "mayorista": "Mayorista",
    "bolsa": "MEP",
    "contadoconliqui": "CCL",
    "blue": "Blue",
    "cripto": "Cripto",
    "tarjeta": "Tarjeta",
}


def _data_path() -> Path:
    base_dir = Path(__file__).resolve().parent
    return base_dir.parent / "data" / _OUTPUT_FILE


def _today_ba() -> str:
    from datetime import datetime

    return datetime.now(_TZ).date().isoformat()


def _http_get_json(url: str) -> Any:
    allow_insecure = os.getenv("ALLOW_INSECURE_SSL") == "1"
    verify = False if allow_insecure else certifi.where()
    resp = requests.get(url, timeout=30, verify=verify, headers={"Accept": "application/json"})
    resp.raise_for_status()
    return resp.json()


def _load_existing(today: str) -> dict[str, Any]:
    """Carga el log existente; si es de otro día (o no existe), arranca limpio."""
    path = _data_path()
    if path.exists():
        try:
            with path.open("r", encoding="utf-8") as handle:
                data = json.load(handle)
            if isinstance(data, dict) and data.get("date") == today:
                casas = data.get("casas")
                if isinstance(casas, dict):
                    return data
        except (json.JSONDecodeError, OSError) as exc:
            logger.warning("No se pudo leer %s, se reinicia: %s", path, exc)
    return {"date": today, "updatedAt": None, "source": "dolarapi.com", "casas": {}}


def _fecha_ba(iso: str | None) -> str | None:
    """ISO (UTC) → 'YYYY-MM-DD' del día en hora de Buenos Aires."""
    if not iso:
        return None
    from datetime import datetime

    try:
        parsed = datetime.fromisoformat(iso.replace("Z", "+00:00"))
    except ValueError:
        return None
    return parsed.astimezone(_TZ).date().isoformat()


def _coerce_number(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def fetch_dolar_intradia() -> dict[str, Any]:
    today = _today_ba()
    log = _load_existing(today)
    casas: dict[str, list[dict[str, Any]]] = log["casas"]

    items = _http_get_json(_API_URL)
    if not isinstance(items, list):
        raise ValueError("Respuesta inesperada de DolarApi (no es lista)")

    # Limpieza de puntos de jornadas anteriores que hayan quedado guardados por
    # corridas previas a este filtro (p. ej. mayorista con la fecha de ayer).
    dropped_stale = 0
    for label, series in casas.items():
        fresh = [p for p in series if _fecha_ba(p.get("t")) == today]
        dropped_stale += len(series) - len(fresh)
        casas[label] = fresh

    latest_updated = log.get("updatedAt")
    appended = 0
    skipped_stale = 0

    for item in items:
        label = _CASA_TO_LABEL.get(item.get("casa", ""))
        if not label:
            continue

        compra = _coerce_number(item.get("compra"))
        venta = _coerce_number(item.get("venta"))
        if compra is None and venta is None:
            continue

        ts = item.get("fechaActualizacion")

        # DolarApi informa el ÚLTIMO cambio conocido de cada casa, no una
        # lectura de ahora. Las casas que todavía no cotizaron hoy (mayorista
        # fuera de rueda, fines de semana) devuelven la fecha de días
        # anteriores: si las guardáramos, el log "de hoy" quedaría con
        # timestamps de otra jornada.
        if _fecha_ba(ts) != today:
            skipped_stale += 1
            continue

        point = {"t": ts, "compra": compra, "venta": venta}

        series = casas.setdefault(label, [])
        last = series[-1] if series else None

        # Sólo agregamos si cambió compra o venta (o es el primer dato del día).
        if last is None or last.get("compra") != compra or last.get("venta") != venta:
            series.append(point)
            appended += 1
            if len(series) > _MAX_POINTS:
                del series[: len(series) - _MAX_POINTS]

        if ts and (latest_updated is None or ts > latest_updated):
            latest_updated = ts

    log["updatedAt"] = latest_updated
    log["source"] = "dolarapi.com"

    path = _data_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(log, handle, ensure_ascii=False, indent=2)

    logger.info(
        "dolar_intradia: %d casas, %d puntos nuevos, %d lecturas de otra "
        "jornada descartadas, %d puntos viejos purgados (día %s)",
        len(casas),
        appended,
        skipped_stale,
        dropped_stale,
        today,
    )
    return log


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    fetch_dolar_intradia()


if __name__ == "__main__":
    main()
