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
      priority: 1,
    },
    ...detalle.map((slug) => ({
      url: `${BASE_URL}/detalle/${slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
