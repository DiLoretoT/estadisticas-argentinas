import { NextResponse } from "next/server";
import { readIndicator } from "@/lib/readData";

export const revalidate = 600;

interface SnapshotIndicator {
  id: string;
  label: string;
  value: number | null;
  unit: string;
  period: string | null;
  monthly_change: number | null;
  yoy_change: number | null;
  source: string | null;
}

/**
 * GET /api/v1/snapshot
 *
 * "Latest reading" de los indicadores más relevantes en un solo response.
 * Pensado para widgets/banners en apps externas.
 *
 * Response:
 * {
 *   "version": "1",
 *   "updated_at": "...",
 *   "indicators": {
 *     "dolar_oficial": { value, period, monthly_change, ... },
 *     "ipc": { value, period, ... },
 *     ...
 *   }
 * }
 */

const SNAPSHOT_INDICATORS: { key: string; file: string; label: string; unit: string }[] = [
  { key: "ipc_mensual", file: "inflacion.json", label: "Inflación mensual", unit: "percent_decimal" },
  { key: "dolar_oficial", file: "dolar_oficial.json", label: "Dólar oficial", unit: "peso_ars" },
  { key: "dolar_blue", file: "dolar_blue.json", label: "Dólar blue", unit: "peso_ars" },
  { key: "dolar_mep", file: "dolar_mep.json", label: "Dólar MEP", unit: "peso_ars" },
  { key: "dolar_ccl", file: "dolar_ccl.json", label: "Dólar CCL", unit: "peso_ars" },
  { key: "riesgo_pais", file: "mercado_riesgo_pais.json", label: "Riesgo país EMBI", unit: "puntos_basicos" },
  { key: "merval", file: "mercado_merval.json", label: "Merval", unit: "indice_ars" },
  { key: "reservas_bcra", file: "monetario_reservas.json", label: "Reservas BCRA", unit: "millones_usd" },
  { key: "tpm", file: "monetario_tpm.json", label: "Tasa de política monetaria", unit: "porcentaje_anual" },
  { key: "tasa_desocupacion", file: "empleo.json", label: "Desocupación", unit: "percent_decimal" },
  { key: "tasa_pobreza", file: "pobreza.json", label: "Pobreza", unit: "percent_decimal" },
];

function pickValue(raw: Record<string, unknown>): {
  value: number | null;
  period: string | null;
  monthly_change: number | null;
  yoy_change: number | null;
  source: string | null;
} {
  // Caso simple: { value, period, monthly_change, ... }
  if ("value" in raw) {
    return {
      value: raw.value as number | null,
      period: (raw.period as string | undefined) ?? null,
      monthly_change: (raw.monthly_change as number | undefined) ?? null,
      yoy_change: (raw.yoy_change as number | undefined) ?? null,
      source: (raw.source as { name?: string } | undefined)?.name ?? null,
    };
  }
  // Caso anidado: empleo.tasa_desocupacion.value
  // Tomamos la primera key que tenga .value
  for (const v of Object.values(raw)) {
    if (typeof v === "object" && v !== null && "value" in v) {
      const sub = v as Record<string, unknown>;
      return {
        value: sub.value as number | null,
        period: (sub.period as string | undefined) ?? null,
        monthly_change: (sub.monthly_change as number | undefined) ?? null,
        yoy_change: (sub.yoy_change as number | undefined) ?? null,
        source: null,
      };
    }
  }
  return { value: null, period: null, monthly_change: null, yoy_change: null, source: null };
}

export async function GET() {
  const indicators: Record<string, SnapshotIndicator> = {};

  await Promise.all(
    SNAPSHOT_INDICATORS.map(async (ind) => {
      try {
        const raw = await readIndicator(ind.file);
        const picked = pickValue(raw);
        indicators[ind.key] = {
          id: ind.key,
          label: ind.label,
          unit: ind.unit,
          ...picked,
        };
      } catch {
        indicators[ind.key] = {
          id: ind.key,
          label: ind.label,
          unit: ind.unit,
          value: null,
          period: null,
          monthly_change: null,
          yoy_change: null,
          source: null,
        };
      }
    }),
  );

  return NextResponse.json(
    {
      version: "1",
      updated_at: new Date().toISOString(),
      indicators,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=600, s-maxage=600",
      },
    },
  );
}
