/**
 * Catálogo de series disponibles para análisis cruzado.
 *
 * Cada entrada describe una serie temporal que existe en data/series/.
 * El componente Cross-Análisis lo usa para armar selectores y cargar
 * la serie correcta.
 */

export type SeriesUnit =
  | "percent_decimal" // ej. 0.026 = 2.6%
  | "percent_pct" // ej. 2.6 (ya en %)
  | "peso_ars"
  | "usd_per_local"
  | "ars_per_usd"
  | "millones_usd"
  | "millones_pesos"
  | "indice"
  | "puntos_basicos"
  | "porcentaje_anual";

export type SeriesCategory =
  | "precios"
  | "dolar"
  | "monedas_latam"
  | "actividad"
  | "empleo"
  | "social"
  | "monetario"
  | "mercado"
  | "comercio"
  | "salarios"
  | "confianza";

export interface SeriesEntry {
  id: string;
  label: string;
  category: SeriesCategory;
  unit: SeriesUnit;
  file: string; // path relativo dentro de data/series/
}

export const SERIES_CATALOG: SeriesEntry[] = [
  // ─── Precios ───────────────────────────────────────────
  { id: "ipc_mensual", label: "Inflación mensual (IPC %)", category: "precios", unit: "percent_decimal", file: "inflacion_mensual.json" },

  // ─── Dólar ──────────────────────────────────────────────
  { id: "dolar_oficial_mensual", label: "Dólar oficial ($ ARS)", category: "dolar", unit: "peso_ars", file: "dolar_oficial_mensual.json" },
  { id: "dolar_blue_mensual", label: "Dólar blue ($ ARS)", category: "dolar", unit: "peso_ars", file: "dolar_blue_mensual.json" },
  { id: "dolar_mep_mensual", label: "Dólar MEP ($ ARS)", category: "dolar", unit: "peso_ars", file: "dolar_mep_mensual.json" },
  { id: "dolar_ccl_mensual", label: "Dólar CCL ($ ARS)", category: "dolar", unit: "peso_ars", file: "dolar_ccl_mensual.json" },
  { id: "dolar_mayorista_mensual", label: "Dólar mayorista ($ ARS)", category: "dolar", unit: "peso_ars", file: "dolar_mayorista_mensual.json" },
  { id: "dolar_cripto_mensual", label: "Dólar cripto ($ ARS)", category: "dolar", unit: "peso_ars", file: "dolar_cripto_mensual.json" },
  { id: "dolar_tarjeta_mensual", label: "Dólar tarjeta ($ ARS)", category: "dolar", unit: "peso_ars", file: "dolar_tarjeta_mensual.json" },
  { id: "euro_mensual", label: "Euro ($ ARS)", category: "dolar", unit: "peso_ars", file: "euro_mensual.json" },

  // ─── Monedas LATAM ──────────────────────────────────────
  { id: "brl_per_usd", label: "Real brasileño (BRL por USD)", category: "monedas_latam", unit: "usd_per_local", file: "moneda_brl_mensual.json" },
  { id: "clp_per_usd", label: "Peso chileno (CLP por USD)", category: "monedas_latam", unit: "usd_per_local", file: "moneda_clp_mensual.json" },
  { id: "uyu_per_usd", label: "Peso uruguayo (UYU por USD)", category: "monedas_latam", unit: "usd_per_local", file: "moneda_uyu_mensual.json" },
  { id: "pen_per_usd", label: "Sol peruano (PEN por USD)", category: "monedas_latam", unit: "usd_per_local", file: "moneda_pen_mensual.json" },
  { id: "cop_per_usd", label: "Peso colombiano (COP por USD)", category: "monedas_latam", unit: "usd_per_local", file: "moneda_cop_mensual.json" },
  { id: "pyg_per_usd", label: "Guaraní paraguayo (PYG por USD)", category: "monedas_latam", unit: "usd_per_local", file: "moneda_pyg_mensual.json" },
  { id: "mxn_per_usd", label: "Peso mexicano (MXN por USD)", category: "monedas_latam", unit: "usd_per_local", file: "moneda_mxn_mensual.json" },

  // ─── Actividad ──────────────────────────────────────────
  { id: "emae_mensual", label: "EMAE — índice mensual", category: "actividad", unit: "indice", file: "emae_mensual.json" },
  { id: "pbi_trimestral", label: "PBI trimestral (mill. $ const.)", category: "actividad", unit: "millones_pesos", file: "pbi_trimestral.json" },

  // ─── Empleo y salarios ─────────────────────────────────
  { id: "tasa_desocupacion", label: "Tasa de desocupación (%)", category: "empleo", unit: "percent_decimal", file: "tasa_desocupacion.json" },
  { id: "tasa_empleo", label: "Tasa de empleo (%)", category: "empleo", unit: "percent_decimal", file: "tasa_empleo.json" },
  { id: "ripte_mensual", label: "RIPTE — variación mensual (%)", category: "salarios", unit: "percent_decimal", file: "ripte_mensual.json" },
  { id: "ripte_nivel", label: "RIPTE — nivel nominal", category: "salarios", unit: "indice", file: "ripte_nivel.json" },

  // ─── Social ─────────────────────────────────────────────
  { id: "tasa_pobreza", label: "Tasa de pobreza (%)", category: "social", unit: "percent_decimal", file: "tasa_pobreza.json" },
  { id: "linea_indigencia", label: "Línea de indigencia ($ adulto/mes)", category: "social", unit: "peso_ars", file: "linea_indigencia.json" },

  // ─── Confianza / expectativas (UTDT · Di Tella, NO oficial) ───
  { id: "icg_mensual", label: "Confianza en el Gobierno — ICG (0-5)", category: "confianza", unit: "indice", file: "icg_mensual.json" },
  { id: "icc_mensual", label: "Confianza del Consumidor — ICC (0-100)", category: "confianza", unit: "indice", file: "icc_mensual.json" },

  // ─── Monetario BCRA ────────────────────────────────────
  { id: "base_monetaria", label: "Base monetaria (mill. $)", category: "monetario", unit: "millones_pesos", file: "monetario_base_monetaria_mensual.json" },
  { id: "reservas_bcra", label: "Reservas internacionales BCRA (USD M)", category: "monetario", unit: "millones_usd", file: "monetario_reservas_mensual.json" },
  { id: "tpm", label: "Tasa de Política Monetaria (% anual)", category: "monetario", unit: "porcentaje_anual", file: "monetario_tpm_diario.json" },
  { id: "badlar", label: "BADLAR bancos privados (% anual)", category: "monetario", unit: "porcentaje_anual", file: "monetario_badlar_diario.json" },
  { id: "plazo_fijo_30d", label: "Tasa plazo fijo 30d (% anual)", category: "monetario", unit: "porcentaje_anual", file: "monetario_plazo_fijo_30d_diario.json" },
  { id: "m2_privado_yoy", label: "M2 privado — variación interanual (%)", category: "monetario", unit: "percent_pct", file: "monetario_m2_privado_yoy_mensual.json" },
  { id: "rem_inflacion_12m", label: "REM expectativas inflación 12m (%)", category: "monetario", unit: "percent_pct", file: "monetario_rem_inflacion_12m_mensual.json" },

  // ─── Mercado de capitales ──────────────────────────────
  { id: "riesgo_pais", label: "Riesgo país EMBI (pb)", category: "mercado", unit: "puntos_basicos", file: "mercado_riesgo_pais_mensual.json" },
  { id: "merval", label: "S&P Merval (ARS)", category: "mercado", unit: "indice", file: "mercado_merval_mensual.json" },
  { id: "adr_ggal", label: "Grupo Galicia ADR (USD)", category: "mercado", unit: "usd_per_local", file: "mercado_ggal_mensual.json" },
  { id: "adr_ypf", label: "YPF ADR (USD)", category: "mercado", unit: "usd_per_local", file: "mercado_ypf_mensual.json" },

  // ─── Comercio exterior ──────────────────────────────────
  { id: "export_total", label: "Exportaciones totales (USD M)", category: "comercio", unit: "millones_usd", file: "comercio_exportaciones_total.json" },
  { id: "import_total", label: "Importaciones totales (USD M)", category: "comercio", unit: "millones_usd", file: "comercio_importaciones_total.json" },
  { id: "balanza_comercial", label: "Balanza comercial (USD M)", category: "comercio", unit: "millones_usd", file: "comercio_balanza_comercial.json" },
  { id: "export_primarios", label: "Exports · Primarios (USD M)", category: "comercio", unit: "millones_usd", file: "comercio_export_primarios.json" },
  { id: "export_moa", label: "Exports · MOA (USD M)", category: "comercio", unit: "millones_usd", file: "comercio_export_moa.json" },
  { id: "export_moi", label: "Exports · MOI (USD M)", category: "comercio", unit: "millones_usd", file: "comercio_export_moi.json" },
  { id: "import_consumo", label: "Imports · Bienes consumo (USD M)", category: "comercio", unit: "millones_usd", file: "comercio_import_consumo.json" },
];

export const CATEGORY_LABELS: Record<SeriesCategory, string> = {
  precios: "Precios",
  dolar: "Dólar / FX local",
  monedas_latam: "Monedas LATAM",
  actividad: "Actividad económica",
  empleo: "Empleo",
  social: "Social",
  monetario: "Política monetaria",
  mercado: "Mercado de capitales",
  comercio: "Comercio exterior",
  salarios: "Salarios",
  confianza: "Confianza y expectativas",
};

export function getSeriesById(id: string): SeriesEntry | undefined {
  return SERIES_CATALOG.find((s) => s.id === id);
}

/** Agrupa las series por categoría para los selectores. */
export function groupByCategory(): Record<SeriesCategory, SeriesEntry[]> {
  const out: Partial<Record<SeriesCategory, SeriesEntry[]>> = {};
  for (const s of SERIES_CATALOG) {
    if (!out[s.category]) out[s.category] = [];
    out[s.category]!.push(s);
  }
  return out as Record<SeriesCategory, SeriesEntry[]>;
}
