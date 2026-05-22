# API Pública

API REST para consumir datos macroeconómicos argentinos. Public, read-only, sin auth, sin rate limit explícito.

**Base URL**: `https://estadisticas.datalogia.app/api/v1`
**Spec OpenAPI**: `https://estadisticas.datalogia.app/api/v1/openapi.json`
**Versionado**: en path (`/v1/`). Si rompemos compat, sale `/v2/`.

## Endpoints

### `GET /catalog`
Catálogo completo de series disponibles (40+ indicadores).

```bash
curl https://estadisticas.datalogia.app/api/v1/catalog
```

Response (resumen):
```json
{
  "version": "1",
  "updated_at": "2026-05-22T...",
  "categories": { "precios": "Precios", "dolar": "Dólar / FX local", ... },
  "series": [
    { "id": "ipc_mensual", "label": "Inflación mensual (IPC %)", "category": "precios", "unit": "percent_decimal" },
    ...
  ],
  "count": 40
}
```

### `GET /series/{id}`
Una serie temporal específica.

```bash
curl https://estadisticas.datalogia.app/api/v1/series/ipc_mensual
curl https://estadisticas.datalogia.app/api/v1/series/dolar_oficial_mensual?from=2024-01-01&limit=12
```

Query params:
- `from` (opcional): `YYYY-MM-DD`, filtra desde.
- `to` (opcional): `YYYY-MM-DD`, filtra hasta.
- `limit` (opcional): últimos N puntos (1-9999).

Response:
```json
{
  "id": "ipc_mensual",
  "label": "Inflación mensual (IPC %)",
  "category": "precios",
  "unit": "percent_decimal",
  "count": 24,
  "data": [
    ["2024-01-01", 0.206],
    ["2024-02-01", 0.131],
    ...
  ]
}
```

404 si el `id` no está en `/catalog`.

### `GET /snapshot`
"Foto del día" — últimos valores de los 11 indicadores más relevantes. Pensado para widgets.

```bash
curl https://estadisticas.datalogia.app/api/v1/snapshot
```

Response:
```json
{
  "version": "1",
  "updated_at": "...",
  "indicators": {
    "dolar_oficial": {
      "id": "dolar_oficial",
      "label": "Dólar oficial",
      "unit": "peso_ars",
      "value": 1450.5,
      "period": "2026-05-21",
      "monthly_change": 2.1,
      "yoy_change": 18.5,
      "source": "BCRA"
    },
    "ipc": { ... },
    "riesgo_pais": { ... },
    ...
  }
}
```

### `GET /health`
Healthcheck para monitoreo (sin cache).

```bash
curl https://estadisticas.datalogia.app/api/v1/health
# {"status":"ok","version":"1","timestamp":"..."}
```

## CORS

Todos los endpoints aceptan CORS de cualquier origen (`Access-Control-Allow-Origin: *`).
Solo método `GET` y `OPTIONS` permitidos. No hay credenciales (cookies/auth).

## Cache

- `/snapshot`: 10 min.
- `/catalog`, `/openapi.json`: 1 hora.
- `/series/{id}`: 30 min.
- `/health`: 0 (no-store).

## Política de cambios

- **Nuevos endpoints**: agregados en `/v1` sin breaking.
- **Nuevos campos en response**: agregados sin breaking.
- **Borrar/renombrar campos**: requiere `/v2`.
- **Borrar series del catalog**: deprecation header de 90 días antes.

## Versionado

| Versión | Estado | URL |
|---|---|---|
| **v1** | **Estable** ✅ | `/api/v1/*` |
| Legacy | Deprecated | `/api/indicadores`, `/api/series?name=...` (mantenida indefinida) |

## Ejemplos de uso (TypeScript)

### Fetch snapshot del día
```typescript
const res = await fetch("https://estadisticas.datalogia.app/api/v1/snapshot");
const { indicators } = await res.json();
console.log(`Dólar blue: $${indicators.dolar_blue.value}`);
console.log(`Inflación última: ${(indicators.ipc_mensual.value * 100).toFixed(1)}%`);
```

### Fetch serie histórica para chart
```typescript
const res = await fetch(
  "https://estadisticas.datalogia.app/api/v1/series/dolar_oficial_mensual?from=2020-01-01"
);
const { data } = await res.json(); // [["2020-01-01", 60], ["2020-02-01", 62], ...]
```

### Fetch catálogo y filtrar por categoría
```typescript
const res = await fetch("https://estadisticas.datalogia.app/api/v1/catalog");
const { series } = await res.json();
const monetarias = series.filter((s: { category: string }) => s.category === "monetario");
```

## Integración con Datalogía Finanzas

`finanzas.datalogia.app` consume esta API para mantener su sección `/economia` y `/estadisticas` sincronizada sin duplicar ETL.

Ver `docs/INTEGRATION_FINANZAS.md` para detalle del flujo.
