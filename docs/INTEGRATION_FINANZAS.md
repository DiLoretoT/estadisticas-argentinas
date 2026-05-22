# Integración estadísticas ↔ finanzas

Plan de integración entre `estadisticas.datalogia.app` (datos públicos) y
`finanzas.datalogia.app` (app de finanzas personales).

## Estado actual (problema)

Ambas apps tienen indicadores macroeconómicos:

| App | Cómo obtiene los indicadores |
|---|---|
| `estadisticas-argentinas` (este repo) | ETL Python en GitHub Actions → JSON en repo Git → CDN (jsdelivr) |
| `finanzas-tdl` | Tabla Supabase `indicador` + `indicador_observacion` (ingestión propia) |

Hay **duplicación**: misma data (IPC, dólar, EMAE, etc.) cargada dos veces, con
posible drift entre ambas fuentes.

## Solución propuesta — 3 etapas

### Etapa 1 ✅ — API v1 production-ready en estadísticas

**Estado**: hecho en este commit.

Endpoints públicos en `estadisticas.datalogia.app/api/v1/*`:
- `GET /catalog` — descubrimiento.
- `GET /series/{id}` — serie temporal con filtros from/to/limit.
- `GET /snapshot` — últimos valores de 11 indicadores principales.
- `GET /health` — monitoreo.
- `GET /openapi.json` — spec OpenAPI 3.1.

Características:
- CORS abierto (solo GET).
- Cache 10 min — 1 hora según endpoint.
- Whitelist de IDs vía `SERIES_CATALOG`.
- Sin auth, sin rate limit explícito (Cloudflare DDoS + Vercel Spend Limit
  protegen). Si se vuelve necesario en el futuro, agregar Upstash KV.

### Etapa 2 — ETL en finanzas que consume la API de estadísticas

**Estado**: pendiente, se hace en el repo `finanzas-tdl` en sesión aparte.

Reemplazar las ingestas propias de finanzas por un único job que sincroniza
de la API de estadísticas a Supabase.

#### Diseño técnico

**Tabla actual en finanzas**: `indicador_observacion (indicador_id, fecha, valor)`.

**Nuevo ETL en finanzas** (`supabase/functions/sync-estadisticas/index.ts` o similar):

```typescript
// Pseudocódigo
const catalog = await fetch("https://estadisticas.datalogia.app/api/v1/catalog").then(r => r.json());

// Mapeo de IDs estadisticas → IDs finanzas (algunos cambian de naming)
const ID_MAP: Record<string, string> = {
  "ipc_mensual": "ipc_general",
  "dolar_oficial_mensual": "dolar_oficial_men",
  "dolar_blue_mensual": "dolar_blue_men",
  // ...
};

for (const series of catalog.series) {
  const finanzasId = ID_MAP[series.id] || series.id;
  // ¿Está en finanzas? Si no, skip.
  const meta = await supabase.from("indicador").select("id").eq("id", finanzasId).single();
  if (!meta.data) continue;

  // Fetch serie completa
  const seriesRes = await fetch(`https://estadisticas.datalogia.app/api/v1/series/${series.id}`).then(r => r.json());

  // Upsert observaciones
  await supabase.from("indicador_observacion").upsert(
    seriesRes.data.map(([fecha, valor]) => ({
      indicador_id: finanzasId,
      fecha,
      valor,
    })),
    { onConflict: "indicador_id,fecha" }
  );
}
```

**Schedule**: cron 2× por día (06:00 y 20:00 AR), después de que estadísticas
haya corrido su ETL.

**Borrar de finanzas**:
- Cualquier fetcher propio de BCRA/INDEC.
- Tabla `indicador_fuente` si existe (la fuente ahora es siempre la API).

#### Pros
- Single source of truth (estadísticas).
- Finanzas no necesita mantener fetchers ni manejar formatos de upstream.
- Si estadísticas suma nuevos indicadores (deuda, mercado, etc.), finanzas
  los hereda con cero código adicional (solo agregarlos a `indicador`
  de finanzas).
- Catálogo más amplio en finanzas — hoy tiene 11 indicadores, estadísticas
  expone 40+.

#### Costo
- 0 USD adicional. Las llamadas a la API de estadísticas son gratis para
  finanzas (mismo proveedor).
- Cloudflare proxy de estadísticas absorbe el tráfico de finanzas.

### Etapa 3 — UI cross-app + conversión

**Estado**: pendiente, en el repo de finanzas.

Una vez que la sincronización funciona, agregar en finanzas:

#### A) Banner en home de finanzas

```
┌────────────────────────────────────────────────────┐
│ 📊 Indicadores del día                             │
│                                                    │
│  Dólar blue $1.250  ·  Inflación 2.6% m/m  ·       │
│  Reservas USD 46 mil M  ·  Riesgo país 524 pb      │
│                                                    │
│  Ver todos en estadisticas.datalogia.app →         │
└────────────────────────────────────────────────────┘
```

Consume `/api/v1/snapshot` → renderea 4-6 KPIs + CTA hacia estadísticas.

#### B) "Tu inflación personal vs IPC"

En `/estadisticas` de finanzas (que ya existe), comparar:
- Inflación mensual del user (gasto m/m).
- IPC INDEC mensual.
- "Tu inflación de marzo: 5.2% vs IPC oficial: 4.1%. Estás 1.1 pp arriba del
  promedio (probablemente por gastos en transporte o alimentos)."

#### C) "Tu sueldo en dólar blue/MEP"

En `/sueldo` de finanzas, mostrar el sueldo del user convertido a USD blue/MEP:
- "Ganaste $850.000 en abril = USD 650 al MEP."
- Histórico: cómo varió el sueldo en USD en los últimos 12 meses.

#### D) "Sueldo deflactado por inflación"

Convertir sueldos históricos del user a pesos constantes (base mes actual).
"Tu sueldo de hace 2 años, ajustado por inflación, equivale a $750.000 hoy."

#### E) CTAs cross-app

En **estadisticas-argentinas** (este repo), agregar CTAs a finanzas en:
- Footer: "¿Querés ver cómo te afecta esto a vos? Probá Datalogía Finanzas."
- Página `/calculadora`: "Trackeá toda tu plata en Datalogía Finanzas →"
- Página `/analisis`: "Compará TUS gastos contra estos indicadores en
  Datalogía Finanzas →"

## Marketing / conversión

Esta integración apunta a 3 objetivos:

1. **Drive traffic estadísticas → finanzas**: gente que llega buscando dólar
   blue ve que puede trackear sus gastos contra esa data. Conversión a
   freemium/paid de finanzas.

2. **Aumentar valor de finanzas**: usuarios actuales de finanzas tienen
   contexto macro siempre disponible, mejor product-market fit.

3. **Posicionar Datalogía como ecosistema**: dos productos distintos pero
   integrados refuerzan la marca.

## Cuándo no hacer esto

- Si finanzas necesita data **distinta** (ej. tipo de cambio del día minuto
  a minuto), la API actual no sirve (es daily/monthly). Pero ese caso no
  está en el roadmap actual.
- Si en el futuro estadísticas requiere auth (poco probable), romperíamos
  el flujo público gratis.
