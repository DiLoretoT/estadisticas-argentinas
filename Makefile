SHELL := /bin/bash

COMPOSE := docker compose
ETL_DIR := etl
VENV := $(ETL_DIR)/.venv
PYTHON := $(VENV)/bin/python3
PIP := $(VENV)/bin/pip

.PHONY: help setup up down ps logs etl-venv etl-install init-db run-all pilot status web check-docker bootstrap

help:
	@echo "Targets disponibles:"
	@echo ""
	@echo "  Setup:"
	@echo "    make setup       - Setup completo (npm install + etl-install)"
	@echo "    make bootstrap   - Levanta DB + init schema + ETL completo + status"
	@echo ""
	@echo "  Docker:"
	@echo "    make up          - Levanta PostgreSQL (docker compose up)"
	@echo "    make down        - Baja PostgreSQL"
	@echo "    make ps          - Estado de contenedores"
	@echo "    make logs        - Logs de PostgreSQL"
	@echo ""
	@echo "  ETL:"
	@echo "    make etl-install - Instala dependencias Python"
	@echo "    make init-db     - Inicializa esquema en PostgreSQL"
	@echo "    make run-all     - Corre ETL completo (todos los indicadores)"
	@echo "    make pilot       - Corre ETL piloto (inflacion, dolar, emae)"
	@echo "    make status      - Genera data/status.json"
	@echo ""
	@echo "  Web:"
	@echo "    make web         - Corre Next.js en modo desarrollo"
	@echo "    make build       - Build de produccion"
	@echo ""
	@echo "  Todo:"
	@echo "    make start       - Levanta DB + ETL + web (todo de una)"

check-docker:
	@command -v docker >/dev/null 2>&1 || (echo "ERROR: docker CLI no disponible." && exit 127)
	@docker info >/dev/null 2>&1 || (echo "ERROR: docker daemon no accesible." && exit 127)

# ── Setup ──

setup: etl-install
	npm install

etl-venv:
	python3 -m venv $(VENV)

etl-install: etl-venv
	$(PIP) install -r $(ETL_DIR)/requirements.txt

# ── Docker ──

up: check-docker
	$(COMPOSE) up -d --build

down: check-docker
	$(COMPOSE) down

ps: check-docker
	$(COMPOSE) ps

logs: check-docker
	$(COMPOSE) logs -f postgres

# ── ETL ──

init-db: etl-install
	$(PYTHON) $(ETL_DIR)/init_db.py

pilot: etl-install
	$(PYTHON) $(ETL_DIR)/run_pilot.py

run-all: etl-install
	$(PYTHON) $(ETL_DIR)/run_all.py

status: etl-install
	$(PYTHON) $(ETL_DIR)/generate_status.py

# ── Web ──

web:
	npm run dev

build:
	npm run build

# ── Combinados ──

bootstrap:
	@if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then \
		$(MAKE) up; \
	else \
		echo "WARN: docker no disponible. Asegurate de tener PostgreSQL corriendo."; \
	fi
	$(MAKE) init-db
	$(MAKE) run-all
	$(MAKE) status

start: bootstrap
	$(MAKE) web
