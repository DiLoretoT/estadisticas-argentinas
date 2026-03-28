export type FormatType = "percent" | "peso" | "index" | "decimal";

export function formatValue(v: number, type: FormatType): string {
  switch (type) {
    case "percent":
      return v.toFixed(1) + "%";
    case "peso":
      return "$" + v.toLocaleString("es-AR", { maximumFractionDigits: 0 });
    case "index":
      return v.toLocaleString("es-AR", { maximumFractionDigits: 0 });
    case "decimal":
      return v.toFixed(1);
    default:
      return v.toLocaleString("es-AR", { maximumFractionDigits: 1 });
  }
}
