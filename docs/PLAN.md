# Plan de implementación — Vidriera pública

> Documento centralizado del trabajo para llevar el repo `estadisticas-argentinas` a estado público "vidriera" en `estadisticas.datalogia.app`. Cualquier sesión (Claude, vos, otra IA) debe poder retomar el trabajo leyendo solo este archivo + el `README.md`.

**Última actualización:** 2026-05-21
**Estado global:** Fase 0 ✅ · Fase 1 ✅ · Bloque A ✅ · D1 multi-país ✅ · Bloque B ✅ (parcial) · Bloque C ✅ (parcial) · Bloque D ✅ (parcial) · Pendientes: refresh primera corrida Action + tests + tag v1.0
**Dueño:** Tomás Di Loreto

---

## Visión y alcance

- Hacer del repo una **vidriera profesional** (portfolio público) que muestre capacidad full-stack: ingesta de datos públicos, modelo relacional, frontend moderno y operación automatizada.
- Deploy en **Vercel** bajo `https://estadisticas.datalogia.app`. Cuenta Vercel ya paga, dominio `datalogia.app` ya pago — costo incremental cero.
- Argentina es el **primer país** del producto. La estructura del sitio queda preparada para sumar más países en el futuro (Chile, Uruguay, Brasil, etc.) sin reescribir.
- Costo objetivo de operación: **USD 0/mes**. Refresh de datos vía GitHub Actions + Postgres efímero en el runner; el frontend lee JSON committeado.

---

## Decisiones tomadas

| # | Decisión | Justificación | Fecha |
|---|----------|---------------|-------|
| D1 | Deploy en Vercel, no full Docker en VPS | Cuenta paga existente, Next.js es ciudadano de primera, $0 incremental | 2026-05-20 |
| D2 | Postgres **no** en producción. Sólo local + en GitHub Actions runner | El frontend ya lee JSON. Postgres es valor agregado para ETL/auditoría, no para servir | 2026-05-20 |
| D3 | Routing multi-país con path-prefix `/argentina/...` (sin dynamic route todavía) | YAGNI: con un solo país real, agregar `[country]/` ahora es abstracción prematura. Refactor a dynamic route cuando entre el segundo país | 2026-05-20 |
| D4 | Licencia **MIT** | Estándar para portfolio público, permite forks y reuso | 2026-05-20 |
| D5 | GitHub Action que commitea data a `main` (no PR auto-merge) | Más simple, menos ruido. El workflow incluye `[skip ci]` solo si no hay cambios | 2026-05-20 |
| D6 | `datalogia.app` queda libre para landing del producto Datalogía. Este proyecto usa subdominio `estadisticas.datalogia.app` | Separación de productos. `datalogia.app` raíz es para el SaaS principal | 2026-05-20 |
| D7 | **Style de Datalogía** = paleta cream + terracotta + dark beige (importado de tdl-logistica). Inter + JetBrains Mono. OKLCH. Radius 0.75rem. | Unifica visualmente todos los productos del ecosistema Datalogía | 2026-05-20 |
| D8 | **Tasa de indigencia** NO se muestra (sólo en PDF de INDEC, no hay serie continua en datos.gob.ar). Se reemplaza por "Línea de indigencia" (umbral $) | Subagente investigó catálogo completo. Confirmado | 2026-05-20 |
| D9 | **Plan v2** incorpora 4 bloques (A quick wins, B diferenciadores, C showcase, D autopilot) basado en audit del sitio live + research apps similares (FRED, OWID, ArgenData) + tendencias 2026 | 3 subagentes paralelos generaron 30+ recomendaciones; priorizadas por impacto/esfuerzo | 2026-05-20 |

---

## Decisiones abiertas (pendientes de definir)

- **OD1** — ¿Idioma del sitio? Por ahora español. ¿Se agrega `/en/` en el futuro o se asume LATAM-only? → resolver antes de Fase 5.
- **OD2** — ¿Logo / favicon propio o se queda con el Next.js default? → mínimo cambiar el favicon en Fase 2.
- **OD3** — ¿Analytics? Plausible (USD 9/mes) vs Vercel Analytics (incluido en plan pago) vs Umami self-hosted. → resolver en Fase 3, **default Vercel Analytics** porque ya está pago.
- **OD4** — Cuando llegue el segundo país, refactorear a dynamic route `[country]/` o crear sub-app. → no aplica todavía.

---

## Estado del repo al armar el plan

- Branch: `main` · working tree clean · último commit `d394876 Migrar ETL + Docker + Postgres al repo nuevo`.
- Datos en `data/`: actualizados al **2026-03-28** (stale, ~2 meses al momento del plan).
- Series rotas en `data/status.json`: `emae` (ID `11.3_VIPAA_2004_M_31`) y `tasa_indigencia` (ID `116.5_INDI_0_S_18`) → ambas devuelven `400 Bad Request` desde datos.gob.ar.
- Build no validado en esta sesión. Asumir que `npm run build` puede fallar y validarlo en Fase 1.

---

## Fases

Las fases están pensadas para ser cerradas de a una. **No iniciar la siguiente hasta que la anterior esté `done`.** Cada fase tiene criterios de listo binarios.

### Fase 0 — Setup externo (DUEÑO: vos) ⏳

Trabajo que necesita tu mano y no puedo hacer yo. Idealmente listo antes o durante Fase 1.

- [ ] **0.1** — Crear proyecto en Vercel conectado al repo `DiLoretoT/estadisticas-argentinas`. Framework preset: Next.js. Build command: default. Root directory: `./`.
- [ ] **0.2** — En Vercel: agregar el dominio `estadisticas.datalogia.app` al proyecto. Vercel te va a pedir crear un registro `CNAME` o `A` en el DNS de `datalogia.app` apuntando a `cname.vercel-dns.com`. Hacelo donde tengas registrado el dominio (Cloudflare / NIC.ar / Namecheap / etc.).
- [ ] **0.3** — Verificar que el SSL se emite correctamente (Vercel lo hace solo vía Let's Encrypt).
- [ ] **0.4** — Pasarme la URL preview que Vercel asigna por defecto (`estadisticas-argentinas-*.vercel.app`) para que pueda referenciarla en el README intermedio.

**Listo cuando:** `https://estadisticas.datalogia.app` responde con cert válido (aunque sea con la versión sin refactor todavía).

---

### Fase 1 — Higiene base (DUEÑO: yo, con tu visto bueno por commit) 🔧

Sanear el repo sin tocar arquitectura de rutas. Todo lo que no requiere decisión de producto.

- [x] **1.1** — Agregar `LICENSE` MIT en root, año 2026, owner "Tomás Di Loreto".
- [x] **1.2** — Mover/reescribir `AGENTS.md` (boilerplate Next.js reemplazado por guía útil) y eliminar `CLAUDE.md` del root.
- [x] **1.3** — IDs nuevos investigados. EMAE: `143.3_NO_PR_2004_A_21` (actualizado en `sources.json`). Tasa de indigencia: confirmado que **no existe** en datos.gob.ar como serie continua (solo en PDFs INDEC). Decisión: removerla del ETL (ya no está en `sources.json`).
- [~] **1.4** — Diferido a Fase 5. El refresh local necesita Docker. La data al 2026-03-28 sigue funcionando; el primer refresh lo hará el GitHub Action.
- [x] **1.5** — Heurística reemplazada por funciones explícitas `pctFromPercent` / `pctFromRatio` en `HomeClient.tsx`. Cada call site declara qué unidad espera.
- [x] **1.6** — `readData.ts` ahora loguea con `console.error` los archivos que no encuentra. Fallback vacío preservado.
- [x] **1.7** — Lint script cambiado a `"eslint ."`.
- [x] **1.8** — `npm run build` valida OK localmente. 13 páginas estáticas + 2 API routes dinámicas. 0 errores.
- [x] **1.9** — `next.config.ts` con `poweredByHeader: false` + Cache-Control para `/api/*` (s-maxage=3600, swr=86400).
- [x] **1.10** — Commit consolidado de Fase 1: `chore: higiene base para vidriera pública`.

**Listo cuando:** `npm run build` pasa local, `make run-all` deja `status.json` con todas `success`, repo tiene LICENSE, AGENTS/CLAUDE fuera del root, lint limpio.

---

### Bloque A (Plan v2) — Quick wins críticos + style Datalogía ⚡

Fixes urgentes detectados en el audit + aplicar la identidad visual del ecosistema Datalogía. Esto reemplaza la Fase 2 original.

- [x] **A0** — Branding assets de `tdl-logistica/public/branding/` copiados a `public/branding/`.
- [x] **A0b** — `globals.css` migrado a tokens Datalogía (paleta OKLCH cream+terracotta, Inter + JetBrains Mono, radius 0.75rem, shadow-soft, card-hover).
- [x] **A1** — Tildes corregidas en todos los componentes y páginas visibles.
- [x] **A2** — Fix tabla duplicada en `/detalle/inflacion` (mantenida sólo serie mensual; histórica documentada como próxima).
- [x] **A3** — Fix inconsistencia desocupación 7% vs 7,5% — bug por `round(x, 2)` en fetch_empleo.py / fetch_pobreza.py. Cambiado a `round(x, 4)`. `data/empleo.json` corregido manual.
- [x] **A4** — KpiCard rediseñada: fecha + delta vs período anterior con flecha direccional + color semántico (goodDirection-aware) + sparkline con marker en último punto.
- [x] **A5** — Footer profesional con autor, GitHub, LinkedIn, datalogia.app, licencia MIT, fuentes, disclaimer "no es asesoramiento financiero".
- [x] **A6** — README rehecho: hero + badges + sección "¿Qué es esto?" + "¿Por qué lo hice?" + Stack + Quick start + API + Roadmap + autor.
- [x] **A7** — Metadata OG en `layout.tsx` + `robots.ts` + `sitemap.ts` + `opengraph-image.tsx` dinámica + favicons Datalogía.

### Fase 2 — README y SEO básico (DUEÑO: yo) 📝

El README es la cara del repo público. SEO básico para que el deploy sea compartible.

- [ ] **2.1** — Reescribir hero del README: título grande, párrafo de 2 líneas con el "qué", badges (License MIT, Next.js 16, Last update, Live demo), screenshot grande del home.
- [ ] **2.2** — Tomar screenshot del home corriendo local (1440×900, light mode). Guardar en `docs/screenshot.png` y referenciar desde README.
- [ ] **2.3** — Agregar sección "¿Por qué lo hice?" / "¿Qué muestra este repo?" con 3–4 párrafos. Tono: portfolio, no documentación técnica.
- [ ] **2.4** — Sección "Sobre mí" al final con link a GitHub, LinkedIn, y `datalogia.app`.
- [ ] **2.5** — Mantener las secciones técnicas (Arquitectura, Stack, Estructura) pero comprimidas. Detalle de ETL/Makefile → mover a `docs/DEVELOPMENT.md`.
- [ ] **2.6** — Metadata OG en `app/layout.tsx`: `title`, `description`, `openGraph` con `images`, `twitter` card. Imagen OG: generar una básica de 1200×630 con título + screenshot recortado.
- [ ] **2.7** — `app/robots.ts` o `public/robots.txt` permitiendo indexar todo.
- [ ] **2.8** — `app/sitemap.ts` con las rutas estáticas (home + 7 detalles).
- [ ] **2.9** — Favicon propio (al menos cambiar del default de Next.js — usar un emoji 📊 o un SVG simple).

**Listo cuando:** README abre con hero atractivo, screenshot visible, badges activos. Compartiendo el link de Vercel en WhatsApp/LinkedIn se ve la OG card bien renderizada.

---

### Fase 3 — Deploy a Vercel (DUEÑO: vos + yo) 🚀

- [ ] **3.1** — Push de Fases 1 y 2 a `main`. Vercel hace deploy automático.
- [ ] **3.2** — Smoke test del deploy: abrir `https://estadisticas.datalogia.app`, navegar las 7 páginas de detalle, verificar que los gráficos cargan, probar dark mode, probar en mobile.
- [ ] **3.3** — Habilitar **Vercel Analytics** (plan pago lo incluye). Decidir si también habilitar Speed Insights.
- [ ] **3.4** — Verificar Core Web Vitals iniciales. Si LCP > 2.5s, ver si conviene `next/image` para el screenshot OG, lazy load de gráficos, etc.
- [ ] **3.5** — Actualizar badge "Live demo" del README con el link real.
- [ ] **3.6** — Capturar primer LCP/CLS/FID en `docs/PERFORMANCE.md` como baseline para futuras mejoras.

**Listo cuando:** dominio resuelve, todas las páginas renderizan datos correctos, Analytics empieza a registrar visitas.

---

### Fase 4 — Restructure multi-país (DUEÑO: yo) 🌎

Mover Argentina a su propio subpath y crear un landing del subdominio que liste países.

- [ ] **4.1** — Crear ADR (`docs/decisions/0001-routing-multi-pais.md`) con la decisión D3 y el plan.
- [ ] **4.2** — Mover todo el contenido actual de `/` → `/argentina/` y `/detalle/<x>/` → `/argentina/detalle/<x>/`. Mantener el código de `components/HomeClient.tsx` reutilizable.
- [ ] **4.3** — Crear nuevo `app/page.tsx` (landing del subdominio) con: hero "Estadísticas LATAM", grid de países (Argentina activo, Chile/Uruguay/Brasil como `coming soon` deshabilitados), copy corto sobre el proyecto.
- [ ] **4.4** — Crear `data/countries.json` con el catálogo de países y su estado (`active` / `coming_soon`). Argentina es el único `active` hoy.
- [ ] **4.5** — Mover los JSON de datos: `data/inflacion.json` → `data/argentina/inflacion.json`, idem `data/series/` → `data/argentina/series/`. Actualizar `lib/readData.ts` para que tome `country` como parámetro: `readIndicator(country, fileName)`.
- [ ] **4.6** — Actualizar ETL: `data/argentina/...` como root de export. `etl/run_all.py` y `etl/common.py:write_json` reciben prefijo de país.
- [ ] **4.7** — Actualizar `next.config.ts` con `redirects()` de las rutas viejas a las nuevas (para que links externos viejos sigan funcionando si los hubiera).
- [ ] **4.8** — Actualizar `app/api/indicadores/route.ts` y `app/api/series/route.ts` para aceptar `?country=argentina` (default a `argentina` por backwards compat).
- [ ] **4.9** — Actualizar `Navbar` para mostrar selector de país (con Argentina activo y dropdown de "próximamente"), o un breadcrumb `Datalogía Estadísticas / Argentina`.
- [ ] **4.10** — Smoke test completo. Redeploy.
- [ ] **4.11** — Actualizar `sitemap.ts` con las rutas nuevas.

**Listo cuando:** `estadisticas.datalogia.app/` muestra el landing, `estadisticas.datalogia.app/argentina` muestra el dashboard actual, todas las URLs viejas redirigen.

---

### Fase 5 — Autopilot con GitHub Actions (DUEÑO: yo) 🤖

Refresh automático de datos. Sin esto, la vidriera muere en 2 semanas.

- [ ] **5.1** — Workflow `.github/workflows/etl-daily.yml`. Cron: `0 9,23 * * *` (06:00 y 20:00 hora AR). Servicios: `postgres:16` con healthcheck. Steps: checkout, setup Python, instalar `etl/requirements.txt`, correr `python etl/run_all.py`, correr `python etl/generate_status.py`, ejecutar `git config` y `git diff --quiet data/ || (git add data/ && git commit -m "data: refresh automático $(date -I)" && git push)`. Permisos: `contents: write`.
- [ ] **5.2** — Workflow `.github/workflows/ci.yml`. Triggers: `push` a `main` y `pull_request`. Jobs: lint (`npm run lint`), typecheck (`npx tsc --noEmit`), build (`npm run build`). Sin tests todavía.
- [ ] **5.3** — Configurar secrets en GitHub si hace falta (por ahora ninguna API requiere key, pero dejar el camino listo).
- [ ] **5.4** — Bot commit author: `github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>` (estándar).
- [ ] **5.5** — Validar que el primer run del cron funciona y commitea data nueva. Si Vercel auto-deployea por push, está OK.
- [ ] **5.6** — Agregar badge "Last ETL run" al README, alimentado por el workflow.
- [ ] **5.7** — Agregar `docs/AUTOMATION.md` explicando cómo funciona el autopilot.

**Listo cuando:** el cron corrió al menos una vez con éxito en `main` y los JSON quedaron actualizados sin intervención manual.

---

### Fase 6 — Página /status (DUEÑO: yo) 📊

Mostrar al visitante la trazabilidad del pipeline. Esto es **showcase puro** — diferenciador.

- [ ] **6.1** — Crear `app/status/page.tsx`. Lee `data/status.json` (que ya existe) y renderiza una tabla con semáforos: serie / última corrida / última fecha de dato / fila count / estado.
- [ ] **6.2** — Banner en home con "Última actualización: hace X horas" usando el `last_run_at` máximo del `status.json`.
- [ ] **6.3** — Link a `/status` desde el footer y el navbar.
- [ ] **6.4** — Si hay series con `last_status = "error"`, mostrar advertencia visible en `/status` (no romper la UX del home).

**Listo cuando:** `/status` rendea, banner del home muestra recencia, página funciona en mobile.

---

### Fase 7 — Tests mínimos (DUEÑO: yo) ✅

No es bloqueante para vidriera, pero suma muchísimos puntos para empleadores que miran el repo.

- [ ] **7.1** — Setup pytest en `etl/`. Tests para `etl/common.py`: `parse_series_points`, `merge_series_points`, `_ytd_from_monthly` (de `fetch_inflacion.py`).
- [ ] **7.2** — Mock de `requests` en un par de tests de fetcher (al menos `fetch_inflacion.py`).
- [ ] **7.3** — Setup Vitest en root. Tests para `lib/formatters.ts`.
- [ ] **7.4** — Agregar jobs `pytest` y `vitest` al workflow `ci.yml`.
- [ ] **7.5** — Badge "Tests passing" en README.

**Listo cuando:** suite mínima corre verde en CI.

---

### Fase 8 — Cierre v1.0 (DUEÑO: yo + vos) 🎉

- [ ] **8.1** — Revisar todo el repo con ojos de visitante externo. Cualquier inconsistencia o doc rota se arregla.
- [ ] **8.2** — Tag `v1.0` en `main`. Release notes con changelog generado.
- [ ] **8.3** — Actualizar `_Portfolio/Estado_General.md` (si aplica para tu metodología personal) marcando este proyecto como `done v1.0`.
- [ ] **8.4** — Vos: post en LinkedIn con el link y captura. Plantilla sugerida queda en `docs/LAUNCH_POST.md` (la armo cuando lleguemos).
- [ ] **8.5** — Vos: link al repo y al deploy desde tu sitio principal `datalogia.app` (si tiene sección de proyectos).

**Listo cuando:** v1.0 taggeada, post publicado, tráfico empieza a llegar.

---

## Cómo trabajar este plan

1. **Una fase a la vez.** No saltar adelante. Si surge algo urgente en una fase posterior, anotar en "Decisiones abiertas" y seguir.
2. **Cada fase tiene un commit consolidado** (o varios si tiene sentido — ej. Fase 4 conviene fragmentar). Conventional Commits.
3. **Checkboxes se actualizan en este archivo a medida que se completan.** El commit que cierra una fase incluye el update del `PLAN.md`.
4. **Si una sub-tarea se desvía o queda bloqueada**, registrarla en la sección "Bloqueos y desvíos" abajo, no improvisar.
5. **Al iniciar una sesión nueva**, leer este archivo + `README.md` + último commit. Eso es suficiente para retomar.
6. **Cualquier decisión de producto no listada en "Decisiones tomadas"** se discute antes de implementar.

---

## Bloqueos y desvíos

> Registrar acá cualquier desvío del plan, bloqueo externo, o cambio de scope durante la ejecución.

- **2026-05-20** — **Restructure ETL/JSON parametrizado por país** queda como follow-up cuando entre el segundo país. Hoy `data/*.json` está sin prefijo de país; el frontend usa `/argentina/*` en la URL pero todos los JSON viven en `data/`. Cuando llegue Chile o similar, hay que: (a) mover `data/*.json` → `data/argentina/*.json`, (b) parametrizar `lib/readData.ts` para que acepte `country`, (c) actualizar paths en cada `page.tsx`. YAGNI por ahora.
- **2026-05-20** — **EMAE + indigencia datos viejos en repo**. El ID nuevo de EMAE está en `sources.json` pero el JSON aún tiene la data al 2026-03-28 (vieja). Cuando el GitHub Action corra por primera vez, va a hacer la primera ingesta exitosa de EMAE y regenerar los JSON. Hasta entonces, `/detalle/actividad` muestra data hasta lo que estaba en el JSON committeado.
- **2026-05-21** — **GitHub Action `etl-daily.yml` no validada en CI real todavía**. El YAML está estructurado correctamente pero la primera corrida agendada es a las 09:00 UTC. Mañana podemos disparar manualmente con `gh workflow run etl-daily.yml` para verificar antes del primer cron. Si falla, vamos a tener que iterar sobre el workflow.
- **2026-05-21** — **Tests (D4) y Comparativa LATAM (C7) pendientes**. No alcancé esta sesión. Quedan como próximo trabajo.

---

## Bitácora

| Fecha | Quién | Fase | Nota |
|-------|-------|------|------|
| 2026-05-20 | Tomás + Claude | — | Plan inicial creado y aprobado |
| 2026-05-20 | Tomás | F0 | Proyecto Vercel creado. URL preview: `estadisticas-argentinas-iw65.vercel.app`. CNAME en Cloudflare pendiente. |
| 2026-05-20 | Claude | F1 | 1.1–1.3, 1.5–1.9 completas. 1.4 diferida a F5. Build OK local. Commit `9d4bf55`. |
| 2026-05-20 | Claude | A | Quick wins + style Datalogía + SEO base. LICENSE, AGENTS reescrito, CLAUDE.md fuera, EMAE fix, heurística unidades reemplazada, footer pro con autor/GitHub/LinkedIn, Hero rediseñado, robots/sitemap/OG dinámica, Inter+JetBrains, paleta cream+terracotta OKLCH. README rehecho con hero+badges+screenshot. Commit `a0ee703`. |
| 2026-05-20 | Claude | D1 | Restructure multi-país: home dashboard a `/argentina`, landing en `/` con catálogo de países (Argentina activo + CL/UY/BR coming soon). Redirect 301 `/detalle/*` → `/argentina/detalle/*`. Sitemap actualizado. Commit `45211a3`. |
| 2026-05-21 | Claude | B | Event annotations argentinas (10 eventos: corralito, default, COVID, devaluación Milei...). Brecha cambiaria en /dolar. Salario real deflactado por IPC. Botón "Descargar CSV" en cada chart. data/events.json + lib/events.ts + lib/salarioReal.ts. Commit `a53a372`. |
| 2026-05-21 | Claude | C+D | Calculadora de inflación (/calculadora). Página /metodologia con tabla de 13 indicadores + reproducibilidad. Página /status con semáforos del ETL. GitHub Actions: `etl-daily.yml` (cron 06:00 y 20:00 AR) + `ci.yml` (lint+typecheck+build). Fixed lint errors (ThemeProvider, AreaChart). Commit `d416fd9`. |

---

## Plan v3 — Visión expandida: "Analizar TODO un país y cómo se relaciona"

**Objetivo:** convertir el dashboard en el lugar donde alguien va a entender un país en TODAS sus dimensiones medibles y CÓMO se relacionan entre sí. Argentina como primer país; estructura preparada para LATAM.

### Catálogo de indicadores por bloque temático

Generado a partir de research de fuentes oficiales argentinas + APIs internacionales (Banco Mundial WDI, IMF, OECD MEI, CEPALSTAT).

#### 1. Macroeconomía clásica ✅ (parcialmente cubierto)
- **Indicadores**: PBI, EMAE, IPC nacional, IPC núcleo/regulados/estacionales, IPI manufacturero, salarios (RIPTE, IS).
- **Cubierto**: IPC, RIPTE, EMAE, PBI.
- **Faltante**: IPC desagregado (core/regulados/estacionales), IPI manufacturero, índice de salarios.
- **Cross**: PBI vs salario real (productividad), IPC core vs headline.

#### 2. Sector externo ❌ (pendiente)
- **Indicadores**: balanza comercial (ICA INDEC), balanza de pagos, reservas BCRA brutas/netas, exportaciones por complejo, importaciones por uso económico, términos de intercambio.
- **Fuentes**: INDEC ICA, BCRA API `api.bcra.gob.ar/estadisticas/v3.0/monetarias`.
- **Cross**: reservas netas vs brecha cambiaria, exportaciones agro vs precios Chicago, importaciones de energía vs producción Vaca Muerta.

#### 3. Sector fiscal ❌ (pendiente)
- **Indicadores**: resultado primario, financiero, deuda pública por moneda/legislación, recaudación AFIP (IVA, Ganancias, Débitos/Créditos, retenciones), gasto por finalidad.
- **Fuentes**: MECON Secretaría de Hacienda `economia.gob.ar/datos`, ARCA (ex-AFIP), ONP deuda.
- **Cross**: déficit primario vs emisión BCRA, recaudación real vs EMAE, deuda/PBI vs riesgo país.

#### 4. Sector monetario ❌ (pendiente)
- **Indicadores**: base monetaria, M1/M2/M3, tasa de política monetaria (TPM), BADLAR, TM20, plazo fijo minorista, LELIQ/Notaliq/LEFI stock, encajes.
- **Fuentes**: BCRA Principales Variables API `api.bcra.gob.ar`, `estadisticasbcra.com` (no oficial).
- **Cross**: tasa real (TPM − inflación), base monetaria vs IPC con lag 6-12m, encajes vs créditos.

#### 5. Mercado de capitales ❌ (pendiente)
- **Indicadores**: Merval (pesos y CCL), ADRs (GGAL, YPF, PAM, BMA), bonos soberanos USD (AL30, GD30, GD35, GD41), bonos pesos (BONCER, duales, dollar-linked), riesgo país EMBI+, futuros Rofex/Matba.
- **Fuentes**: BYMA, Rava, Investing, BondTerminal, ArgenStats.
- **Cross**: Merval USD vs EMBI (correlación inversa ~−0.85), curva soberana hard-dollar, breakeven CER vs Lecaps.

#### 6. Mercado laboral ✅ (parcialmente cubierto)
- **Cubierto**: desocupación, tasa de empleo, RIPTE, salario real.
- **Faltante**: subocupación, informalidad, ingresos por decil, productividad, costo laboral unitario (CLU).
- **Cross**: salario real privado registrado vs informal (brecha), desocupación vs PBI (Okun argentina), informalidad vs pobreza.

#### 7. Pobreza y distribución ✅ (parcialmente cubierto)
- **Cubierto**: pobreza personas, línea de indigencia ($).
- **Faltante**: indigencia (PDF only), Gini, ratio decil 10/1, NBI, pobreza por aglomerado.
- **Cross**: pobreza vs salario real, Gini vs informalidad, pobreza infantil vs adulto mayor.

#### 8. Demografía ❌ (pendiente)
- **Indicadores**: población total + proyecciones, esperanza de vida, natalidad/mortalidad, migración neta, urbanización, estructura etaria, dependencia.
- **Fuentes**: INDEC Censo 2022, DEIS estadísticas vitales, UN Population Division.

#### 9. Producción sectorial ❌ (pendiente)
- **Indicadores**: IPI manufacturero por rama, ISAC construcción + cemento, IPI minero, producción agrícola (cosecha por cultivo BCBA/BCR/MAGyP), petróleo/gas (SESCO), electricidad CAMMESA, ventas supermercados/shoppings/mayoristas.
- **Fuentes**: INDEC, MAGyP datos.gob.ar, Secretaría de Energía, CAMMESA, BCR/BCBA.

#### 10. Servicios públicos y tarifas ❌ (pendiente)
- **Indicadores**: tarifa electricidad N1/N2/N3, gas, agua, transporte SUBE, subsidios económicos.
- **Fuentes**: ENRE, ENARGAS, Secretaría de Energía.

#### 11. Comercio interior y precios mayoristas ❌ (pendiente)
- **Indicadores**: IPIM mayorista, gap IPC-IPIM, ventas supermercados, shoppings, autos 0km (ACARA), motos.
- **Fuentes**: INDEC IPIM, ACARA, cámaras sectoriales.

#### 12. Comparativas internacionales ⚠️ (recién arrancado con LATAM monedas)
- **Cubierto**: monedas LATAM vs USD (BRL, CLP, UYU, PEN, COP, PYG, MXN) via BCRA.
- **Faltante**: PBI per cápita PPA, inflación, desempleo, pobreza, riesgo país, deuda/PBI, esperanza de vida, Gini comparables.
- **Fuente**: Banco Mundial WDI API `api.worldbank.org/v2/country/ARG;BRA;CHL;COL;MEX;PER;URY/indicator/...`, IMF Datamapper, CEPALSTAT.

#### 13. Cross-correlations 🎯 (sección estrella futura)
- Inflación m/m vs devaluación oficial m/m (pass-through con lag).
- Brecha cambiaria vs reservas netas BCRA.
- EMBI vs Merval USD vs reservas vs paridad bonos.
- Pobreza semestral vs salario real promedio del semestre.
- Recaudación real vs EMAE (elasticidad recaudación-actividad).
- Tasa real ex-ante vs depósitos a plazo (demanda de dinero).

### Top 15 features de producto (priorizadas por impacto)

1. **Página "Cross-Análisis"**: scatter interactivo de cualquier 2 series con correlación, timeline scrubber y eventos macro marcados. **EL diferenciador.**
2. **Calculadora de salario real personalizada**: usuario carga su sueldo histórico, ve poder de compra deflactado + vs RIPTE + vs CBT.
3. **Comparador por presidencia/gestión**: filtros prearmados (Macri, Alberto, Milei) sobre cualquier indicador con resumen automático.
4. **Mapa de Argentina por provincia**: choropleth con pobreza, empleo, PBG, exportaciones, deuda provincial.
5. **Modo "Historia económica" scrollytelling**: 1990–2026 con highlights (convertibilidad, 2001, K, default 2014, cepo, Milei).
6. **Dashboard "Día del mercado"**: vista live tipo Bloomberg — dólares, riesgo país, bonos, brecha, futuros, refresh cada 5 min.
7. **Calendario de publicaciones INDEC/BCRA**: cuándo sale IPC, EMAE, EPH, balanza, REM. Newsletter opcional pre-publicación.
8. **Brecha cambiaria desagregada completa** ✅ (PARCIAL — falta importador, exportador).
9. **Comparador LATAM**: AR vs BRA/CHI/MEX/URY en cualquier serie con World Bank API.
10. **Trackers de "promesas vs realidad"**: gobierno promete X de inflación/déficit, gráfico contra ejecutado.
11. **Curva de bonos soberanos interactiva**: paridad, TIR, duration de AL30/GD30/GD35/GD41 con histórico.
12. **Pirámide poblacional animada 1950–2050**: proyecciones + gasto previsional implícito.
13. **Pass-through calculator**: dame devaluación X → te muestro inflación esperada por categoría usando elasticidades históricas.
14. **API pública propia tipo FRED**: REST endpoint con series limpiadas + autodocumentado en `/api`.
15. **Alertas por email/Telegram**: suscripción a "IPC publicado", "Reservas < umbral", "Riesgo país > 1500".

### Roadmap por bloque (próximas sesiones)

| Bloque | Prioridad | Esfuerzo | Notas |
|---|---|---|---|
| Sector monetario (base, M1/M2, TPM, BADLAR, reservas) | 🔥 Alta | M | BCRA API ya conocida, ETL similar a monedas LATAM. |
| Mercado de capitales (Merval, ADRs, EMBI, bonos) | 🔥 Alta | L | Múltiples fuentes (BYMA, Yahoo, ambito.com). |
| Sector externo (balanza comercial, reservas brutas/netas) | 🔥 Alta | M | INDEC ICA + BCRA. |
| Sector fiscal (déficit, deuda, AFIP) | 🟡 Media | L | MECON + ARCA, varios endpoints. |
| Cross-Análisis (página de scatter interactivo) | 🔥 Alta | L | Producto core. Requiere infraestructura nueva. |
| Comparativa LATAM full (no solo monedas) | 🔥 Alta | M | Banco Mundial WDI API. |
| Mapa por provincia | 🟡 Media | L | TopoJSON + datos por provincia. |
| Modo historia (scrollytelling) | 🟢 Baja | L | Bonito para portfolio, no urgente. |
| Calendario de publicaciones | 🟢 Baja | S | Scraping del INDEC + tabla. |
| Calculadora pass-through | 🟢 Baja | M | Requiere modelo econométrico simple. |

---

## Referencias

- Repo: https://github.com/DiLoretoT/estadisticas-argentinas
- Deploy: https://estadisticas.datalogia.app (pendiente de Fase 0)
- Catálogo series datos.gob.ar: https://datosgobar.github.io/series-tiempo-ar-call-center/
- BCRA API: https://www.bcra.gob.ar/Catalogo/APIs.asp
- argentinadatos: https://argentinadatos.com/
