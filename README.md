<div align="center">

# Estadísticas Argentinas

**Dashboard público de indicadores macroeconómicos y sociales de Argentina**
con datos oficiales de INDEC, BCRA y otros, actualizados automáticamente.

[![Live](https://img.shields.io/badge/live-estadisticas.datalogia.app-c45a2d?style=for-the-badge)](https://estadisticas.datalogia.app)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](./LICENSE)
[![Stack](https://img.shields.io/badge/stack-Next.js%2016%20%C2%B7%20React%2019%20%C2%B7%20Python-2d251d?style=for-the-badge)](#stack)

Producto del ecosistema [Datalogía](https://datalogia.app).

</div>

---

## ¿Qué es esto?

Un dashboard público que permite consultar los principales **indicadores económicos y sociales de Argentina** sin pasar por PDFs del INDEC ni interpretar APIs sin documentar.

**Monedas:** dólar oficial, dólar blue, euro, brecha cambiaria.
**Precios:** inflación mensual, acumulada, interanual.
**Actividad:** EMAE mensual, PBI trimestral.
**Empleo e ingresos:** tasa de desocupación, tasa de empleo, salario real deflactado.
**Social:** pobreza, línea de indigencia.

Los datos se obtienen automáticamente de las APIs públicas de [datos.gob.ar](https://datos.gob.ar), [BCRA](https://www.bcra.gob.ar) y [argentinadatos.com](https://argentinadatos.com), se persisten en PostgreSQL para auditoría histórica, y se exportan como JSON estático que consume el frontend.

## Diferenciadores

- **Event annotations** sobre los charts: marcadores verticales con los principales eventos macro argentinos (corralito, default 2014, salida del cepo, crisis 2018, PASO 2019, COVID, PASO 2023, devaluación Milei). Hover → fecha + descripción.
- **Brecha cambiaria** calculada y visible como KPI propio.
- **Salario real** deflactado por IPC, no nominal.
- **Calculadora de inflación** integrada.
- **Descarga CSV** por gráfico.
- **API pública** con todos los datos en JSON.
- **Estado del pipeline** visible en `/status` con semáforos por serie.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4 |
| Charts | SVG nativo + Framer Motion (sin libs pesadas) |
| ETL | Python 3.11 (requests + psycopg) |
| Base de datos | PostgreSQL 16 (auditoría local, no requerido en prod) |
| Infraestructura | Vercel + GitHub Actions (cron diario) |
| Tipografía | Inter (variable) + JetBrains Mono |

## Inicio rápido

### Opción A — Sin Docker (sólo frontend)

Los datos JSON están committeados en el repo. Para correr el sitio sin la stack completa:

```bash
npm install
npm run dev      # http://localhost:3000
```

### Opción B — Con Docker (stack completa)

Incluye PostgreSQL + Python ETL para regenerar los datos localmente:

```bash
make setup       # Instala dependencias (npm + Python)
make bootstrap   # Levanta Postgres + corre ETL completo + genera status
make web         # Levanta Next.js
```

## API pública

Dos endpoints JSON:

- `GET /api/indicadores` — resumen de todos los indicadores.
- `GET /api/series?name=<nombre>` — serie temporal específica.

Nombres válidos: `inflacion_mensual`, `dolar_oficial_diario`, `dolar_oficial_mensual`, `dolar_blue_diario`, `dolar_blue_mensual`, `euro_diario`, `euro_mensual`, `pbi_trimestral`, `emae_mensual`, `ripte_mensual`, `ripte_nivel`, `tasa_desocupacion`, `tasa_empleo`, `tasa_pobreza`, `linea_indigencia`.

## Roadmap

El plan vivo del proyecto está en [`docs/PLAN.md`](./docs/PLAN.md).

## Sobre Datalogía

Estadísticas Argentinas forma parte de [**Datalogía**](https://datalogia.app), un ecosistema de productos de datos abiertos. Conocé más en [datalogia.app](https://datalogia.app).

## Licencia

[MIT](./LICENSE) © 2026 Datalogía. Datos abiertos sin garantía. **No es asesoramiento financiero.**
