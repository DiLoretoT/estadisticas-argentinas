/**
 * Utilidades estadísticas para análisis cruzado.
 *
 * Toda función asume que las series están alineadas por fecha (mismo
 * período en el mismo índice). El componente de análisis cruzado se
 * encarga de hacer el join previo.
 */

/** Pearson product-moment correlation coefficient. */
export function pearson(xs: number[], ys: number[]): number | null {
  if (xs.length !== ys.length || xs.length < 2) return null;
  const n = xs.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;
  for (let i = 0; i < n; i++) {
    const x = xs[i];
    const y = ys[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }
  const numerator = n * sumXY - sumX * sumY;
  const denomSq = (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY);
  if (denomSq <= 0) return null;
  return numerator / Math.sqrt(denomSq);
}

/** Alinea dos series por fecha y devuelve la intersección con valores en ambos. */
export function alignByDate(
  a: [string, number][],
  b: [string, number][],
  options: { dateGranularity?: "day" | "month" } = {},
): { dates: string[]; xs: number[]; ys: number[] } {
  const gran = options.dateGranularity ?? "month";

  const keyOf = (d: string) =>
    gran === "month" ? d.slice(0, 7) : d.slice(0, 10);

  const mapA = new Map<string, number>();
  for (const [d, v] of a) {
    const k = keyOf(d);
    // Si el día está repetido (ej. diaria→mensual), keep last
    mapA.set(k, v);
  }
  const mapB = new Map<string, number>();
  for (const [d, v] of b) {
    const k = keyOf(d);
    mapB.set(k, v);
  }

  const sharedKeys = Array.from(mapA.keys())
    .filter((k) => mapB.has(k))
    .sort();

  const dates: string[] = [];
  const xs: number[] = [];
  const ys: number[] = [];
  for (const k of sharedKeys) {
    dates.push(k);
    xs.push(mapA.get(k)!);
    ys.push(mapB.get(k)!);
  }
  return { dates, xs, ys };
}

/** Texto cualitativo para un coeficiente de correlación. */
export function describeCorrelation(r: number | null): {
  label: string;
  color: string;
} {
  if (r === null) return { label: "Sin datos", color: "var(--color-text-muted)" };
  const abs = Math.abs(r);
  if (abs >= 0.9) return { label: r > 0 ? "Muy fuerte positiva" : "Muy fuerte negativa", color: r > 0 ? "var(--color-success)" : "var(--color-danger)" };
  if (abs >= 0.7) return { label: r > 0 ? "Fuerte positiva" : "Fuerte negativa", color: r > 0 ? "var(--color-success)" : "var(--color-danger)" };
  if (abs >= 0.4) return { label: r > 0 ? "Moderada positiva" : "Moderada negativa", color: r > 0 ? "var(--chart-2)" : "var(--chart-7)" };
  if (abs >= 0.2) return { label: r > 0 ? "Débil positiva" : "Débil negativa", color: "var(--color-text-muted)" };
  return { label: "Sin correlación", color: "var(--color-text-muted)" };
}
