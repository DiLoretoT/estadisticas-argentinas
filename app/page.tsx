import { readIndicator, readSeries } from "@/lib/readData";
import { getLastUpdated } from "@/lib/lastUpdated";
import { computeSalarioReal } from "@/lib/salarioReal";
import { HomeClient } from "@/components/HomeClient";

export default async function Home() {
  const [
    inflacion,
    dolarOficial,
    dolarBlue,
    dolarMep,
    dolarCcl,
    dolarMayorista,
    dolarCripto,
    dolarTarjeta,
    empleo,
    pobreza,
    monedaBrl,
    monedaClp,
    monedaUyu,
    monedaPen,
    monedaCop,
    monedaPyg,
    monedaMxn,
    lastUpdated,
  ] = await Promise.all([
    readIndicator("inflacion.json"),
    readIndicator("dolar_oficial.json"),
    readIndicator("dolar_blue.json"),
    readIndicator("dolar_mep.json"),
    readIndicator("dolar_ccl.json"),
    readIndicator("dolar_mayorista.json"),
    readIndicator("dolar_cripto.json"),
    readIndicator("dolar_tarjeta.json"),
    readIndicator("empleo.json"),
    readIndicator("pobreza.json"),
    readIndicator("moneda_brl.json"),
    readIndicator("moneda_clp.json"),
    readIndicator("moneda_uyu.json"),
    readIndicator("moneda_pen.json"),
    readIndicator("moneda_cop.json"),
    readIndicator("moneda_pyg.json"),
    readIndicator("moneda_mxn.json"),
    getLastUpdated(),
  ]);

  const [
    inflacionSeries,
    dolarOficialSeries,
    dolarBlueSeries,
    dolarMepSeries,
    dolarCclSeries,
    dolarMayoristaSeries,
    dolarCriptoSeries,
    dolarTarjetaSeries,
    euroSeries,
    dolarOficialDiario,
    monedaBrlMensual,
    monedaClpMensual,
    monedaUyuMensual,
    monedaPenMensual,
    monedaCopMensual,
    monedaPygMensual,
    monedaMxnMensual,
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
    readSeries("dolar_mep_mensual.json"),
    readSeries("dolar_ccl_mensual.json"),
    readSeries("dolar_mayorista_mensual.json"),
    readSeries("dolar_cripto_mensual.json"),
    readSeries("dolar_tarjeta_mensual.json"),
    readSeries("euro_mensual.json"),
    readSeries("dolar_oficial_diario.json"),
    readSeries("moneda_brl_mensual.json"),
    readSeries("moneda_clp_mensual.json"),
    readSeries("moneda_uyu_mensual.json"),
    readSeries("moneda_pen_mensual.json"),
    readSeries("moneda_cop_mensual.json"),
    readSeries("moneda_pyg_mensual.json"),
    readSeries("moneda_mxn_mensual.json"),
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
      dolares={{
        oficial: dolarOficial,
        mayorista: dolarMayorista,
        mep: dolarMep,
        blue: dolarBlue,
        ccl: dolarCcl,
        cripto: dolarCripto,
        tarjeta: dolarTarjeta,
      }}
      monedasLatam={{
        brl: monedaBrl,
        clp: monedaClp,
        uyu: monedaUyu,
        pen: monedaPen,
        cop: monedaCop,
        pyg: monedaPyg,
        mxn: monedaMxn,
      }}
      empleo={empleo}
      pobreza={pobreza}
      lastUpdated={lastUpdated ?? undefined}
      series={{
        inflacion: tail(inflacionSeries),
        dolarOficial: tail(dolarOficialSeries),
        dolarBlue: tail(dolarBlueSeries),
        dolarMep: tail(dolarMepSeries),
        dolarCcl: tail(dolarCclSeries),
        dolarMayorista: tail(dolarMayoristaSeries),
        dolarCripto: tail(dolarCriptoSeries),
        dolarTarjeta: tail(dolarTarjetaSeries),
        euro: tail(euroSeries),
        ripte: tail(ripteSeries),
        salarioReal: tail(salarioRealSeries),
        emae: tail(emaeSeries),
        pbi: pbiSeries.slice(-20),
        desocupacion: desocupacionSeries.slice(-20),
        empleo: empleoSeries.slice(-20),
        pobreza: pobrezaSeries,
        indigencia: indigenciaSeries.slice(-60),
        // For MultiCurrencyChart — long histories used as-is
        comparativaMonedas: {
          ars: dolarOficialDiario,
          brl: monedaBrlMensual,
          clp: monedaClpMensual,
          uyu: monedaUyuMensual,
          pen: monedaPenMensual,
          cop: monedaCopMensual,
          pyg: monedaPygMensual,
          mxn: monedaMxnMensual,
        },
      }}
    />
  );
}
