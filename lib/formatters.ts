export type FormatType = "percent" | "peso" | "index" | "decimal";

const MESES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

/** Format a numeric value by type. Series percent data is raw decimal (0.026 = 2.6%). */
export function formatValue(v: number, type: FormatType): string {
  switch (type) {
    case "percent":
      return (v * 100).toFixed(1) + "%";
    case "peso":
      return "$" + v.toLocaleString("es-AR", { maximumFractionDigits: 0 });
    case "index":
      return v.toLocaleString("es-AR", { maximumFractionDigits: 0 });
    case "decimal":
      return v.toLocaleString("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    default:
      return v.toLocaleString("es-AR", { maximumFractionDigits: 1 });
  }
}

/** "2026-02-01" → "Feb 2026" */
export function formatDate(iso: string): string {
  if (!iso || iso.length < 7) return iso;
  const [y, m] = iso.split("-");
  const mi = parseInt(m, 10) - 1;
  return `${MESES[mi] ?? m} ${y}`;
}

/** Compact large numbers: 517893412 → "517,9M" */
export function formatCompact(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e9) return sign + (abs / 1e9).toLocaleString("es-AR", { maximumFractionDigits: 1 }) + "B";
  if (abs >= 1e6) return sign + (abs / 1e6).toLocaleString("es-AR", { maximumFractionDigits: 1 }) + "M";
  if (abs >= 1e3) return sign + (abs / 1e3).toLocaleString("es-AR", { maximumFractionDigits: 1 }) + "K";
  return n.toLocaleString("es-AR", { maximumFractionDigits: 1 });
}
