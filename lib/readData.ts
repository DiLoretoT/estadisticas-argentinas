/**
 * Lectura de data del proyecto con CDN + fallback.
 *
 * Estrategia:
 *  - Dev (NODE_ENV=development): filesystem local (sin red).
 *  - Prod: fetch a jsdelivr CDN como PRIMARY, con timeout 4s y FALLBACK a
 *    raw.githubusercontent.com si falla. Eso protege contra caída/corrupción
 *    de jsdelivr.
 *
 * Cache:
 *  - Next.js cachea cada `fetch()` server-side y revalida según el `revalidate`
 *    declarado en cada page (30 min en general, 5 min en /status).
 *  - jsdelivr y GitHub raw cachean a nivel CDN.
 */

import { promises as fs } from "fs";
import path from "path";

const DEV = process.env.NODE_ENV === "development";

const PRIMARY_BASE =
  "https://cdn.jsdelivr.net/gh/DiLoretoT/estadisticas-argentinas@main/data";
const FALLBACK_BASE =
  "https://raw.githubusercontent.com/DiLoretoT/estadisticas-argentinas/main/data";

const FETCH_REVALIDATE_SECONDS = 30 * 60; // 30 min
const FETCH_TIMEOUT_MS = 4000; // bail-out a fallback si tarda más

/**
 * Archivos que cambian varias veces por día y leen de GitHub raw PRIMERO,
 * invirtiendo el orden normal.
 *
 * Motivo: jsdelivr cachea los URLs pinneados a rama (`@main`) con
 * `s-maxage=43200` — 12 horas — y purgar no alcanza. Medido: tras dos purges
 * (uno devolviendo `status: finished` con Cloudflare y Fastly confirmados) el
 * CDN siguió sirviendo una versión vieja más de 10 minutos, con `Age` bajo. O
 * sea que el edge sí refetchea, pero el origen de jsdelivr resuelve `@main` a
 * un commit anterior y el purge no lo toca.
 *
 * Para el log intradía eso rompía la feature entera: el front descarta el log
 * si no es del día, así que un archivo de ayer dejaba la tabla vacía.
 *
 * El costo de ir a raw es despreciable: son dos archivos chicos, y del lado del
 * servidor cada fetch queda cacheado 30 min. jsdelivr sigue de fallback por si
 * raw falla, y sigue siendo el primario para todo el resto (las series
 * históricas cambian una vez por día y ahí el CDN rinde).
 */
const LIVE_FILES = new Set(["dolar_intradia.json"]);

const dataDir = path.join(process.cwd(), "data");
const seriesDir = path.join(dataDir, "series");

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: controller.signal,
      next: { revalidate: FETCH_REVALIDATE_SECONDS },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJson<T>(relativeUrl: string, fallback: T): Promise<T> {
  if (DEV) {
    try {
      const content = await fs.readFile(
        path.join(dataDir, relativeUrl),
        "utf-8",
      );
      return JSON.parse(content) as T;
    } catch (error) {
      console.error(
        `[readData] (dev) local data/${relativeUrl}:`,
        error,
      );
      return fallback;
    }
  }

  // Producción: normalmente jsdelivr primero y GitHub raw como fallback, pero
  // al revés para los archivos intradía (ver LIVE_FILES).
  const bases = LIVE_FILES.has(relativeUrl)
    ? [FALLBACK_BASE, PRIMARY_BASE]
    : [PRIMARY_BASE, FALLBACK_BASE];

  for (const base of bases) {
    try {
      const res = await fetchWithTimeout(`${base}/${relativeUrl}`);
      if (res.ok) {
        return (await res.json()) as T;
      }
      console.warn(
        `[readData] ${base}/${relativeUrl} → ${res.status} ${res.statusText}`,
      );
    } catch (error) {
      console.warn(
        `[readData] fetch ${base}/${relativeUrl} falló (timeout o red):`,
        (error as Error).message,
      );
    }
  }

  console.error(
    `[readData] Tanto jsdelivr como GitHub raw fallaron para ${relativeUrl}`,
  );
  return fallback;
}

export async function readIndicator(
  fileName: string,
): Promise<Record<string, unknown>> {
  return fetchJson<Record<string, unknown>>(fileName, {});
}

export async function readSeries(
  fileName: string,
): Promise<[string, number][]> {
  return fetchJson<[string, number][]>(`series/${fileName}`, []);
}

// Para tests y casos donde necesitamos leer el filesystem aunque no sea dev.
export async function readIndicatorLocal(
  fileName: string,
): Promise<Record<string, unknown>> {
  try {
    const content = await fs.readFile(path.join(dataDir, fileName), "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error(`[readData] readIndicatorLocal ${fileName}:`, error);
    return {};
  }
}

export async function readSeriesLocal(
  fileName: string,
): Promise<[string, number][]> {
  try {
    const content = await fs.readFile(
      path.join(seriesDir, fileName),
      "utf-8",
    );
    return JSON.parse(content);
  } catch (error) {
    console.error(`[readData] readSeriesLocal ${fileName}:`, error);
    return [];
  }
}
