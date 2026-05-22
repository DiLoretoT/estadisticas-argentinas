import type { MetadataRoute } from "next";

const BASE_URL = "https://estadisticas.datalogia.app";

export default function sitemap(): MetadataRoute.Sitemap {
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

  return [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
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
      url: `${BASE_URL}/analisis`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
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
