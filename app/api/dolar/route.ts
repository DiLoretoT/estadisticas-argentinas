import { NextResponse } from "next/server";

/**
 * Cotizaciones del dólar en vivo (intradía).
 *
 * Tira de DolarApi.com (público, sin API key, CORS abierto) y normaliza al
 * formato que consume el front. Se cachea en el CDN de Vercel vía
 * `revalidate = 300` (5 min): el browser pega contra NUESTRO dominio, así que
 * no hay problema de CORS y aguantamos mucho tráfico con pocas invocations.
 *
 * Si DolarApi falla, devolvemos `{ dolares: {}, stale: true }` con 200 para
 * que el cliente caiga limpio al dato estático server-rendered.
 */

export const revalidate = 300; // 5 min — el CDN sirve la respuesta cacheada

// casa (DolarApi) → label que usa HomeClient en sus KPI cards
const CASA_TO_LABEL: Record<string, string> = {
  oficial: "Oficial",
  mayorista: "Mayorista",
  bolsa: "MEP",
  contadoconliqui: "CCL",
  blue: "Blue",
  cripto: "Cripto",
  tarjeta: "Tarjeta",
};

interface DolarApiItem {
  casa: string;
  nombre: string;
  compra: number | null;
  venta: number | null;
  fechaActualizacion: string;
}

interface DolarLive {
  value: number;
  compra: number | null;
  venta: number | null;
  fechaActualizacion: string;
}

export async function GET() {
  try {
    const res = await fetch("https://dolarapi.com/v1/dolares", {
      next: { revalidate },
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return NextResponse.json({ dolares: {}, stale: true }, { status: 200 });
    }

    const items = (await res.json()) as DolarApiItem[];
    const dolares: Record<string, DolarLive> = {};
    let updatedAt = "";

    for (const item of items) {
      const label = CASA_TO_LABEL[item.casa];
      if (!label) continue;
      // venta es el precio "titular" que muestran los sitios de cotización.
      const value = item.venta ?? item.compra;
      if (value == null) continue;
      dolares[label] = {
        value,
        compra: item.compra,
        venta: item.venta,
        fechaActualizacion: item.fechaActualizacion,
      };
      if (item.fechaActualizacion > updatedAt) {
        updatedAt = item.fechaActualizacion;
      }
    }

    return NextResponse.json(
      { dolares, updatedAt, source: "dolarapi.com", stale: false },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ dolares: {}, stale: true }, { status: 200 });
  }
}
