/**
 * Builders de structured data (JSON-LD, schema.org).
 *
 * Para un sitio de datos, el schema `Dataset` es lo más valioso: habilita la
 * indexación en Google Dataset Search. `WebSite` + `Organization` dan contexto
 * de marca; `BreadcrumbList` mejora la presentación en resultados.
 *
 * Todo el contenido es estático/controlado (no hay input de usuario), así que
 * es seguro serializarlo a JSON dentro de un <script> (ver components/JsonLd).
 */

const SITE_URL = "https://estadisticas.datalogia.app";

const PUBLISHER = {
  "@type": "Organization",
  name: "Datalogía",
  url: "https://datalogia.app",
} as const;

export function organizationSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Datalogía",
    url: "https://datalogia.app",
    logo: `${SITE_URL}/icon-512.png`,
  };
}

export function websiteSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Estadísticas Argentinas",
    alternateName: "Estadísticas Argentinas — Datalogía",
    url: SITE_URL,
    inLanguage: "es-AR",
    publisher: PUBLISHER,
  };
}

export interface BreadcrumbItem {
  name: string;
  /** Path relativo desde la raíz, ej. "/detalle/inflacion". */
  path: string;
}

export function breadcrumbSchema(
  items: BreadcrumbItem[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path}`,
    })),
  };
}

export interface DatasetInput {
  name: string;
  description: string;
  /** Path relativo de la página, ej. "/detalle/inflacion". */
  path: string;
  keywords: string[];
  /** Organización que produce el dato (INDEC, BCRA, etc.). */
  creatorName: string;
  /** IDs del catálogo de la API v1 que sirven como distribución descargable. */
  seriesIds?: string[];
  /** Cobertura temporal ISO (ej. "2016-05-01"). */
  temporalStart?: string;
  temporalEnd?: string;
}

export function datasetSchema(d: DatasetInput): Record<string, unknown> {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: d.name,
    description: d.description,
    url: `${SITE_URL}${d.path}`,
    inLanguage: "es-AR",
    isAccessibleForFree: true,
    keywords: d.keywords,
    creator: { "@type": "Organization", name: d.creatorName },
    publisher: PUBLISHER,
  };
  if (d.temporalStart && d.temporalEnd) {
    schema.temporalCoverage = `${d.temporalStart}/${d.temporalEnd}`;
  }
  if (d.seriesIds && d.seriesIds.length > 0) {
    schema.distribution = d.seriesIds.map((id) => ({
      "@type": "DataDownload",
      encodingFormat: "application/json",
      contentUrl: `${SITE_URL}/api/v1/series/${id}`,
    }));
  }
  return schema;
}
