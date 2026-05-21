# AGENTS.md — Guía para agentes IA y colaboradores

Este repo es una vidriera pública de un dashboard de estadísticas económicas argentinas. Si sos una IA o un colaborador nuevo, empezá acá.

## Documentos clave

- **[`README.md`](./README.md)** — Qué es, cómo correrlo, stack y arquitectura.
- **[`docs/PLAN.md`](./docs/PLAN.md)** — Plan vivo de implementación (8 fases). Estado actual del trabajo, decisiones tomadas, fases pendientes.
- **[`etl/sources.json`](./etl/sources.json)** — Catálogo de fuentes de datos (datos.gob.ar, BCRA, argentinadatos).

## Convenciones del repo

- **Frontend**: Next.js 16 App Router + React 19 + Tailwind 4 + TypeScript. Server Components por default.
- **ETL**: Python 3.11, sin frameworks pesados. `requests` + `psycopg`. Cada fetcher se ejecuta de forma independiente; el orquestador (`etl/run_all.py`) es resiliente a fallos parciales.
- **Datos**: Postgres es la fuente local de verdad para histórico y auditoría. Los JSON en `data/` son el export que consume el frontend (committeado al repo). El deploy NO requiere Postgres.
- **Idioma**: español rioplatense en UI y docs orientadas al lector. Comentarios técnicos en código pueden ir en inglés.
- **Commits**: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`).

## Reglas para agentes IA

1. Antes de modificar arquitectura, leer `docs/PLAN.md`. Si la decisión que vas a tomar no está cubierta, registrala como ADR antes de implementar.
2. No introducir dependencias nuevas sin chequear si el problema se resuelve sin ellas.
3. Validar `npm run build` y `npm run lint` antes de cerrar una tarea de frontend.
4. Para cambios al ETL, validar al menos un fetcher localmente antes de commitear.
5. Heredar el estilo de archivos vecinos. No reformatear código no relacionado al cambio.

## Aviso sobre versiones

Next.js 16 y React 19 son recientes (octubre 2025+). APIs, conventions y file structure pueden diferir de versiones anteriores. Ante la duda, consultar la doc oficial (`https://nextjs.org/docs`) o `node_modules/next/dist/docs/`.
