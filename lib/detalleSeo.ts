/**
 * Config de SEO por página de detalle (`/detalle/<slug>`).
 *
 * Centraliza title/description/keywords + intro indexable + FAQ + el schema
 * Dataset y el breadcrumb de cada indicador, para no repetir nada en los 7
 * archivos de página. Cada página hace `export const metadata =
 * detalleMetadata(slug)` y pasa `slug` (+ `datasetRange`) a <DetailPage>, que
 * inyecta el JSON-LD y renderiza la intro y la FAQ.
 */
import type { Metadata } from "next";
import {
  datasetSchema,
  breadcrumbSchema,
  faqSchema,
  type FaqItem,
} from "./structuredData";

interface DetalleSeo {
  /** Va al <title> (el layout le agrega " · Estadísticas Argentinas"). */
  title: string;
  description: string;
  keywords: string[];
  /** Párrafo introductorio visible e indexable, con keywords naturales. */
  intro: string;
  /** Preguntas frecuentes: visibles en la página + FAQPage schema. */
  faqs: FaqItem[];
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
    intro:
      "La inflación en Argentina mide la suba generalizada de precios a través del Índice de Precios al Consumidor (IPC) que publica el INDEC todos los meses. En esta página seguís la variación mensual, su evolución histórica desde 2016 y los eventos macroeconómicos que la marcaron.",
    faqs: [
      {
        q: "¿Cuál es la inflación de Argentina este mes?",
        a: "El último dato disponible es la variación mensual del IPC que publica el INDEC; lo ves actualizado en el gráfico y la tabla de esta página apenas se difunde el dato oficial.",
      },
      {
        q: "¿Qué es el IPC?",
        a: "El Índice de Precios al Consumidor (IPC) mide la evolución del precio de una canasta representativa de bienes y servicios que consumen los hogares. Su variación mensual es la inflación.",
      },
      {
        q: "¿Cada cuánto se publica la inflación en Argentina?",
        a: "El INDEC publica el IPC una vez por mes, en general alrededor de la segunda semana, con el dato del mes anterior. El calendario completo está en la sección Calendario.",
      },
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
    intro:
      "El dólar en Argentina cotiza en varios mercados a la vez: el oficial y mayorista del BCRA, el MEP y el contado con liqui (CCL) del mercado de capitales, el blue (paralelo), el tarjeta y el cripto. Acá seguís las siete cotizaciones y la brecha cambiaria entre cada una y el oficial, actualizadas a diario.",
    faqs: [
      {
        q: "¿A cuánto está el dólar blue hoy?",
        a: "El valor más reciente del dólar blue lo ves en el gráfico diario de esta página, que se actualiza varias veces por día junto con el resto de las cotizaciones.",
      },
      {
        q: "¿Qué es la brecha cambiaria?",
        a: "Es la diferencia porcentual entre un tipo de dólar (blue, MEP, CCL) y el oficial. Una brecha alta suele reflejar controles cambiarios estrictos o desconfianza en el peso.",
      },
      {
        q: "¿Qué diferencia hay entre el dólar MEP y el CCL?",
        a: "Ambos se operan con bonos en el mercado de capitales. El MEP (o bolsa) deja los dólares en una cuenta local; el contado con liqui (CCL) los transfiere a una cuenta en el exterior.",
      },
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
    intro:
      "El euro en Argentina se cotiza tomando como referencia el tipo de cambio que publica el BCRA. En esta página seguís su evolución diaria y mensual frente al peso argentino.",
    faqs: [
      {
        q: "¿A cuánto está el euro hoy en Argentina?",
        a: "El valor más reciente del euro de referencia del BCRA lo ves en el gráfico diario de esta página.",
      },
      {
        q: "¿Por qué el euro vale más que el dólar en Argentina?",
        a: "Porque en los mercados internacionales el euro suele cotizar por encima del dólar estadounidense, y el tipo de cambio local replica esa relación más los costos e impuestos que correspondan.",
      },
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
    intro:
      "Los salarios en Argentina se siguen con el RIPTE, la remuneración promedio de los trabajadores registrados estables. Acá lo ves en términos nominales y, sobre todo, en términos reales: deflactado por la inflación para mostrar la evolución del poder adquisitivo.",
    faqs: [
      {
        q: "¿Qué es el RIPTE?",
        a: "Es la Remuneración Imponible Promedio de los Trabajadores Estables: el salario promedio sujeto a aportes de los trabajadores registrados en relación de dependencia.",
      },
      {
        q: "¿Qué es el salario real?",
        a: "Es el salario nominal ajustado por inflación. Mide cuántos bienes y servicios se pueden comprar con ese sueldo: si la inflación sube más rápido que el salario nominal, el salario real cae.",
      },
      {
        q: "¿Están subiendo o bajando los salarios reales en Argentina?",
        a: "Lo ves en el gráfico de salario real de esta página: si la línea baja, los aumentos nominales fueron menores que la inflación.",
      },
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
    intro:
      "La actividad económica de Argentina se mide con dos indicadores del INDEC: el EMAE, que estima el nivel de actividad mes a mes, y el PBI, que mide la producción total de bienes y servicios cada trimestre. Acá seguís ambos con su serie histórica.",
    faqs: [
      {
        q: "¿Qué es el EMAE?",
        a: "El Estimador Mensual de Actividad Económica (EMAE) es un indicador del INDEC que anticipa la evolución del PBI con frecuencia mensual, usando una base 2004=100.",
      },
      {
        q: "¿Está creciendo la economía argentina?",
        a: "Lo ves en la variación del EMAE y del PBI en los gráficos de esta página: si el índice sube respecto del período previo, la actividad está creciendo.",
      },
      {
        q: "¿Cada cuánto se publica el PBI?",
        a: "El INDEC publica el PBI de forma trimestral; el EMAE se publica una vez por mes.",
      },
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
    intro:
      "El empleo en Argentina se mide a través de la Encuesta Permanente de Hogares (EPH) del INDEC, que publica cada trimestre la tasa de desocupación y la tasa de empleo. Acá seguís su evolución histórica.",
    faqs: [
      {
        q: "¿Cuál es la tasa de desempleo en Argentina?",
        a: "El último dato trimestral de la tasa de desocupación que publica el INDEC lo ves en el gráfico y la tabla de esta página.",
      },
      {
        q: "¿Qué diferencia hay entre tasa de empleo y de desocupación?",
        a: "La tasa de empleo es el porcentaje de la población total que está ocupada. La de desocupación es el porcentaje de la población económicamente activa que busca trabajo y no lo consigue.",
      },
      {
        q: "¿Cada cuánto se mide el desempleo?",
        a: "El INDEC publica las tasas de empleo y desocupación una vez por trimestre, en base a la EPH.",
      },
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
    intro:
      "La pobreza en Argentina se mide comparando los ingresos de los hogares con el valor de la Canasta Básica Total (pobreza) y la Canasta Básica Alimentaria (indigencia), según releva el INDEC en la EPH. Acá seguís la tasa de pobreza y la línea de indigencia.",
    faqs: [
      {
        q: "¿Cuál es la tasa de pobreza en Argentina?",
        a: "El último dato semestral de la tasa de pobreza que publica el INDEC lo ves en el gráfico y la tabla de esta página.",
      },
      {
        q: "¿Qué es la línea de indigencia?",
        a: "Es el ingreso mensual mínimo que necesita un adulto para cubrir la Canasta Básica Alimentaria. Por debajo de ese umbral, el hogar se considera indigente.",
      },
      {
        q: "¿Cada cuánto se publican los datos de pobreza?",
        a: "El INDEC publica la tasa de pobreza dos veces por año (semestral); la línea de indigencia se actualiza mensualmente.",
      },
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

export interface DatasetRange {
  start: string;
  end: string;
}

/** Rango temporal (primer y último punto) de una serie, para temporalCoverage. */
export function rangeOf(series: [string, number][]): DatasetRange | undefined {
  if (!series || series.length === 0) return undefined;
  return { start: series[0][0], end: series[series.length - 1][0] };
}

export function detalleJsonLd(
  slug: string,
  range?: DatasetRange,
): Record<string, unknown>[] {
  const s = DETALLE_SEO[slug];
  if (!s) return [];
  const path = `/detalle/${slug}`;
  const out: Record<string, unknown>[] = [
    datasetSchema({
      name: s.datasetName,
      description: s.datasetDescription,
      path,
      keywords: s.keywords,
      creatorName: s.creatorName,
      seriesIds: s.seriesIds,
      temporalStart: range?.start,
      temporalEnd: range?.end,
    }),
    breadcrumbSchema([
      { name: "Inicio", path: "/" },
      { name: s.breadcrumbLabel, path },
    ]),
  ];
  if (s.faqs.length > 0) out.push(faqSchema(s.faqs));
  return out;
}
