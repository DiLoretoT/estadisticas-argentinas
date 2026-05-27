/**
 * Config de SEO por página de detalle (`/detalle/<slug>`).
 *
 * Centraliza title/description/keywords + el schema Dataset y el breadcrumb de
 * cada indicador, para no repetir metadata en los 7 archivos de página.
 * Cada página hace `export const metadata = detalleMetadata(slug)` y pasa
 * `slug` a <DetailPage>, que inyecta el JSON-LD.
 */
import type { Metadata } from "next";
import { datasetSchema, breadcrumbSchema } from "./structuredData";

interface DetalleSeo {
  /** Va al <title> (el layout le agrega " · Estadísticas Argentinas"). */
  title: string;
  description: string;
  keywords: string[];
  datasetName: string;
  datasetDescription: string;
  creatorName: string;
  /** IDs de la API v1 que describen la distribución descargable del dataset. */
  seriesIds: string[];
  /** Última parte del breadcrumb. */
  breadcrumbLabel: string;
}

export const DETALLE_SEO: Record<string, DetalleSeo> = {
  inflacion: {
    title: "Inflación en Argentina (IPC mensual)",
    description:
      "Inflación mensual de Argentina (IPC, INDEC) desde 2016: variación porcentual, serie histórica, gráficos interactivos y datos descargables. Se actualiza con cada publicación oficial.",
    keywords: [
      "inflación Argentina",
      "IPC",
      "índice de precios al consumidor",
      "inflación mensual",
      "inflación argentina hoy",
      "INDEC",
    ],
    datasetName: "Inflación mensual de Argentina (IPC)",
    datasetDescription:
      "Serie histórica del Índice de Precios al Consumidor (IPC) de Argentina: variación porcentual mensual publicada por el INDEC desde mayo de 2016. Datos descargables vía API.",
    creatorName: "INDEC",
    seriesIds: ["ipc_mensual"],
    breadcrumbLabel: "Inflación",
  },
  dolar: {
    title: "Dólar hoy: oficial, blue, MEP y CCL",
    description:
      "Cotización del dólar en Argentina: oficial, mayorista, blue, MEP, contado con liqui (CCL), tarjeta y cripto. Brecha cambiaria y evolución histórica, actualizado a diario.",
    keywords: [
      "dólar Argentina",
      "dólar hoy",
      "dólar blue",
      "dólar oficial",
      "dólar MEP",
      "contado con liqui",
      "CCL",
      "brecha cambiaria",
    ],
    datasetName: "Cotizaciones del dólar en Argentina",
    datasetDescription:
      "Serie histórica de las cotizaciones del dólar en Argentina: oficial, mayorista, blue, MEP, contado con liqui (CCL), tarjeta y cripto, con cálculo de brecha cambiaria. Datos diarios y mensuales descargables vía API.",
    creatorName: "BCRA y fuentes de mercado",
    seriesIds: [
      "dolar_oficial_mensual",
      "dolar_blue_mensual",
      "dolar_mep_mensual",
      "dolar_ccl_mensual",
      "dolar_mayorista_mensual",
      "dolar_cripto_mensual",
      "dolar_tarjeta_mensual",
    ],
    breadcrumbLabel: "Dólar",
  },
  euro: {
    title: "Euro hoy en Argentina",
    description:
      "Cotización del euro en Argentina (BCRA) y su evolución histórica frente al peso. Series diaria y mensual con gráficos y datos descargables.",
    keywords: [
      "euro Argentina",
      "euro hoy",
      "cotización euro",
      "euro peso argentino",
      "BCRA",
    ],
    datasetName: "Cotización del euro en Argentina",
    datasetDescription:
      "Serie histórica del tipo de cambio de referencia del euro publicado por el BCRA, en frecuencias diaria y mensual. Datos descargables vía API.",
    creatorName: "BCRA",
    seriesIds: ["euro_mensual"],
    breadcrumbLabel: "Euro",
  },
  salarios: {
    title: "Salarios en Argentina: RIPTE y salario real",
    description:
      "Evolución de los salarios en Argentina: índice RIPTE y salario real deflactado por inflación (IPC). Serie histórica, variación mensual y gráficos descargables.",
    keywords: [
      "salarios Argentina",
      "RIPTE",
      "salario real",
      "poder adquisitivo",
      "salario promedio Argentina",
    ],
    datasetName: "Salarios en Argentina (RIPTE y salario real)",
    datasetDescription:
      "Serie histórica del salario en Argentina: RIPTE nominal y su variación mensual, más el salario real deflactado por el IPC para medir poder adquisitivo. Datos descargables vía API.",
    creatorName: "INDEC / SSPM",
    seriesIds: ["ripte_mensual", "ripte_nivel"],
    breadcrumbLabel: "Salarios",
  },
  actividad: {
    title: "Actividad económica en Argentina: EMAE y PBI",
    description:
      "Actividad económica de Argentina: EMAE mensual (índice base 2004=100) y PBI trimestral a precios constantes (INDEC). Serie histórica, variación y gráficos interactivos.",
    keywords: [
      "actividad económica Argentina",
      "EMAE",
      "PBI Argentina",
      "producto bruto interno",
      "crecimiento económico",
      "INDEC",
    ],
    datasetName: "Actividad económica de Argentina (EMAE y PBI)",
    datasetDescription:
      "Serie histórica de la actividad económica argentina: Estimador Mensual de Actividad Económica (EMAE) y Producto Bruto Interno (PBI) trimestral a precios constantes, publicados por el INDEC. Datos descargables vía API.",
    creatorName: "INDEC",
    seriesIds: ["emae_mensual", "pbi_trimestral"],
    breadcrumbLabel: "Actividad económica",
  },
  empleo: {
    title: "Desempleo en Argentina (tasa de desocupación)",
    description:
      "Tasa de desocupación y de empleo en Argentina (EPH-INDEC): serie histórica trimestral, gráficos interactivos y datos descargables.",
    keywords: [
      "desempleo Argentina",
      "tasa de desocupación",
      "tasa de empleo",
      "desocupación argentina",
      "EPH",
      "INDEC",
    ],
    datasetName: "Empleo y desempleo en Argentina",
    datasetDescription:
      "Serie histórica trimestral de la tasa de desocupación y la tasa de empleo en Argentina, según la Encuesta Permanente de Hogares (EPH) del INDEC. Datos descargables vía API.",
    creatorName: "INDEC",
    seriesIds: ["tasa_desocupacion", "tasa_empleo"],
    breadcrumbLabel: "Empleo",
  },
  pobreza: {
    title: "Pobreza e indigencia en Argentina",
    description:
      "Tasa de pobreza e indigencia en Argentina (INDEC) y valor de la línea de indigencia (Canasta Básica Alimentaria). Serie histórica semestral con gráficos.",
    keywords: [
      "pobreza Argentina",
      "indigencia",
      "tasa de pobreza",
      "línea de indigencia",
      "canasta básica",
      "INDEC",
    ],
    datasetName: "Pobreza e indigencia en Argentina",
    datasetDescription:
      "Serie histórica de la tasa de pobreza semestral y la línea de indigencia mensual (Canasta Básica Alimentaria) en Argentina, según el INDEC. Datos descargables vía API.",
    creatorName: "INDEC",
    seriesIds: ["tasa_pobreza", "linea_indigencia"],
    breadcrumbLabel: "Pobreza e indigencia",
  },
};

const SUFFIX = " · Estadísticas Argentinas";

export function detalleMetadata(slug: string): Metadata {
  const s = DETALLE_SEO[slug];
  if (!s) return {};
  const path = `/detalle/${slug}`;
  return {
    title: s.title,
    description: s.description,
    keywords: s.keywords,
    alternates: { canonical: path },
    openGraph: {
      title: `${s.title}${SUFFIX}`,
      description: s.description,
      url: path,
      type: "website",
    },
    twitter: {
      title: `${s.title}${SUFFIX}`,
      description: s.description,
    },
  };
}

export function detalleJsonLd(slug: string): Record<string, unknown>[] {
  const s = DETALLE_SEO[slug];
  if (!s) return [];
  const path = `/detalle/${slug}`;
  return [
    datasetSchema({
      name: s.datasetName,
      description: s.datasetDescription,
      path,
      keywords: s.keywords,
      creatorName: s.creatorName,
      seriesIds: s.seriesIds,
    }),
    breadcrumbSchema([
      { name: "Inicio", path: "/" },
      { name: s.breadcrumbLabel, path },
    ]),
  ];
}
