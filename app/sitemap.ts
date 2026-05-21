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
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/argentina`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    ...detalle.map((slug) => ({
      url: `${BASE_URL}/argentina/detalle/${slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
