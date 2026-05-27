# SEO — Estadísticas Argentinas

Plan de posicionamiento para `estadisticas.datalogia.app`: sitio público de
estadísticas económicas de Argentina, en español, Next.js 15 (App Router) en
Vercel, con data que se actualiza a diario vía ETL.

Última revisión: 2026-05-27.

---

## 1. Diagnóstico (estado al 2026-05-27)

### Ya estaba bien
- Metadata raíz sólida (`app/layout.tsx`): `metadataBase`, `title.template`,
  OG + Twitter `summary_large_image`, `robots: index/follow`, `locale es_AR`,
  `<html lang="es">`.
- `next/font` (Inter + JetBrains) con `display: swap` → buen CLS/LCP.
- Rutas estáticas/ISR prerenderizadas (rápidas, indexables server-side).
- Redirects 301 `/argentina → /` (el experimento multi-país no dejó URLs
  huérfanas).
- `robots.ts` permite todo y apunta al `sitemap.xml`.
- Señal de frescura fuerte: data diaria + `/reporte`.
- API v1 pública (`/api/v1/*`) → activo para earned links.

### Gaps detectados
| # | Gap | Severidad |
|---|---|---|
| 1 | Las 7 páginas `/detalle/*` (las de mayor intención de búsqueda) no tenían metadata propio: heredaban el título genérico del root. | 🔴 |
| 2 | Cero structured data (JSON-LD) en todo el sitio → sin elegibilidad para Google Dataset Search ni rich results. | 🔴 |
| 3 | Sin `canonical` en ninguna página → riesgo de contenido duplicado (query params en `/explorar`, trailing slashes). | 🟠 |
| 4 | Las 24 páginas `/provincia/[slug]` no estaban en el sitemap. | 🟠 |
| 5 | Sin verificación de Google Search Console ni medición de tráfico de búsqueda. | 🟠 |
| 6 | OG images genéricas (una global, no por ruta). | 🟡 |
| 7 | `lastModified` del sitemap usa `now()`, no la frescura real por serie. | 🟡 |
| 8 | Footer usa `<img>` crudo (impacto menor en LCP). | 🟡 |
| 9 | Poca profundidad de contenido en `/detalle/*` (sin párrafo intro indexable, sin FAQ). | 🟡 |

---

## 2. Plan priorizado

| Fase | Acción | Impacto | Estado |
|---|---|---|---|
| **P0** | Metadata único por `/detalle/*` (title/description/keywords/canonical) | 🔥🔥🔥 | ✅ hecho |
| **P0** | JSON-LD: `Dataset` por detalle + `WebSite`/`Organization` sitewide + `BreadcrumbList` | 🔥🔥🔥 | ✅ hecho |
| **P0** | `canonical` en home, detalle y provincia | 🔥🔥 | ✅ hecho |
| **P0** | 24 provincias al sitemap | 🔥 | ✅ hecho |
| **P0** | Hook de verificación de Search Console (env `GOOGLE_SITE_VERIFICATION`) | 🔥🔥🔥 | ✅ código listo · falta el token (acción del owner) |
| **P1** | Párrafo intro indexable por detalle | 🔥🔥 | ✅ hecho |
| **P1** | FAQ visible + `FAQPage` schema por detalle (3 Q&A c/u) | 🔥🔥 | ✅ hecho |
| **P1** | `temporalCoverage` real en el schema Dataset (rango de cada serie) | 🔥 | ✅ hecho |
| **P1** | H1 con keywords (enriquecer el título visible de detalle) | 🔥 | ✅ hecho |
| **P1** | OG dinámica por indicador (con último valor) | 🔥🔥 | pendiente |
| **P1** | `lastModified` real por serie en el sitemap | 🔥 | ✅ hecho |
| **P1** | Footer `<img>` → `next/image` | 🔥 | ✅ ya estaba (footer usa SVG inline `SiteMark`, sin `<img>`) |
| **P1** | `canonical` en el resto de las páginas (calculadora, calendario, comparativa, explorar, analisis, mapa, metodologia, status, reporte) | 🔥 | ✅ hecho |
| **P2** | Páginas long-tail mensuales ("inflación marzo 2026") — cuidado con thin content | 🔥🔥 | pendiente |
| **P2** | Estrategia de backlinks (charts embebibles + API + citaciones) | 🔥🔥🔥 | pendiente |
| **P2** | Bing Webmaster + IndexNow (indexación instantánea) | 🔥 | pendiente |
| **P2** | `SearchAction` (sitelinks search box) — requiere que `/explorar` soporte `?q=` | 🔥 | pendiente |
| **P2** | hreflang si vuelven los países | — | pendiente |

---

## 3. Qué se implementó en P0

Archivos nuevos:
- `lib/structuredData.ts` — builders de JSON-LD: `organizationSchema`,
  `websiteSchema`, `breadcrumbSchema`, `datasetSchema`. La `distribution` de
  cada Dataset apunta a la API v1 real (`/api/v1/series/{id}`), que es una
  descarga estable y accesible (clave para Dataset Search).
- `lib/detalleSeo.ts` — config SEO por indicador (title/description/keywords +
  Dataset + breadcrumb). Fuente única de verdad para los 7 detalles.
- `components/JsonLd.tsx` — renderiza bloques `application/ld+json`.

Cambios:
- `app/layout.tsx` — JSON-LD `Organization` + `WebSite` sitewide + hook de
  verificación de Search Console por env var.
- `components/DetailPage.tsx` — prop opcional `slug` que inyecta el JSON-LD
  `Dataset` + `BreadcrumbList`.
- `app/detalle/*/page.tsx` (×7) — `export const metadata` propio + `slug`.
- `app/page.tsx` — `canonical: "/"`.
- `app/provincia/[slug]/page.tsx` — title con keywords + `canonical` +
  `BreadcrumbList`.
- `app/sitemap.ts` — async, agrega las 24 provincias.

---

## 3b. Qué se implementó en P1

Contenido indexable y rich results (PR #19):
- `lib/detalleSeo.ts` — `intro` (párrafo indexable) y `faqs` (3 Q&A) por
  indicador; `temporalCoverage` real en el Dataset desde el rango de cada serie.
- `components/DetailPage.tsx` — render de la intro + FAQ visible + `FAQPage`.

H1, canonical y frescura (PR #20):
- `lib/detalleSeo.ts` + `components/DetailPage.tsx` — campo `h1` por indicador: el
  título visible lleva la keyword principal + "Argentina" (antes era "Inflación",
  "Dólar", etc.).
- `alternates.canonical` en las 9 páginas que faltaban (calculadora, calendario,
  comparativa, explorar, analisis, mapa, metodologia, status, reporte). El de
  `/explorar` colapsa las variantes con query params (cierra el gap #3).
- `app/sitemap.ts` — `lastModified` real: cada `/detalle/*` se fecha con el último
  dato de su serie (`readSeriesLocal`); home/reporte/explorar/analisis usan el dato
  más reciente del sitio en lugar de `now()`.
- Footer: ya usaba SVG inline (`SiteMark`), sin `<img>` — gap #8 no requirió acción.

Único P1 pendiente: **OG dinámica por indicador** (rutas `opengraph-image` con el
último valor de cada serie).

---

## 4. Acciones del owner (fuera del código)

1. **Google Search Console** (gratis): verificar la propiedad
   `estadisticas.datalogia.app`, copiar el token de verificación por meta tag,
   y setearlo como env var **`GOOGLE_SITE_VERIFICATION`** en Vercel
   (Production). Con eso el `<meta name="google-site-verification">` aparece
   solo. Después: enviar `https://estadisticas.datalogia.app/sitemap.xml` en
   Search Console.
2. **Cloudflare Web Analytics** (gratis, elegido): activarlo en el dashboard de
   Cloudflare para el dominio. El beacon se inyecta automáticamente vía el proxy
   (ya está permitido en el CSP de `next.config.ts`). No requiere código.
3. **Google Dataset Search**: una vez verificado en Search Console, los schemas
   `Dataset` se descubren solos al recrawlear. Opcional: registrar el sitio en
   datasetsearch.research.google.com.

---

## 5. Notas / decisiones

- **Keywords meta**: se incluyen en el schema Dataset (donde sí cuentan) aunque
  Google ignora el `<meta name="keywords">` desde hace años. No se invierte en
  keyword stuffing.
- **`SearchAction`** se omitió a propósito: declararlo sin que `/explorar`
  resuelva un `?q=` libre sería engañoso. Queda como P2 cuando exista esa
  búsqueda.
- **Analytics**: se eligió Cloudflare (gratis, privacy-first) sobre Vercel Web
  Analytics para evitar riesgo de costo más allá del free tier.
