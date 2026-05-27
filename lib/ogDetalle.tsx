/**
 * Generador de la imagen Open Graph dinámica de cada `/detalle/<slug>`.
 *
 * A diferencia de la OG global (`app/opengraph-image.tsx`, estática y de marca),
 * esta muestra el último valor real del indicador como héroe — la "tarjeta" que
 * se ve al compartir el link en WhatsApp, X, etc.
 *
 * Usa runtime Node (no edge) porque lee la serie del filesystem con
 * `readSeriesLocal` y formatea con `Intl` (`toLocaleString("es-AR")`).
 */
import { ImageResponse } from "next/og";
import { readSeriesLocal } from "@/lib/readData";
import { formatValue, type FormatType } from "@/lib/formatters";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

interface OgDetalleConfig {
  /** Categoría (coincide con el eyebrow de la página de detalle). */
  eyebrow: string;
  /** Título grande de la tarjeta. */
  title: string;
  /** Serie de `data/series/*` que aporta el valor héroe (su último punto). */
  seriesFile: string;
  format: FormatType;
  /** Qué representa el número + fuente. */
  valueLabel: string;
}

export const OG_DETALLE: Record<string, OgDetalleConfig> = {
  inflacion: {
    eyebrow: "Precios",
    title: "Inflación en Argentina",
    seriesFile: "inflacion_mensual.json",
    format: "percent",
    valueLabel: "Variación mensual · IPC INDEC",
  },
  dolar: {
    eyebrow: "Tipo de cambio",
    title: "Dólar hoy en Argentina",
    seriesFile: "dolar_oficial_diario.json",
    format: "peso",
    valueLabel: "Dólar oficial · BCRA",
  },
  euro: {
    eyebrow: "Tipo de cambio",
    title: "Euro hoy en Argentina",
    seriesFile: "euro_diario.json",
    format: "peso",
    valueLabel: "Euro de referencia · BCRA",
  },
  salarios: {
    eyebrow: "Ingresos",
    title: "Salarios en Argentina",
    seriesFile: "ripte_nivel.json",
    format: "peso",
    valueLabel: "RIPTE · salario registrado promedio",
  },
  actividad: {
    eyebrow: "Producción",
    title: "Actividad económica",
    seriesFile: "emae_mensual.json",
    format: "index",
    valueLabel: "EMAE · base 2004 = 100",
  },
  empleo: {
    eyebrow: "Mercado laboral",
    title: "Empleo en Argentina",
    seriesFile: "tasa_desocupacion.json",
    format: "percent",
    valueLabel: "Tasa de desocupación · EPH INDEC",
  },
  pobreza: {
    eyebrow: "Social",
    title: "Pobreza en Argentina",
    seriesFile: "tasa_pobreza.json",
    format: "percent",
    valueLabel: "Tasa de pobreza · EPH INDEC",
  },
};

const MESES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

/** "2026-03-01" → "mar 2026"; "2026-05-27" → "27 may 2026" (si es dato diario). */
function periodLabel(iso: string): string {
  if (!iso || iso.length < 7) return iso;
  const [y, m, d] = iso.split("-");
  const mes = MESES[parseInt(m, 10) - 1] ?? m;
  if (d && d !== "01") return `${parseInt(d, 10)} ${mes} ${y}`;
  return `${mes} ${y}`;
}

/** alt text de la imagen para el slug (usado por cada opengraph-image.tsx). */
export function ogAlt(slug: string): string {
  const cfg = OG_DETALLE[slug];
  return cfg
    ? `${cfg.title} — Estadísticas Argentinas`
    : "Estadísticas Argentinas";
}

export async function renderDetalleOg(slug: string): Promise<ImageResponse> {
  const cfg = OG_DETALLE[slug];
  const series = cfg ? await readSeriesLocal(cfg.seriesFile) : [];
  const last = series.length > 0 ? series[series.length - 1] : undefined;
  const valueStr = cfg && last ? formatValue(last[1], cfg.format) : "—";
  const dateStr = last ? periodLabel(last[0]) : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background:
            "linear-gradient(135deg, #fcfaf6 0%, #f5ece0 50%, #f0ddd0 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Top — categoría + marca */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 22,
              color: "#c45a2d",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            {cfg ? cfg.eyebrow : "Indicadores"} · Argentina
          </span>
          <span style={{ fontSize: 22, color: "#5a5048", fontWeight: 600 }}>
            Datalogía
          </span>
        </div>

        {/* Middle — título + valor héroe */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontSize: 44,
              fontWeight: 800,
              color: "#2d251d",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            {cfg ? cfg.title : "La economía argentina, en datos"}
          </span>
          <span
            style={{
              fontSize: 168,
              fontWeight: 800,
              color: "#c45a2d",
              lineHeight: 1.0,
              letterSpacing: "-0.03em",
              marginTop: 8,
            }}
          >
            {valueStr}
          </span>
          {cfg && (
            <span
              style={{
                fontSize: 30,
                color: "#6b5f53",
                marginTop: 12,
              }}
            >
              {cfg.valueLabel}
              {dateStr ? `  ·  ${dateStr}` : ""}
            </span>
          )}
        </div>

        {/* Bottom — URL bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "2px solid #d4b896",
            paddingTop: 24,
          }}
        >
          <span style={{ fontSize: 28, color: "#5a5048", fontWeight: 600 }}>
            estadisticas.datalogia.app
          </span>
          <span style={{ fontSize: 24, color: "#a08a72" }}>
            Datos oficiales · INDEC · BCRA
          </span>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}
