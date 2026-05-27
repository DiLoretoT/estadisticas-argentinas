import type { MetadataRoute } from "next";
import { promises as fs } from "fs";
import path from "path";
import { listAllSlugs, type ProvinciasStatsFile } from "@/lib/provincias";
import { readSeriesLocal } from "@/lib/readData";

const BASE_URL = "https://estadisticas.datalogia.app";

const DETALLE_ORDER = [
  "inflacion",
  "dolar",
  "euro",
  "salarios",
  "actividad",
  "empleo",
  "pobreza",
] as const;

/**
 * Serie(s) que fechan cada `/detalle/*`: el `lastModified` es el último dato
 * real de la serie, no el momento del build. Cuando hay varias, se toma la más
 * reciente (ej. pobreza usa la línea de indigencia mensual, más fresca que la
 * tasa semestral).
 */
const DETALLE_SERIES: Record<string, string[]> = {
  inflacion: ["inflacion_mensual.json"],
  dolar: ["dolar_oficial_diario.json", "dolar_blue_diario.json"],
  euro: ["euro_diario.json"],
  salarios: ["ripte_mensual.json"],
  actividad: ["emae_mensual.json", "pbi_trimestral.json"],
  empleo: ["tasa_desocupacion.json", "tasa_empleo.json"],
  pobreza: ["tasa_pobreza.json", "linea_indigencia.json"],
};

/** Fecha del dato más reciente entre varias series locales (data/series/*). */
async function lastDateOf(files: string[]): Promise<Date | undefined> {
  let max: string | undefined;
  for (const file of files) {
    const series = await readSeriesLocal(file);
    const last = series[series.length - 1]?.[0];
    if (last && (!max || last > max)) max = last;
  }
  return max ? new Date(max) : undefined;
}

/** Slugs de las 24 jurisdicciones, desde el mismo dataset que usa /provincia. */
async function loadProvinciaSlugs(): Promise<string[]> {
  try {
    const filePath = path.join(process.cwd(), "data", "provincias_stats.json");
    const content = await fs.readFile(filePath, "utf-8");
    const stats = JSON.parse(content) as ProvinciasStatsFile;
    return listAllSlugs(stats).map((p) => p.slug);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [provincias, detalleDates] = await Promise.all([
    loadProvinciaSlugs(),
    Promise.all(
      DETALLE_ORDER.map(
        async (slug) =>
          [slug, (await lastDateOf(DETALLE_SERIES[slug])) ?? now] as const,
      ),
    ),
  ]);

  // Frescura de los datos diarios del sitio: el dato más reciente de cualquier
  // serie. Sirve para fechar las páginas agregadas (home, reporte, explorar...).
  const freshest = detalleDates.reduce(
    (max, [, d]) => (d > max ? d : max),
    new Date(0),
  );
  const daily = freshest.getTime() > 0 ? freshest : now;

  return [
    {
      url: BASE_URL,
      lastModified: daily,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/reporte`,
      lastModified: daily,
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    ...detalleDates.map(([slug, lastModified]) => ({
      url: `${BASE_URL}/detalle/${slug}`,
      lastModified,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    {
      url: `${BASE_URL}/comparativa`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/explorar`,
      lastModified: daily,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/analisis`,
      lastModified: daily,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/mapa`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    ...provincias.map((slug) => ({
      url: `${BASE_URL}/provincia/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    {
      url: `${BASE_URL}/calendario`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/calculadora`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/metodologia`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/status`,
      lastModified: now,
      changeFrequency: "hourly" as const,
      priority: 0.3,
    },
  ];
}
