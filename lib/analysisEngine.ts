/**
 * Motor de análisis estadístico determinístico.
 *
 * Dada una serie temporal [(fecha, valor), ...] + metadata del indicador,
 * genera texto natural en español con templates basados en cálculos
 * estadísticos puros. CERO uso de IA, costo $0.
 *
 * Se regenera automáticamente con cada render del sitio (los datos vienen
 * del ETL via ISR), entonces siempre refleja el último dato disponible.
 */

export type Trend = "creciente_fuerte" | "creciente" | "estable" | "decreciente" | "decreciente_fuerte";
export type Volatility = "muy_estable" | "estable" | "moderada" | "volatil" | "muy_volatil";
export type FormatHint = "percent" | "currency_ars" | "currency_usd" | "index" | "basis_points" | "raw";

export interface AnalysisInput {
  /** Serie ordenada cronológicamente [(date_iso, value)]. */
  data: [string, number][];
  /** Etiqueta del indicador para usar en el texto (ej. "el dólar oficial"). */
  noun: string;
  /** Format hint para mostrar valores. */
  format?: FormatHint;
  /** Unidad textual cuando aplica (ej. "%", "USD M"). */
  unit?: string;
  /** Si subir es "bueno". Default true. Solo afecta wording de tendencia. */
  goodDirection?: "up" | "down" | "neutral";
}

export interface AnalysisOutput {
  /** Texto completo formateado (3-5 oraciones). */
  text: string;
  /** Bullets parseables para mostrar como lista. */
  bullets: string[];
  /** Métricas calculadas (útiles para debug o mostrar separado). */
  metrics: {
    n: number;
    lastDate: string;
    lastValue: number;
    firstDate: string;
    firstValue: number;
    totalChangePct: number | null;
    last12mChangePct: number | null;
    last3mChangePct: number | null;
    trend: Trend;
    volatility: Volatility;
    max: { date: string; value: number };
    min: { date: string; value: number };
    avgValue: number;
    lastVsAvgPct: number;
  };
}

// ---------- formatters ----------

function fmtValue(v: number, hint: FormatHint, unit?: string): string {
  if (hint === "percent") {
    return `${v.toFixed(1)}%`;
  }
  if (hint === "currency_ars") {
    return `$${Math.round(v).toLocaleString("es-AR")}`;
  }
  if (hint === "currency_usd") {
    if (Math.abs(v) >= 1000) return `US$ ${(v / 1000).toFixed(1)} mil M`;
    return `US$ ${Math.round(v).toLocaleString("es-AR")} M`;
  }
  if (hint === "basis_points") {
    return `${Math.round(v)} pb`;
  }
  if (hint === "index") {
    return v.toLocaleString("es-AR", { maximumFractionDigits: 1 });
  }
  return `${v.toLocaleString("es-AR", { maximumFractionDigits: 1 })}${unit ? " " + unit : ""}`;
}

function fmtDate(iso: string): string {
  const meses = [
    "ene", "feb", "mar", "abr", "may", "jun",
    "jul", "ago", "sep", "oct", "nov", "dic",
  ];
  const parts = iso.split("-");
  if (parts.length < 2) return iso;
  const year = parts[0];
  const mIdx = parseInt(parts[1], 10) - 1;
  return `${meses[mIdx] ?? parts[1]}-${year.slice(2)}`;
}

function fmtPctSigned(v: number | null): string {
  if (v === null) return "n/d";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}%`;
}

// ---------- statistical helpers ----------

function pct(a: number, b: number): number | null {
  if (b === 0 || !isFinite(b)) return null;
  return ((a - b) / b) * 100;
}

function stdev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const sqDiff = arr.map((x) => (x - mean) ** 2);
  return Math.sqrt(sqDiff.reduce((a, b) => a + b, 0) / arr.length);
}

function classifyTrend(slopePctPerStep: number): Trend {
  const abs = Math.abs(slopePctPerStep);
  if (abs < 0.5) return "estable";
  if (slopePctPerStep > 5) return "creciente_fuerte";
  if (slopePctPerStep > 0) return "creciente";
  if (slopePctPerStep > -5) return "decreciente";
  return "decreciente_fuerte";
}

function classifyVolatility(cv: number): Volatility {
  // coeficiente de variación (stdev/mean) sobre los cambios %
  if (cv < 2) return "muy_estable";
  if (cv < 5) return "estable";
  if (cv < 15) return "moderada";
  if (cv < 40) return "volatil";
  return "muy_volatil";
}

// ---------- core analysis ----------

export function analyzeSeries(input: AnalysisInput): AnalysisOutput | null {
  const { data, noun, format = "raw", unit, goodDirection = "neutral" } = input;
  if (data.length < 3) return null;

  const sorted = [...data].sort((a, b) => (a[0] < b[0] ? -1 : 1));
  const firstDate = sorted[0][0];
  const firstValue = sorted[0][1];
  const lastDate = sorted[sorted.length - 1][0];
  const lastValue = sorted[sorted.length - 1][1];

  const values = sorted.map(([, v]) => v);
  const dates = sorted.map(([d]) => d);

  // Max / Min
  let maxIdx = 0;
  let minIdx = 0;
  for (let i = 0; i < values.length; i++) {
    if (values[i] > values[maxIdx]) maxIdx = i;
    if (values[i] < values[minIdx]) minIdx = i;
  }

  // Averages
  const avgValue = values.reduce((a, b) => a + b, 0) / values.length;

  // Total change
  const totalChangePct = pct(lastValue, firstValue);

  // Last 12m change (asume mensual o subset cercano)
  const last12mChangePct =
    sorted.length >= 13 ? pct(lastValue, sorted[sorted.length - 13][1]) : null;

  // Last 3m change
  const last3mChangePct =
    sorted.length >= 4 ? pct(lastValue, sorted[sorted.length - 4][1]) : null;

  // Trend: regresión lineal sobre los últimos N puntos
  const N = Math.min(12, sorted.length);
  const recent = values.slice(-N);
  const recentChanges: number[] = [];
  for (let i = 1; i < recent.length; i++) {
    const change = pct(recent[i], recent[i - 1]);
    if (change !== null) recentChanges.push(change);
  }
  const avgChange =
    recentChanges.length > 0
      ? recentChanges.reduce((a, b) => a + b, 0) / recentChanges.length
      : 0;
  const trend = classifyTrend(avgChange);

  // Volatility
  const cv = stdev(recentChanges) || 0;
  const volatility = classifyVolatility(cv);

  // lastVsAvg
  const lastVsAvgPct = pct(lastValue, avgValue) ?? 0;

  // ---------- generate text ----------
  const bullets: string[] = [];

  // 1. Estado actual
  bullets.push(
    `Último valor: ${fmtValue(lastValue, format, unit)} (${fmtDate(lastDate)}).`,
  );

  // 2. Tendencia
  const trendText: Record<Trend, string> = {
    creciente_fuerte: "está subiendo con fuerza",
    creciente: "muestra una tendencia al alza",
    estable: "se mantiene relativamente estable",
    decreciente: "muestra una tendencia a la baja",
    decreciente_fuerte: "está cayendo con fuerza",
  };
  bullets.push(
    `En los últimos ${recentChanges.length} períodos, ${noun} ${trendText[trend]} (cambio promedio ${avgChange.toFixed(1)}% por período).`,
  );

  // 3. Comparativo último año (si aplica)
  if (last12mChangePct !== null) {
    const direction = last12mChangePct > 0 ? "creció" : "cayó";
    bullets.push(
      `Versus hace un año, ${noun} ${direction} ${Math.abs(last12mChangePct).toFixed(1)}% (de ${fmtValue(sorted[sorted.length - 13][1], format, unit)} a ${fmtValue(lastValue, format, unit)}).`,
    );
  }

  // 4. vs promedio histórico
  if (Math.abs(lastVsAvgPct) > 5) {
    const pos = lastVsAvgPct > 0 ? "por encima" : "por debajo";
    bullets.push(
      `El nivel actual está ${Math.abs(lastVsAvgPct).toFixed(1)}% ${pos} del promedio histórico (${fmtValue(avgValue, format, unit)}).`,
    );
  }

  // 5. Máximos y mínimos
  const yearsSpan = (new Date(lastDate).getTime() - new Date(firstDate).getTime()) / (1000 * 60 * 60 * 24 * 365);
  if (yearsSpan > 1) {
    bullets.push(
      `Máximo histórico de la serie: ${fmtValue(values[maxIdx], format, unit)} (${fmtDate(dates[maxIdx])}). Mínimo: ${fmtValue(values[minIdx], format, unit)} (${fmtDate(dates[minIdx])}).`,
    );
  }

  // 6. Volatilidad
  const volText: Record<Volatility, string> = {
    muy_estable: "muy estable",
    estable: "estable",
    moderada: "con volatilidad moderada",
    volatil: "volátil",
    muy_volatil: "muy volátil",
  };
  if (volatility !== "muy_estable" && volatility !== "estable") {
    bullets.push(
      `La serie es ${volText[volatility]} (desvío estándar de cambios mensuales: ${cv.toFixed(1)} puntos porcentuales).`,
    );
  }

  // 7. Interpretación final si goodDirection ayuda
  if (goodDirection !== "neutral" && last12mChangePct !== null) {
    const isGood =
      (goodDirection === "up" && last12mChangePct > 0) ||
      (goodDirection === "down" && last12mChangePct < 0);
    bullets.push(
      isGood
        ? `Dato favorable: el movimiento del último año va en la dirección preferible para este indicador.`
        : `Dato desfavorable: el movimiento del último año va en contra de lo deseable.`,
    );
  }

  const text = bullets.join(" ");
  return {
    text,
    bullets,
    metrics: {
      n: values.length,
      lastDate,
      lastValue,
      firstDate,
      firstValue,
      totalChangePct,
      last12mChangePct,
      last3mChangePct,
      trend,
      volatility,
      max: { date: dates[maxIdx], value: values[maxIdx] },
      min: { date: dates[minIdx], value: values[minIdx] },
      avgValue,
      lastVsAvgPct,
    },
  };
}

// Para uso desde components:
export { fmtValue as formatValue, fmtDate as formatShortDate, fmtPctSigned };
