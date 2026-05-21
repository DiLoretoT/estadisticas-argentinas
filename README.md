<div align="center">

# Estadísticas Argentinas

**Dashboard público de indicadores macroeconómicos y sociales de Argentina**
con datos oficiales de INDEC, BCRA y otros, actualizados automáticamente.

[![Live](https://img.shields.io/badge/live-estadisticas.datalogia.app-c45a2d?style=for-the-badge)](https://estadisticas.datalogia.app)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](./LICENSE)
[![Stack](https://img.shields.io/badge/stack-Next.js%2016%20%C2%B7%20React%2019%20%C2%B7%20Python-2d251d?style=for-the-badge)](#stack)

[Ver demo](https://estadisticas.datalogia.app) · [Reportar issue](https://github.com/DiLoretoT/estadisticas-argentinas/issues) · [Roadmap](./docs/PLAN.md)

</div>

---

## ¿Qué es esto?

Un dashboard público que permite a cualquiera consultar los principales **indicadores económicos y sociales de Argentina** sin tener que pasar por PDFs del INDEC ni interpretar APIs sin documentar.

- **Inflación** mensual (IPC), acumulada e histórica.
- **Tipo de cambio**: dólar oficial, blue, euro.
- **Actividad**: EMAE mensual, PBI trimestral.
- **Mercado laboral**: desocupación, tasa de empleo.
- **Condiciones sociales**: pobreza, línea de indigencia.
- **Salarios**: RIPTE.

Los datos se obtienen automáticamente de las APIs públicas de [datos.gob.ar](https://datos.gob.ar), [BCRA](https://www.bcra.gob.ar) y [argentinadatos.com](https://argentinadatos.com), se persisten en PostgreSQL para auditoría histórica, y se exportan como JSON estático que consume el frontend.

## ¿Por qué lo hice?

Como argentino que necesita mirar estos números todo el tiempo (para entender qué pasa con la economía, para tomar decisiones personales y profesionales), me cansé de:

- Bajar PDFs del INDEC cada vez.
- Esperar a que algún medio publique el dato bien (o mal).
- Calcular brechas y deltas a mano.
- Pasar por dashboards oficiales con UX de hace 15 años.

Y como **vidriera técnica**, este proyecto es una forma de mostrar de punta a punta: ingesta de datos públicos, modelado relacional con Postgres, transformaciones reproducibles, frontend moderno con Next.js 16, deploy gratuito con autopilot. Todo el código abierto, MIT, replicable para cualquier otro país.

Forma parte del ecosistema [Datalogía](https://datalogia.app).

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
git clone https://github.com/DiLoretoT/estadisticas-argentinas.git
cd estadisticas-argentinas
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

Más detalles del ETL, el schema y los Makefile targets en [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md) *(próximamente)*.

## API pública

El sitio expone dos endpoints JSON públicos:

- `GET /api/indicadores` — resumen de todos los indicadores.
- `GET /api/series?name=<nombre>` — serie temporal específica.

Nombres válidos: `inflacion_mensual`, `dolar_oficial_diario`, `dolar_oficial_mensual`, `dolar_blue_diario`, `dolar_blue_mensual`, `euro_diario`, `euro_mensual`, `pbi_trimestral`, `emae_mensual`, `ripte_mensual`, `ripte_nivel`, `tasa_desocupacion`, `tasa_empleo`, `tasa_pobreza`, `linea_indigencia`.

Documentación completa de API: próximamente en `/api`.

## Roadmap

El plan vivo del proyecto está en [`docs/PLAN.md`](./docs/PLAN.md). Bloques:

- **A — Quick wins** (higiene base, fixes de datos, style Datalogía).
- **B — Diferenciadores** (event annotations argentinas, brecha cambiaria, más dólares, salario real).
- **C — Showcase++** (calculadora de inflación, embed mode, OG dinámica, comparativa LATAM, API docs).
- **D — Autopilot** (GitHub Action cron, `/status`, tests, tag v1.0).

## Contribuir

PRs, issues y forks bienvenidos. Si encontrás un dato mal, un error de fuente, o tenés sugerencias de features: [abrí un issue](https://github.com/DiLoretoT/estadisticas-argentinas/issues).

## Sobre el autor

**Tomás Di Loreto** — Data Engineer & Analytics. Construyo software de datos.

- [GitHub](https://github.com/DiLoretoT)
- [LinkedIn](https://www.linkedin.com/in/tomas-di-loreto)
- [datalogia.app](https://datalogia.app)

## Licencia

[MIT](./LICENSE) © 2026 Tomás Di Loreto. Datos abiertos sin garantía. **No es asesoramiento financiero.**
