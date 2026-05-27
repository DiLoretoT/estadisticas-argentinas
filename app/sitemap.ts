import type { MetadataRoute } from "next";
import { promises as fs } from "fs";
import path from "path";
import { listAllSlugs, type ProvinciasStatsFile } from "@/lib/provincias";

const BASE_URL = "https://estadisticas.datalogia.app";

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
  const detalle = [
    "inflacion",
    "dolar",
    "euro",
    "salarios",
    "actividad",
    "empleo",
    "pobreza",
  ];

  const provincias = await loadProvinciaSlugs();

  return [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/reporte`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    ...detalle.map((slug) => ({
      url: `${BASE_URL}/detalle/${slug}`,
      lastModified: now,
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
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/analisis`,
      lastModified: now,
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
