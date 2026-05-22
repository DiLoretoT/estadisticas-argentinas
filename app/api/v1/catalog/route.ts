import { NextResponse } from "next/server";
import { SERIES_CATALOG, CATEGORY_LABELS } from "@/lib/seriesCatalog";

export const revalidate = 3600;

/**
 * GET /api/v1/catalog
 *
 * Devuelve el catálogo completo de series disponibles. Útil para clientes
 * que necesitan descubrir qué pueden consumir.
 *
 * Response:
 * {
 *   "version": "1",
 *   "updated_at": "2026-05-22T...",
 *   "categories": {...},
 *   "series": [{ id, label, category, unit, file }],
 *   "count": N
 * }
 */
export async function GET() {
  const series = SERIES_CATALOG.map((s) => ({
    id: s.id,
    label: s.label,
    category: s.category,
    unit: s.unit,
  }));
  return NextResponse.json(
    {
      version: "1",
      updated_at: new Date().toISOString(),
      categories: CATEGORY_LABELS,
      series,
      count: series.length,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    },
  );
}
