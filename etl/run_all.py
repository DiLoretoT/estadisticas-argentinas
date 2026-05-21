import logging
import sys

from db import init_db, purge_old_refresh_runs
from fetch_dolar import main as fetch_dolar
from fetch_dolares_alt import main as fetch_dolares_alt
from fetch_emae import main as fetch_emae
from fetch_empleo import main as fetch_empleo
from fetch_euro import main as fetch_euro
from fetch_inflacion import main as fetch_inflacion
from fetch_monedas_latam import main as fetch_monedas_latam
from fetch_pbi import main as fetch_pbi
from fetch_pobreza import main as fetch_pobreza
from fetch_salarios import main as fetch_salarios
from inflacion_empalme import main as build_inflacion_empalme

logging.basicConfig(
  level=logging.INFO,
  format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
  datefmt="%Y-%m-%dT%H:%M:%S",
  stream=sys.stdout,
)

logger = logging.getLogger(__name__)

_STEPS: list[tuple[str, object]] = [
  ("inflacion", fetch_inflacion),
  ("inflacion_empalme", build_inflacion_empalme),
  ("dolar_oficial", fetch_dolar),
  ("dolares_alt", fetch_dolares_alt),   # blue, MEP, CCL, mayorista, cripto, tarjeta
  ("euro", fetch_euro),
  ("monedas_latam", fetch_monedas_latam),  # BRL, CLP, UYU, PEN, COP, PYG, MXN
  ("salarios", fetch_salarios),
  ("emae", fetch_emae),
  ("pbi", fetch_pbi),
  ("empleo", fetch_empleo),
  ("pobreza", fetch_pobreza),
]


def main() -> None:
  logger.info("=== ETL iniciado ===")

  init_db()

  deleted = purge_old_refresh_runs(days=90)
  if deleted:
    logger.info("Purgados %d refresh_runs con más de 90 días", deleted)

  ok: list[str] = []
  failed: list[str] = []

  for name, fn in _STEPS:
    logger.info("--- Iniciando: %s ---", name)
    try:
      fn()  # type: ignore[call-arg]
      ok.append(name)
      logger.info("--- OK: %s ---", name)
    except Exception as exc:
      failed.append(name)
      logger.error("--- FALLO: %s — %s: %s ---", name, type(exc).__name__, exc)

  logger.info("=== ETL finalizado: %d OK, %d fallidos ===", len(ok), len(failed))
  if failed:
    logger.error("Series con error: %s", ", ".join(failed))
    sys.exit(1)


if __name__ == "__main__":
  main()
