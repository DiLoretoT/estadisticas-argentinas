import type { MetadataRoute } from "next";

/**
 * Web App Manifest (PWA). Next genera /manifest.webmanifest y agrega el
 * <link rel="manifest"> automáticamente.
 *
 * Iconos: marca Datalogía (3 barras + peak dot).
 *  - "any"      → public/branding/icon-{192,512}.png (square redondeado)
 *  - "maskable" → public/branding/icon-maskable-{192,512}.png (full-bleed,
 *    generados con scripts/generate-pwa-icons.mjs para que Android no recorte).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Estadísticas Argentinas — Datalogía",
    short_name: "Estadísticas AR",
    description:
      "Indicadores macroeconómicos y sociales de Argentina con datos oficiales de INDEC, BCRA y MECON. Dólar en vivo, inflación, actividad, empleo y más.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    lang: "es-AR",
    dir: "ltr",
    categories: ["finance", "news", "education"],
    theme_color: "#c2683f",
    background_color: "#faf9f7",
    icons: [
      {
        src: "/branding/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/branding/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/branding/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/branding/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
