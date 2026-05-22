/**
 * Utilidades estadísticas para análisis cruzado.
 *
 * Tres familias de coeficientes:
 * - Pearson: relación lineal.
 * - Spearman: relación monotónica (lineal o no), robusto a outliers.
 * - Kendall's tau: pares concordantes/discordantes, conservador, ideal con N chico.
 *
 * También cross-correlation con lag para detectar "X lidera a Y".
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

/** Devuelve el ranking promedio (maneja empates con average ranks). */
function rankArray(arr: number[]): number[] {
  const indexed = arr.map((v, i) => ({ v, i }));
  indexed.sort((a, b) => a.v - b.v);
  const ranks = new Array(arr.length).fill(0);
  let i = 0;
  while (i < indexed.length) {
    let j = i;
    while (j < indexed.length - 1 && indexed[j + 1].v === indexed[i].v) j++;
    const avgRank = (i + j) / 2 + 1; // ranks 1-indexed
    for (let k = i; k <= j; k++) ranks[indexed[k].i] = avgRank;
    i = j + 1;
  }
  return ranks;
}

/** Spearman rank correlation. Robusto a outliers, detecta monotonicidad no lineal. */
export function spearman(xs: number[], ys: number[]): number | null {
  if (xs.length !== ys.length || xs.length < 2) return null;
  const rx = rankArray(xs);
  const ry = rankArray(ys);
  return pearson(rx, ry);
}

/** Kendall's tau (versión b, maneja empates). */
export function kendallTau(xs: number[], ys: number[]): number | null {
  if (xs.length !== ys.length || xs.length < 2) return null;
  const n = xs.length;
  let concordant = 0;
  let discordant = 0;
  let tiesX = 0;
  let tiesY = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = xs[j] - xs[i];
      const dy = ys[j] - ys[i];
      if (dx === 0 && dy === 0) continue;
      if (dx === 0) {
        tiesX++;
        continue;
      }
      if (dy === 0) {
        tiesY++;
        continue;
      }
      if (Math.sign(dx) === Math.sign(dy)) concordant++;
      else discordant++;
    }
  }
  const n0 = (n * (n - 1)) / 2;
  const denomSq = (n0 - tiesX) * (n0 - tiesY);
  if (denomSq <= 0) return null;
  return (concordant - discordant) / Math.sqrt(denomSq);
}

/**
 * Cross-correlation con lag. Para cada lag k en [-maxLag, +maxLag]
 * calcula Pearson de Y(t) vs X(t-k). Lag positivo = X lidera a Y.
 *
 * Ejemplo: si peak es en lag=+2, significa que cambios en X anticipan
 * en 2 períodos a cambios en Y (típico: dólar → inflación con 1-2 meses).
 */
export function crossCorrelation(
  xs: number[],
  ys: number[],
  maxLag: number,
): { lag: number; r: number | null }[] {
  if (xs.length !== ys.length) return [];
  const out: { lag: number; r: number | null }[] = [];
  for (let lag = -maxLag; lag <= maxLag; lag++) {
    let xWindow: number[];
    let yWindow: number[];
    if (lag >= 0) {
      // X(t-lag) vs Y(t)
      xWindow = xs.slice(0, xs.length - lag);
      yWindow = ys.slice(lag);
    } else {
      const k = -lag;
      xWindow = xs.slice(k);
      yWindow = ys.slice(0, ys.length - k);
    }
    out.push({ lag, r: pearson(xWindow, yWindow) });
  }
  return out;
}

/** Encuentra el lag con mayor |r| en el array de cross-correlation. */
export function bestLag(
  crossCorr: { lag: number; r: number | null }[],
): { lag: number; r: number } | null {
  let best: { lag: number; r: number } | null = null;
  for (const item of crossCorr) {
    if (item.r === null) continue;
    if (best === null || Math.abs(item.r) > Math.abs(best.r)) {
      best = { lag: item.lag, r: item.r };
    }
  }
  return best;
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
  if (abs >= 0.9)
    return {
      label: r > 0 ? "Muy fuerte positiva" : "Muy fuerte negativa",
      color: r > 0 ? "var(--color-success)" : "var(--color-danger)",
    };
  if (abs >= 0.7)
    return {
      label: r > 0 ? "Fuerte positiva" : "Fuerte negativa",
      color: r > 0 ? "var(--color-success)" : "var(--color-danger)",
    };
  if (abs >= 0.4)
    return {
      label: r > 0 ? "Moderada positiva" : "Moderada negativa",
      color: r > 0 ? "var(--chart-2)" : "var(--chart-7)",
    };
  if (abs >= 0.2)
    return {
      label: r > 0 ? "Débil positiva" : "Débil negativa",
      color: "var(--color-text-muted)",
    };
  return { label: "Sin correlación", color: "var(--color-text-muted)" };
}
