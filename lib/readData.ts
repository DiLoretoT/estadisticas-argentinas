/**
 * Lectura de data del proyecto.
 *
 * Estrategia híbrida:
 *  - En desarrollo (NODE_ENV=development) leemos del filesystem local
 *    (más rápido y no depende de red).
 *  - En producción leemos vía CDN jsdelivr que sirve archivos directamente
 *    del repo en GitHub. Eso permite que los commits del ETL se reflejen
 *    en el sitio en producción SIN re-deploy de Vercel.
 *
 * Cache:
 *  - En servidor (Server Components), Next.js cachea el `fetch()` y lo
 *    revalida según `revalidate` declarado en cada page.tsx.
 *  - jsdelivr a su vez cachea agresivamente en su CDN global.
 */

import { promises as fs } from "fs";
import path from "path";

const DEV = process.env.NODE_ENV === "development";

// jsdelivr permite congelar a un ref. `@main` siempre apunta al último commit
// del branch main, que es el que el ETL actualiza vía GitHub Actions.
const CDN_BASE =
  "https://cdn.jsdelivr.net/gh/DiLoretoT/estadisticas-argentinas@main/data";

// Revalidación de fetch en server-side (en segundos). 30 minutos.
// La revalidación efectiva en el sitio depende del `revalidate` que declare
// cada page, pero esto pone un límite superior aunque la página sea estática.
const FETCH_REVALIDATE_SECONDS = 30 * 60;

const dataDir = path.join(process.cwd(), "data");
const seriesDir = path.join(dataDir, "series");

async function fetchJson<T>(relativeUrl: string, fallback: T): Promise<T> {
  if (DEV) {
    try {
      const localPath = path.join(dataDir, relativeUrl);
      const content = await fs.readFile(localPath, "utf-8");
      return JSON.parse(content) as T;
    } catch (error) {
      console.error(
        `[readData] (dev) No pude leer local data/${relativeUrl}:`,
        error,
      );
      return fallback;
    }
  }

  try {
    const res = await fetch(`${CDN_BASE}/${relativeUrl}`, {
      next: { revalidate: FETCH_REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      console.error(
        `[readData] jsdelivr ${relativeUrl} → ${res.status} ${res.statusText}`,
      );
      return fallback;
    }
    return (await res.json()) as T;
  } catch (error) {
    console.error(`[readData] fetch ${relativeUrl} falló:`, error);
    return fallback;
  }
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
