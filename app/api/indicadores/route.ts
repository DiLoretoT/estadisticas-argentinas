import { readIndicator } from "@/lib/readData";
import { NextResponse } from "next/server";

export async function GET() {
  const [inflacion, dolarOficial, dolarBlue, empleo, pobreza] =
    await Promise.all([
      readIndicator("inflacion.json"),
      readIndicator("dolar_oficial.json"),
      readIndicator("dolar_blue.json"),
      readIndicator("empleo.json"),
      readIndicator("pobreza.json"),
    ]);

  return NextResponse.json({
    inflacion,
    dolar_oficial: dolarOficial,
    dolar_blue: dolarBlue,
    empleo,
    pobreza,
  });
}
