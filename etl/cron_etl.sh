#!/usr/bin/env bash
# ETL cron wrapper — se llama desde crontab
# Uso: ./cron_etl.sh [all|daily|weekly]
#
# daily  → inflacion, dolar, euro, salarios, emae (fuentes diarias/mensuales)
# weekly → pbi, empleo, pobreza (fuentes trimestrales/semestrales)
# all    → todo (equivalente a run_all.py)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
VENV="$SCRIPT_DIR/.venv"
PYTHON="$VENV/bin/python3"
LOG_DIR="$PROJECT_DIR/data/logs"

mkdir -p "$LOG_DIR"

MODE="${1:-all}"
LOGFILE="$LOG_DIR/etl_${MODE}_$(date +%Y%m%d_%H%M%S).log"

# Cargar .env si existe
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
fi

cd "$SCRIPT_DIR"

echo "=== ETL cron ($MODE) started at $(date -Iseconds) ===" | tee "$LOGFILE"

case "$MODE" in
  daily)
    "$PYTHON" -c "
import logging, sys
logging.basicConfig(level=logging.INFO, format='%(asctime)s | %(levelname)-8s | %(name)s | %(message)s', datefmt='%Y-%m-%dT%H:%M:%S', stream=sys.stdout)
logger = logging.getLogger('cron_daily')

from db import init_db
init_db()

from fetch_inflacion import main as fetch_inflacion
from inflacion_empalme import main as build_inflacion_empalme
from fetch_dolar import main as fetch_dolar
from fetch_dolar_blue import main as fetch_dolar_blue
from fetch_euro import main as fetch_euro
from fetch_salarios import main as fetch_salarios
from fetch_emae import main as fetch_emae

steps = [
    ('inflacion', fetch_inflacion),
    ('inflacion_empalme', build_inflacion_empalme),
    ('dolar_oficial', fetch_dolar),
    ('dolar_blue', fetch_dolar_blue),
    ('euro', fetch_euro),
    ('salarios', fetch_salarios),
    ('emae', fetch_emae),
]
ok, failed = [], []
for name, fn in steps:
    try:
        fn()
        ok.append(name)
    except Exception as e:
        failed.append(name)
        logger.error('%s failed: %s', name, e)
logger.info('Daily done: %d OK, %d failed', len(ok), len(failed))
if failed:
    sys.exit(1)
" 2>&1 | tee -a "$LOGFILE"
    ;;
  weekly)
    "$PYTHON" -c "
import logging, sys
logging.basicConfig(level=logging.INFO, format='%(asctime)s | %(levelname)-8s | %(name)s | %(message)s', datefmt='%Y-%m-%dT%H:%M:%S', stream=sys.stdout)
logger = logging.getLogger('cron_weekly')

from db import init_db
init_db()

from fetch_pbi import main as fetch_pbi
from fetch_empleo import main as fetch_empleo
from fetch_pobreza import main as fetch_pobreza

steps = [
    ('pbi', fetch_pbi),
    ('empleo', fetch_empleo),
    ('pobreza', fetch_pobreza),
]
ok, failed = [], []
for name, fn in steps:
    try:
        fn()
        ok.append(name)
    except Exception as e:
        failed.append(name)
        logger.error('%s failed: %s', name, e)
logger.info('Weekly done: %d OK, %d failed', len(ok), len(failed))
if failed:
    sys.exit(1)
" 2>&1 | tee -a "$LOGFILE"
    ;;
  all)
    "$PYTHON" "$SCRIPT_DIR/run_all.py" 2>&1 | tee -a "$LOGFILE"
    ;;
  *)
    echo "Uso: $0 [all|daily|weekly]" >&2
    exit 1
    ;;
esac

# Regenerar status
"$PYTHON" "$SCRIPT_DIR/generate_status.py" 2>&1 | tee -a "$LOGFILE"

echo "=== ETL cron ($MODE) finished at $(date -Iseconds) ===" | tee -a "$LOGFILE"

# Limpiar logs viejos (> 30 días)
find "$LOG_DIR" -name "etl_*.log" -mtime +30 -delete 2>/dev/null || true
