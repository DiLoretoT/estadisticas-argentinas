/**
 * Catálogo curado de comparativas significativas entre indicadores económicos.
 *
 * Cada entrada define UN PAR de series que vale la pena comparar, junto con:
 *  - El coeficiente de correlación **más apropiado** para ese caso.
 *  - Si la comparación debe considerar **lag** (X lidera a Y con un retraso).
 *  - Una **interpretación en lenguaje simple** para gente sin formación
 *    estadística, explicando qué significa el coeficiente en este contexto
 *    específico.
 *
 * El motor de comparativas pre-armadas calcula estos coeficientes en build
 * time / ISR cada vez que el ETL sube nuevos datos. Como los datos viejos
 * no cambian (solo se suman nuevos puntos), los resultados son estables y
 * solo se "deslizan" suavemente con cada actualización.
 */

import type { SeriesEntry } from "./seriesCatalog";

export type CoefType = "pearson" | "spearman" | "kendall";

export interface Comparativa {
  id: string;
  title: string;
  /** Eje X — variable explicativa o "leading indicator". */
  xId: string;
  /** Eje Y — variable explicada o "lagging indicator". */
  yId: string;
  /** Coeficiente recomendado para este par. */
  coef: CoefType;
  /** Por qué elegimos ese coef (explicación breve). */
  coefReason: string;
  /** Si esperamos que X lidere a Y con cierto lag (en meses). undefined = sin lag. */
  expectedLag?: number;
  /** Categoría para agrupar en la UI. */
  group: "monetario" | "fx" | "real" | "social" | "fiscal" | "mercado";
  /** Descripción en lenguaje simple — qué pregunta responde esta comparativa. */
  question: string;
  /** Cómo interpretar el resultado en términos prácticos. */
  interpretation: string;
}

/** "Plain language" descriptions de cada tipo de coeficiente, para mostrar en la UI. */
export const COEF_EXPLANATIONS: Record<
  CoefType,
  { name: string; short: string; detail: string }
> = {
  pearson: {
    name: "Coeficiente de Pearson",
    short: "Mide qué tan parecido a una línea recta es la relación entre las dos series.",
    detail:
      "Va de -1 a +1. Si dos cosas crecen juntas formando una línea recta (por ejemplo, sueldos y precios en el largo plazo), Pearson cerca de +1. Si una sube cuando la otra baja, cerca de -1. Si no tienen relación lineal clara, cerca de 0. Es el más conocido pero se confunde cuando hay valores extremos (crisis) o relaciones que no son una línea recta.",
  },
  spearman: {
    name: "Coeficiente de Spearman (rangos)",
    short:
      "Mide si una serie tiende a subir cuando la otra sube, sin importar la forma exacta de la relación.",
    detail:
      "También va de -1 a +1. No se fija en los valores absolutos sino en el orden. Detecta relaciones 'monótonas' aunque sean curvas, no líneas rectas. Es más robusto que Pearson cuando hay outliers (eventos extremos como 2001, COVID) o cuando los datos no son normales. Recomendado para la mayoría de las series macro argentinas.",
  },
  kendall: {
    name: "Tau de Kendall",
    short: "Cuenta cuántos pares de meses se mueven en la misma dirección.",
    detail:
      "Va de -1 a +1. Para cada par de meses observa: ¿la diferencia en X tiene el mismo signo que la diferencia en Y? Si la mayoría sí, Kendall positivo. Es muy conservador, ideal cuando hay pocos datos (series con pocos años de historia) o muchos valores empatados.",
  },
};

/**
 * Catálogo de comparativas significativas. Cada una elige el coeficiente
 * que mejor representa la relación REAL entre ambas variables.
 *
 * Criterios para elegir el coef:
 * - Series no lineales o con outliers (típico en economía AR): Spearman.
 * - Series que parecen "linealmente proporcionales": Pearson.
 * - Series cortas (<24 puntos) o muchas observaciones idénticas: Kendall.
 * - Si X tiene un efecto retrasado conocido sobre Y: expectedLag.
 */
export const COMPARATIVAS: Comparativa[] = [
  // ────────── FX y PRECIOS ──────────
  {
    id: "dolar-vs-inflacion",
    title: "Dólar oficial vs Inflación",
    xId: "dolar_oficial_mensual",
    yId: "ipc_mensual",
    coef: "spearman",
    coefReason:
      "El pass-through del dólar a precios no es lineal — depende del régimen cambiario. Spearman lo capta mejor que Pearson en cualquier régimen.",
    expectedLag: 2,
    group: "fx",
    question:
      "¿Cuánto y con cuánto retraso impacta la suba del dólar oficial en los precios al consumidor?",
    interpretation:
      "Si la correlación es alta y positiva (>0.5), la suba del dólar se traslada fuertemente a precios — el pass-through es alto. Si es baja, el ancla cambiaria está conteniendo precios. El lag esperado es de 1 a 3 meses.",
  },
  {
    id: "blue-vs-oficial",
    title: "Dólar blue vs Dólar oficial",
    xId: "dolar_oficial_mensual",
    yId: "dolar_blue_mensual",
    coef: "pearson",
    coefReason:
      "Cuando no hay cepo, ambas cotizaciones se mueven casi linealmente. La diferencia con Pearson permite ver si el blue es 'libre' o 'paralelo'.",
    group: "fx",
    question:
      "¿Se mueven juntos el oficial y el blue, o existe una brecha que se ensancha y achica?",
    interpretation:
      "Si Pearson cerca de +1, ambas cotizaciones se mueven a la par (no hay cepo o cepo blando). Si baja por debajo de 0.7, se está abriendo brecha — síntoma de fuerte intervención en el oficial.",
  },
  {
    id: "tpm-vs-inflacion",
    title: "Tasa de política monetaria vs Inflación",
    xId: "tpm",
    yId: "ipc_mensual",
    coef: "spearman",
    coefReason:
      "La relación entre tasa y precios tiene fuertes no-linealidades (tasas reales positivas vs negativas, ZLB). Spearman captura mejor el patrón general.",
    expectedLag: 3,
    group: "monetario",
    question:
      "¿La suba de tasas del BCRA frena la inflación? ¿Con cuánto retraso?",
    interpretation:
      "Spearman negativo y fuerte sugiere que subir la tasa contiene la inflación con 2-6 meses de retraso. Spearman positivo (poco frecuente) indicaría tasas que persiguen a la inflación sin contenerla. Cerca de 0 = la política monetaria no está siendo efectiva o el lag es muy largo.",
  },
  {
    id: "reservas-vs-riesgo-pais",
    title: "Reservas BCRA vs Riesgo país",
    xId: "reservas_bcra",
    yId: "riesgo_pais",
    coef: "spearman",
    coefReason:
      "La relación reservas-riesgo país es claramente no lineal: caídas fuertes generan spike de riesgo, pero subas moderadas no bajan proporcionalmente.",
    group: "fx",
    question:
      "¿Cuánto bajan los spreads soberanos cuando suben las reservas? ¿Es simétrico?",
    interpretation:
      "Spearman fuertemente negativo (-0.6 o más) = el mercado castiga rápido la caída de reservas. Si es cercano a 0, otros factores (política, default expectations) dominan al stock de reservas.",
  },
  {
    id: "tpm-vs-dolar",
    title: "Tasa de política vs Dólar oficial",
    xId: "tpm",
    yId: "dolar_oficial_mensual",
    coef: "spearman",
    coefReason:
      "El efecto de las tasas sobre el dólar no es lineal — depende del régimen cambiario y del cepo.",
    group: "monetario",
    question:
      "¿Suben las tasas para defender el peso? ¿O suben porque ya devaluó?",
    interpretation:
      "Spearman positivo fuerte sugiere que las tasas se mueven REACTIVAMENTE a la suba del dólar (suben las tasas DESPUÉS de devaluar). Si es negativo, hay margen para que la tasa contenga al tipo de cambio.",
  },

  // ────────── ACTIVIDAD ──────────
  {
    id: "emae-vs-empleo",
    title: "EMAE (actividad) vs Empleo registrado",
    xId: "emae_mensual",
    yId: "tasa_empleo",
    coef: "pearson",
    coefReason:
      "La relación actividad-empleo es bastante lineal en series largas y sin outliers extremos.",
    expectedLag: 3,
    group: "real",
    question:
      "Cuando la economía crece, ¿cuánto y con cuánto retraso se crea empleo?",
    interpretation:
      "Pearson alto positivo (>0.5) confirma que actividad y empleo se mueven juntos. El lag esperado es 2-4 meses: primero crece la producción, después se contrata. Si el coeficiente es bajo, hay rigidez del mercado laboral o el crecimiento no es 'rico en empleo'.",
  },
  {
    id: "pbi-vs-empleo",
    title: "PBI trimestral vs Empleo",
    xId: "pbi_trimestral",
    yId: "tasa_empleo",
    coef: "pearson",
    coefReason: "Ambas son medidas de actividad real, sin outliers fuertes excepto 2020.",
    group: "real",
    question: "¿El crecimiento económico se traduce en empleo formal?",
    interpretation:
      "Pearson alto = sí, hay 'elasticidad empleo-producto'. Es la relación clave para discusiones de política laboral.",
  },

  // ────────── INGRESOS ──────────
  {
    id: "ripte-vs-ipc",
    title: "RIPTE (salarios) vs IPC",
    xId: "ripte_mensual",
    yId: "ipc_mensual",
    coef: "spearman",
    coefReason:
      "La relación salario-precio tiene non-linearidades (paritarias, indexación discrecional, salario mínimo).",
    group: "real",
    question:
      "¿Los salarios siguen a la inflación? ¿Le ganan, le empatan o le pierden?",
    interpretation:
      "Spearman cerca de +1 = los salarios siguen a la inflación mes a mes (paritarias indexadas). Si es bajo o negativo, hay rezago salarial — el poder adquisitivo está cayendo.",
  },
  {
    id: "salario-real-vs-pobreza",
    title: "Salario real vs Tasa de pobreza",
    xId: "ripte_nivel",
    yId: "tasa_pobreza",
    coef: "kendall",
    coefReason:
      "La pobreza es semestral (pocos puntos). Kendall es más confiable que Pearson/Spearman con N chico.",
    expectedLag: 1,
    group: "social",
    question:
      "Cuando el salario real cae, ¿sube la pobreza? ¿Con cuánto retraso?",
    interpretation:
      "Kendall negativo y fuerte = sí, claramente. Cada caída sostenida del salario real anticipa un alza de pobreza en el semestre siguiente.",
  },

  // ────────── MERCADO ──────────
  {
    id: "merval-vs-riesgo-pais",
    title: "Merval vs Riesgo país",
    xId: "merval",
    yId: "riesgo_pais",
    coef: "spearman",
    coefReason:
      "La relación bolsa-riesgo país no es lineal: el spread soberano y las acciones no responden proporcional al mismo shock.",
    group: "mercado",
    question:
      "¿Suben las acciones cuando baja el riesgo país? ¿Con qué intensidad?",
    interpretation:
      "Esperamos correlación inversa (Spearman negativo). Cuanto más negativa, más 'sensible' es la bolsa al sentiment soberano.",
  },
  {
    id: "ggal-vs-ypf",
    title: "GGAL ADR vs YPF ADR",
    xId: "adr_ggal",
    yId: "adr_ypf",
    coef: "pearson",
    coefReason:
      "Dos ADRs argentinos cotizando en NY tienden a moverse linealmente por el riesgo país compartido.",
    group: "mercado",
    question: "¿Se mueven juntos los ADRs argentinos o hay divergencia sectorial?",
    interpretation:
      "Pearson cerca de +1 confirma que el factor 'Argentina' domina sobre los factores específicos del sector (financiero vs energético).",
  },

  // ────────── COMERCIO EXTERIOR ──────────
  {
    id: "exports-vs-balanza",
    title: "Exportaciones vs Balanza comercial",
    xId: "export_total",
    yId: "balanza_comercial",
    coef: "pearson",
    coefReason: "Componentes contables de una identidad, fuerte relación lineal.",
    group: "real",
    question: "¿Cuánto explican las exportaciones del resultado comercial?",
    interpretation:
      "Si Pearson alto, la balanza está dominada por las exportaciones (caso típico Argentina). Si es bajo, las importaciones son la palanca clave.",
  },
];

/** Devuelve las comparativas que involucran a una serie específica. */
export function comparativasFor(seriesId: string): Comparativa[] {
  return COMPARATIVAS.filter(
    (c) => c.xId === seriesId || c.yId === seriesId,
  );
}

/** Agrupa por categoría para la UI. */
export function groupComparativas(): Record<Comparativa["group"], Comparativa[]> {
  const out: Partial<Record<Comparativa["group"], Comparativa[]>> = {};
  for (const c of COMPARATIVAS) {
    if (!out[c.group]) out[c.group] = [];
    out[c.group]!.push(c);
  }
  return out as Record<Comparativa["group"], Comparativa[]>;
}

export const GROUP_LABELS: Record<Comparativa["group"], string> = {
  monetario: "Política monetaria",
  fx: "Tipo de cambio",
  real: "Economía real",
  social: "Social",
  fiscal: "Fiscal",
  mercado: "Mercado de capitales",
};

/** Helper para validar que cada xId/yId existe en el catálogo. Útil para tests. */
export function validateAgainstCatalog(catalog: SeriesEntry[]): string[] {
  const ids = new Set(catalog.map((s) => s.id));
  const errors: string[] = [];
  for (const c of COMPARATIVAS) {
    if (!ids.has(c.xId)) errors.push(`${c.id}: xId="${c.xId}" no existe en catalog`);
    if (!ids.has(c.yId)) errors.push(`${c.id}: yId="${c.yId}" no existe en catalog`);
  }
  return errors;
}
