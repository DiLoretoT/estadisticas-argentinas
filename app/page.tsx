import { readIndicator, readSeries } from "@/lib/readData";
import { getLastUpdated } from "@/lib/lastUpdated";
import { computeSalarioReal } from "@/lib/salarioReal";
import { HomeClient } from "@/components/HomeClient";

export default async function Home() {
  const [inflacion, dolarOficial, dolarBlue, empleo, pobreza, lastUpdated] =
    await Promise.all([
      readIndicator("inflacion.json"),
      readIndicator("dolar_oficial.json"),
      readIndicator("dolar_blue.json"),
      readIndicator("empleo.json"),
      readIndicator("pobreza.json"),
      getLastUpdated(),
    ]);

  const [
    inflacionSeries,
    dolarOficialSeries,
    dolarBlueSeries,
    euroSeries,
    ripteSeries,
    ripteNivelSeries,
    emaeSeries,
    pbiSeries,
    desocupacionSeries,
    empleoSeries,
    pobrezaSeries,
    indigenciaSeries,
  ] = await Promise.all([
    readSeries("inflacion_mensual.json"),
    readSeries("dolar_oficial_mensual.json"),
    readSeries("dolar_blue_mensual.json"),
    readSeries("euro_mensual.json"),
    readSeries("ripte_mensual.json"),
    readSeries("ripte_nivel.json"),
    readSeries("emae_mensual.json"),
    readSeries("pbi_trimestral.json"),
    readSeries("tasa_desocupacion.json"),
    readSeries("tasa_empleo.json"),
    readSeries("tasa_pobreza.json"),
    readSeries("linea_indigencia.json"),
  ]);

  const salarioRealSeries = computeSalarioReal(ripteNivelSeries, inflacionSeries);

  const tail = (arr: [string, number][], n = 48) => arr.slice(-n);

  return (
    <HomeClient
      inflacion={inflacion}
      dolarOficial={dolarOficial}
      dolarBlue={dolarBlue}
      empleo={empleo}
      pobreza={pobreza}
      lastUpdated={lastUpdated ?? undefined}
      series={{
        inflacion: tail(inflacionSeries),
        dolarOficial: tail(dolarOficialSeries),
        dolarBlue: tail(dolarBlueSeries),
        euro: tail(euroSeries),
        ripte: tail(ripteSeries),
        salarioReal: tail(salarioRealSeries),
        emae: tail(emaeSeries),
        pbi: pbiSeries.slice(-20),
        desocupacion: desocupacionSeries.slice(-20),
        empleo: empleoSeries.slice(-20),
        pobreza: pobrezaSeries,
        indigencia: indigenciaSeries.slice(-60),
      }}
    />
  );
}
