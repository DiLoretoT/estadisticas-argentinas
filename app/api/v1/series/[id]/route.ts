import { NextResponse } from "next/server";
import { readSeries } from "@/lib/readData";
import { getSeriesById } from "@/lib/seriesCatalog";

export const revalidate = 1800;

/**
 * GET /api/v1/series/[id]
 *
 * Devuelve una serie temporal específica.
 *
 * Path params:
 *   - id: ID de la serie del catálogo (whitelist)
 *
 * Query params (opcionales):
 *   - from: fecha desde (YYYY-MM-DD) — filtra
 *   - to: fecha hasta (YYYY-MM-DD) — filtra
 *   - limit: máximo de puntos (default: sin límite)
 *
 * Response 200:
 * {
 *   "id": "ipc_mensual",
 *   "label": "Inflación mensual (IPC %)",
 *   "category": "precios",
 *   "unit": "percent_decimal",
 *   "count": N,
 *   "data": [[date_iso, value], ...]
 * }
 *
 * Response 404: { error: "Serie no encontrada" }
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const meta = getSeriesById(id);
  if (!meta) {
    return NextResponse.json(
      { error: "Serie no encontrada", id },
      { status: 404 },
    );
  }

  let data = await readSeries(meta.file);

  // Filtros opcionales
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const limit = searchParams.get("limit");

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (from && dateRegex.test(from)) {
    data = data.filter(([d]) => d >= from);
  }
  if (to && dateRegex.test(to)) {
    data = data.filter(([d]) => d <= to);
  }
  if (limit) {
    const n = parseInt(limit, 10);
    if (!isNaN(n) && n > 0 && n < 10000) {
      data = data.slice(-n);
    }
  }

  return NextResponse.json(
    {
      id: meta.id,
      label: meta.label,
      category: meta.category,
      unit: meta.unit,
      count: data.length,
      data,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=1800, s-maxage=1800",
      },
    },
  );
}
