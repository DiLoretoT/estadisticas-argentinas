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

/** Cotización FX en pesos: muestra decimales sólo si los tiene (1452,2 / 1.435). */
export function formatPesoFx(v: number | null | undefined): string {
  if (v == null || isNaN(v)) return "—";
  return "$" + v.toLocaleString("es-AR", { maximumFractionDigits: 2 });
}

/** ISO → "14:32" en hora de Buenos Aires. */
export function formatHoraBA(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** ISO → "3 jun" en hora de Buenos Aires. */
export function formatDiaBA(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "numeric",
    month: "short",
  });
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
