# Estadisticas Argentinas

Dashboard de indicadores macroeconomicos y sociales de Argentina con datos oficiales actualizados automaticamente.

## Inicio rapido

### Opcion A: Con Docker (recomendado — datos siempre frescos)

```bash
git clone https://github.com/DiLoretoT/estadisticas-argentinas.git
cd estadisticas-argentinas
make setup       # Instala dependencias (npm + Python)
make bootstrap   # Levanta Postgres + corre ETL completo + genera status
make web         # Levanta Next.js en http://localhost:3000
```

### Opcion B: Sin Docker (solo frontend, datos incluidos)

```bash
git clone https://github.com/DiLoretoT/estadisticas-argentinas.git
cd estadisticas-argentinas
npm install
npm run dev      # http://localhost:3000
```

Los datos estan incluidos como JSON en `data/`. Sin Docker no se pueden actualizar automaticamente.

---

## Arquitectura

```
                    ┌──────────────────────────────────┐
                    │        APIs Publicas              │
                    │  INDEC · BCRA · argentinadatos    │
                    └──────────────┬───────────────────┘
                                   │
                    ┌──────────────▼───────────────────┐
                    │         ETL (Python)              │
                    │  fetch_inflacion, fetch_dolar,    │
                    │  fetch_euro, fetch_salarios,      │
                    │  fetch_emae, fetch_pbi,           │
                    │  fetch_empleo, fetch_pobreza      │
                    └──────────────┬───────────────────┘
                                   │
                    ┌──────────────▼───────────────────┐
                    │      PostgreSQL 16 (Docker)       │
                    │  series · observations ·          │
                    │  refresh_runs · status            │
                    └──────────────┬───────────────────┘
                                   │ JSON export
                    ┌──────────────▼───────────────────┐
                    │      data/ + data/series/         │
                    │  Archivos JSON estaticos          │
                    └──────────────┬───────────────────┘
                                   │
                    ┌──────────────▼───────────────────┐
                    │     Next.js 16 (Frontend)         │
                    │  React 19 · Tailwind 4 ·          │
                    │  framer-motion · SSR              │
                    └──────────────────────────────────┘
```

---

## Stack

| Capa | Tecnologia |
|------|-----------|
| Frontend | Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 |
| Animaciones | framer-motion |
| ETL | Python 3.11+ (requests, psycopg3) |
| Base de datos | PostgreSQL 16 (Docker) |
| Infraestructura | Docker Compose + devcontainer |

---

## Estructura del proyecto

```
estadisticas-argentinas/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Home: hero + KPIs + graficos + scroll
│   ├── layout.tsx                # Layout raiz (navbar, theme, fonts)
│   ├── globals.css               # Design tokens (colores, sombras, dark mode)
│   ├── api/
│   │   ├── indicadores/route.ts  # GET /api/indicadores
│   │   └── series/route.ts       # GET /api/series?name=X
│   └── detalle/                  # Paginas de detalle por indicador
│       ├── inflacion/
│       ├── dolar/
│       ├── euro/
│       ├── salarios/
│       ├── actividad/
│       ├── empleo/
│       └── pobreza/
│
├── components/                   # React components
│   ├── AreaChart.tsx             # Grafico SVG interactivo (hover, tooltip)
│   ├── KpiCard.tsx               # Tarjeta de indicador con sparkline
│   ├── DataTable.tsx             # Tabla con sticky header
│   ├── SpanSelector.tsx          # Selector de rango (1A/5A/10A/Max)
│   ├── DetailPage.tsx            # Layout para paginas de detalle
│   ├── Hero.tsx                  # Seccion hero animada
│   ├── HomeClient.tsx            # Orquestador de la home
│   ├── Navbar.tsx                # Navegacion con glass effect
│   ├── ThemeProvider.tsx         # Dark/light mode
│   └── ...
│
├── lib/                          # Utilidades
│   ├── formatters.ts             # Formateo (numeros, fechas, porcentajes)
│   └── readData.ts               # Lectura de JSON (server-side)
│
├── etl/                          # Pipeline ETL (Python)
│   ├── common.py                 # HTTP con retry + logging + validacion
│   ├── db.py                     # PostgreSQL (connect, upsert, status)
│   ├── schema.sql                # Esquema de base de datos
│   ├── sources.json              # Configuracion de fuentes de datos
│   ├── fetch_inflacion.py        # IPC mensual (INDEC)
│   ├── fetch_dolar.py            # Dolar oficial (BCRA)
│   ├── fetch_dolar_blue.py       # Dolar blue (argentinadatos.com)
│   ├── fetch_euro.py             # Euro (BCRA)
│   ├── fetch_salarios.py         # RIPTE + indice salarial
│   ├── fetch_emae.py             # Actividad economica
│   ├── fetch_pbi.py              # PBI trimestral
│   ├── fetch_empleo.py           # Desocupacion + empleo (EPH)
│   ├── fetch_pobreza.py          # Pobreza + indigencia
│   ├── inflacion_empalme.py      # Empalme historico de series IPC
│   ├── run_all.py                # Orquestador (todos los fetchers)
│   ├── run_pilot.py              # Orquestador piloto (3 series)
│   ├── cron_etl.sh               # Script para cron (daily/weekly/all)
│   ├── generate_status.py        # Genera data/status.json
│   └── requirements.txt          # Dependencias Python
│
├── data/                         # Datos (JSON)
│   ├── *.json                    # Indicadores resumen
│   ├── status.json               # Estado del ETL
│   └── series/                   # Series temporales
│       └── *.json
│
├── docker/
│   └── postgres.Dockerfile       # PostgreSQL 16 con timezone AR
│
├── .devcontainer/                # VS Code devcontainer
│   ├── Dockerfile
│   └── devcontainer.json
│
├── docker-compose.yml            # PostgreSQL service
├── Makefile                      # Automatizacion
├── .env.example                  # Variables de entorno
└── package.json                  # Dependencias Node.js
```

---

## Indicadores disponibles

| Indicador | Fuente | Frecuencia | Archivo serie |
|-----------|--------|------------|---------------|
| Inflacion (IPC) | INDEC | Mensual | inflacion_mensual.json |
| Inflacion historica | INDEC | Mensual | inflacion_empalmada.json |
| Dolar oficial | BCRA | Diario | dolar_oficial_diario.json |
| Dolar blue | argentinadatos.com | Diario | dolar_blue_diario.json |
| Euro | BCRA | Diario | euro_diario.json |
| RIPTE (salarios) | INDEC/SSPM | Mensual | ripte_mensual.json |
| EMAE (actividad) | INDEC/SSPM | Mensual | emae_mensual.json |
| PBI | INDEC | Trimestral | pbi_trimestral.json |
| Desocupacion | INDEC (EPH) | Trimestral | tasa_desocupacion.json |
| Empleo | INDEC (EPH) | Trimestral | tasa_empleo.json |
| Pobreza | INDEC (EPH) | Semestral | tasa_pobreza.json |
| Linea de indigencia | INDEC | Mensual | linea_indigencia.json |

---

## ETL

### Fuentes de datos

Los datos se obtienen de APIs publicas:

- **datos.gob.ar** — Series de Tiempo del gobierno argentino (INDEC, SSPM)
- **api.bcra.gob.ar** — Estadisticas cambiarias del Banco Central
- **api.argentinadatos.com** — Cotizacion del dolar blue

### Base de datos

PostgreSQL 16 con 4 tablas:

- `series` — Metadata de cada serie (nombre, fuente, frecuencia)
- `observations` — Datos temporales (series_id, date, value)
- `refresh_runs` — Historial de ejecuciones del ETL
- `series_refresh_status` — Estado actual de cada serie

### Ejecucion manual

```bash
make up          # Levanta Postgres
make init-db     # Crea tablas
make run-all     # Corre todos los fetchers
make status      # Genera status.json
```

### Ejecucion automatica (cron)

El script `etl/cron_etl.sh` soporta 3 modos:

```bash
./etl/cron_etl.sh daily    # Inflacion, dolar, euro, salarios, emae
./etl/cron_etl.sh weekly   # PBI, empleo, pobreza
./etl/cron_etl.sh all      # Todo
```

Para configurar cron:

```bash
crontab -e
# Daily a las 6AM y 20hs (hora AR)
0 9 * * * /ruta/al/proyecto/etl/cron_etl.sh daily
0 23 * * * /ruta/al/proyecto/etl/cron_etl.sh daily
# Weekly domingos 7AM AR
0 10 * * 0 /ruta/al/proyecto/etl/cron_etl.sh weekly
```

Los logs se guardan en `data/logs/` y se auto-limpian despues de 30 dias.

### Robustez del ETL

- **Reintentos HTTP**: 3 intentos con backoff exponencial (1s, 2s, 4s)
- **Logging estructurado**: timestamp, nivel, modulo, mensaje
- **Validacion de datos**: fechas y valores invalidos se loguean y saltan
- **Orquestacion resiliente**: si un fetcher falla, los demas siguen
- **Purga automatica**: refresh_runs con mas de 90 dias se eliminan

---

## Formato de datos

### Indicador resumen (`data/*.json`)

```json
{
  "updated_at": "2026-03-28",
  "monthly": { "period": "2026-02", "value": 2.62, "vs_prev_month": -0.15 },
  "source": { "name": "INDEC", "official": true }
}
```

### Serie temporal (`data/series/*.json`)

```json
[
  ["2024-01-01", 0.0254],
  ["2024-02-01", 0.0131]
]
```

Valores porcentuales en decimal (0.0254 = 2.54%). El frontend multiplica por 100.

---

## API

### `GET /api/indicadores`

Resumen de indicadores principales (inflacion, dolar, empleo, pobreza).

### `GET /api/series?name=<nombre>`

Serie temporal. Nombres: `inflacion_mensual`, `dolar_oficial_diario`, `dolar_blue_mensual`, `pbi_trimestral`, `emae_mensual`, `tasa_desocupacion`, `tasa_pobreza`, etc.

---

## Variables de entorno

Copiar `.env.example` a `.env`:

```env
PGHOST=localhost
PGPORT=5432
PGDATABASE=estadisticapp
PGUSER=estadisticapp
PGPASSWORD=estadisticapp
PG_TIMEZONE=America/Argentina/Buenos_Aires
ETL_EXPORT_JSON=1
```

---

## Deploy

### Desarrollo

```bash
make start    # Levanta todo: Postgres + ETL + Next.js
```

### Produccion

```bash
npm run build
npm start     # Puerto 3000
```

Compatible con Vercel (solo frontend), Docker Compose (full stack), o cualquier hosting Node.js.

---

## Makefile targets

| Target | Descripcion |
|--------|------------|
| `make setup` | Instala npm + Python deps |
| `make bootstrap` | Levanta DB + ETL completo + status |
| `make up` | Levanta PostgreSQL |
| `make down` | Baja PostgreSQL |
| `make init-db` | Crea schema |
| `make run-all` | ETL completo |
| `make pilot` | ETL piloto (3 series) |
| `make status` | Genera status.json |
| `make web` | Next.js dev |
| `make build` | Next.js build |
| `make start` | Todo de una |
