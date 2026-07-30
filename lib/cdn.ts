/**
 * Helper compartido para fetch con CDN primary + GitHub raw fallback.
 *
 * Centraliza la política de timeout + fallback de `readData`, `events` y
 * `lastUpdated`. En desarrollo no se usa: cada módulo lee local directamente.
 */

const PRIMARY_BASE =
  "https://cdn.jsdelivr.net/gh/DiLoretoT/estadisticas-argentinas@main/data";
const FALLBACK_BASE =
  "https://raw.githubusercontent.com/DiLoretoT/estadisticas-argentinas/main/data";

const DEFAULT_TIMEOUT_MS = 4000;

/**
 * Archivos que cambian varias veces por día y leen de GitHub raw PRIMERO.
 * Mismo criterio (y mismo motivo) que `LIVE_FILES` en `readData.ts`: jsdelivr
 * cachea los URLs `@main` 12 h y purgar no alcanza, porque el purge limpia el
 * edge pero no la resolución de rama del origen.
 *
 * `status.json` se regenera en cada corrida del ETL y alimenta la página
 * /status, que declara `revalidate = 300`. Leerlo de un CDN que puede estar
 * 12 h atrasado vuelve ese revalidate de 5 min puramente decorativo.
 */
const LIVE_FILES = new Set(["status.json"]);

async function fetchWithTimeout(
  url: string,
  revalidate: number,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: controller.signal,
      next: { revalidate },
    });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fetchea un JSON desde el CDN principal con fallback automático a GitHub raw.
 * Devuelve null si ambos fallan; el caller maneja el default.
 */
export async function fetchDataJson<T>(
  relativePath: string,
  revalidate: number = 1800,
): Promise<T | null> {
  const bases = LIVE_FILES.has(relativePath)
    ? [FALLBACK_BASE, PRIMARY_BASE]
    : [PRIMARY_BASE, FALLBACK_BASE];

  for (const base of bases) {
    try {
      const res = await fetchWithTimeout(`${base}/${relativePath}`, revalidate);
      if (res.ok) {
        return (await res.json()) as T;
      }
      console.warn(
        `[cdn] ${base}/${relativePath} → ${res.status} ${res.statusText}`,
      );
    } catch (error) {
      console.warn(
        `[cdn] fetch ${base}/${relativePath} falló:`,
        (error as Error).message,
      );
    }
  }
  return null;
}
