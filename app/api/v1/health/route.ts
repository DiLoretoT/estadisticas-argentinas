import { NextResponse } from "next/server";

export const revalidate = 0;
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/health
 *
 * Healthcheck para monitoreo. Devuelve 200 + timestamp si la API está viva.
 * Sin cache.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      version: "1",
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
