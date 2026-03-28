import { readIndicator, readSeries } from "@/lib/readData";
import { HomeClient } from "@/components/HomeClient";

export default async function Home() {
  const [inflacion, dolarOficial, dolarBlue, empleo, pobreza] =
    await Promise.all([
      readIndicator("inflacion.json"),
      readIndicator("dolar_oficial.json"),
      readIndicator("dolar_blue.json"),
      readIndicator("empleo.json"),
      readIndicator("pobreza.json"),
    ]);

  const [
    inflacionSeries,
    dolarOficialSeries,
    dolarBlueSeries,
    ripteSeries,
    emaeSeries,
    pbiSeries,
    desocupacionSeries,
    pobrezaSeries,
  ] = await Promise.all([
    readSeries("inflacion_mensual.json"),
    readSeries("dolar_oficial_mensual.json"),
    readSeries("dolar_blue_mensual.json"),
    readSeries("ripte_mensual.json"),
    readSeries("emae_mensual.json"),
    readSeries("pbi_trimestral.json"),
    readSeries("tasa_desocupacion.json"),
    readSeries("tasa_pobreza.json"),
  ]);

  const tail = (arr: [string, number][], n = 48) => arr.slice(-n);

  return (
    <HomeClient
      inflacion={inflacion}
      dolarOficial={dolarOficial}
      dolarBlue={dolarBlue}
      empleo={empleo}
      pobreza={pobreza}
      series={{
        inflacion: tail(inflacionSeries),
        dolarOficial: tail(dolarOficialSeries),
        dolarBlue: tail(dolarBlueSeries),
        ripte: tail(ripteSeries),
        emae: tail(emaeSeries),
        pbi: pbiSeries.slice(-20),
        desocupacion: desocupacionSeries.slice(-20),
        pobreza: pobrezaSeries,
      }}
    />
  );
}
