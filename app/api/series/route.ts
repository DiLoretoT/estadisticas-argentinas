import { readSeries } from "@/lib/readData";
import { NextResponse } from "next/server";

const SERIES_MAP: Record<string, string> = {
  inflacion_mensual: "inflacion_mensual.json",
  inflacion_empalmada: "inflacion_empalmada.json",
  dolar_oficial_mensual: "dolar_oficial_mensual.json",
  dolar_oficial_diario: "dolar_oficial_diario.json",
  dolar_blue_mensual: "dolar_blue_mensual.json",
  dolar_blue_diario: "dolar_blue_diario.json",
  pbi_trimestral: "pbi_trimestral.json",
  ripte_mensual: "ripte_mensual.json",
  ripte_nivel: "ripte_nivel.json",
  salarios_mensual: "salarios_mensual.json",
  euro_diario: "euro_diario.json",
  euro_mensual: "euro_mensual.json",
  emae_mensual: "emae_mensual.json",
  tasa_desocupacion: "tasa_desocupacion.json",
  tasa_empleo: "tasa_empleo.json",
  tasa_pobreza: "tasa_pobreza.json",
  linea_indigencia: "linea_indigencia.json",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  if (!name || !(name in SERIES_MAP)) {
    return NextResponse.json({ error: "Serie no disponible" }, { status: 400 });
  }

  const data = await readSeries(SERIES_MAP[name]);
  return NextResponse.json({ name, data });
}
