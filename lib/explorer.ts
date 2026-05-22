/**
 * Utilidades para la página de exploración interactiva.
 *
 * Maneja filtrado de series por período, cálculo de bounds y formato.
 */

export type PeriodPreset =
  | "all"
  | "10y"
  | "5y"
  | "3y"
  | "1y"
  | "6m"
  | "custom";

export const PERIOD_LABELS: Record<PeriodPreset, string> = {
  all: "Todo",
  "10y": "10 años",
  "5y": "5 años",
  "3y": "3 años",
  "1y": "1 año",
  "6m": "6 meses",
  custom: "Custom",
};

/** Cuántos días representa cada preset. */
const PERIOD_DAYS: Partial<Record<PeriodPreset, number>> = {
  "10y": 365 * 10,
  "5y": 365 * 5,
  "3y": 365 * 3,
  "1y": 365,
  "6m": 180,
};

export interface DateRange {
  from: Date;
  to: Date;
}

/** Calcula DateRange a partir del preset y la última fecha disponible global. */
export function periodToRange(
  preset: PeriodPreset,
  lastDate: Date,
  customFrom?: string,
  customTo?: string,
): DateRange | null {
  if (preset === "all") return null; // no filtrar
  if (preset === "custom") {
    if (!customFrom || !customTo) return null;
    return { from: new Date(customFrom), to: new Date(customTo) };
  }
  const days = PERIOD_DAYS[preset];
  if (!days) return null;
  const from = new Date(lastDate);
  from.setDate(from.getDate() - days);
  return { from, to: lastDate };
}

/** Filtra una serie temporal por DateRange. Si range es null devuelve la serie completa. */
export function filterByRange(
  series: [string, number][],
  range: DateRange | null,
): [string, number][] {
  if (!range) return series;
  const fromMs = range.from.getTime();
  const toMs = range.to.getTime();
  return series.filter(([d]) => {
    const t = new Date(d).getTime();
    return t >= fromMs && t <= toMs;
  });
}

/** Encuentra la fecha mínima y máxima cubierta por un set de series alineadas. */
export function globalDateBounds(
  serieses: [string, number][][],
): { min: Date; max: Date } | null {
  let minMs = Infinity;
  let maxMs = -Infinity;
  for (const s of serieses) {
    if (s.length === 0) continue;
    const firstMs = new Date(s[0][0]).getTime();
    const lastMs = new Date(s[s.length - 1][0]).getTime();
    if (firstMs < minMs) minMs = firstMs;
    if (lastMs > maxMs) maxMs = lastMs;
  }
  if (!isFinite(minMs)) return null;
  return { min: new Date(minMs), max: new Date(maxMs) };
}

/** Formatea un valor según la unidad declarada en el catálogo. */
export function formatValueByUnit(v: number, unit: string): string {
  if (
    unit === "percent_decimal" ||
    unit === "percent_pct" ||
    unit === "porcentaje_anual"
  ) {
    return `${v.toFixed(1)}%`;
  }
  if (unit === "peso_ars") {
    return `$${v.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
  }
  if (unit === "usd_per_local" || unit === "ars_per_usd") {
    return v.toFixed(2);
  }
  if (unit === "millones_usd") {
    if (Math.abs(v) >= 1000)
      return `US$ ${(v / 1000).toFixed(1)} mil M`;
    return `US$ ${v.toFixed(0)} M`;
  }
  if (unit === "millones_pesos") {
    return `$${(v / 1000).toFixed(1)} mil M`;
  }
  if (unit === "puntos_basicos") {
    return `${Math.round(v)} pb`;
  }
  if (unit === "indice") {
    return v.toLocaleString("es-AR", { maximumFractionDigits: 1 });
  }
  return v.toLocaleString("es-AR", { maximumFractionDigits: 2 });
}

/** Paleta de colores para hasta 6 series simultáneas. */
export const SERIES_COLORS = [
  "var(--chart-1)",
  "var(--chart-6)",
  "var(--chart-2)",
  "var(--chart-7)",
  "var(--chart-3)",
  "var(--chart-8)",
];
