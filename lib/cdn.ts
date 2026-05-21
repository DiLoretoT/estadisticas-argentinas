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
  for (const base of [PRIMARY_BASE, FALLBACK_BASE]) {
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
