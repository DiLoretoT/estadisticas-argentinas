import { readSeries } from "@/lib/readData";
import { loadEvents, filterEventsForSeries } from "@/lib/events";
import { DetailPage } from "@/components/DetailPage";
import { detalleMetadata } from "@/lib/detalleSeo";

export const metadata = detalleMetadata("dolar");

/** Compute brecha cambiaria entre dos series de cierre mensual: (alt/oficial - 1) * 100 (%) */
function computeBrecha(
  oficial: [string, number][],
  alt: [string, number][],
): [string, number][] {
  const oficialMap = new Map(oficial);
  const out: [string, number][] = [];
  for (const [date, altValue] of alt) {
    const oficialValue = oficialMap.get(date);
    if (!oficialValue || oficialValue === 0) continue;
    const gap = (altValue / oficialValue - 1) * 100;
    out.push([date, gap]);
  }
  return out;
}

export const revalidate = 1800;

export default async function DolarDetalle() {
  const [
    oficialMensual,
    oficialDiario,
    blueMensual,
    blueDiario,
    mepMensual,
    mepDiario,
    cclMensual,
    cclDiario,
    mayoristaDiario,
    criptoDiario,
    tarjetaDiario,
    events,
  ] = await Promise.all([
    readSeries("dolar_oficial_mensual.json"),
    readSeries("dolar_oficial_diario.json"),
    readSeries("dolar_blue_mensual.json"),
    readSeries("dolar_blue_diario.json"),
    readSeries("dolar_mep_mensual.json"),
    readSeries("dolar_mep_diario.json"),
    readSeries("dolar_ccl_mensual.json"),
    readSeries("dolar_ccl_diario.json"),
    readSeries("dolar_mayorista_diario.json"),
    readSeries("dolar_cripto_diario.json"),
    readSeries("dolar_tarjeta_diario.json"),
    loadEvents(),
  ]);

  const brechaBlue = computeBrecha(oficialMensual, blueMensual);
  const brechaMep = computeBrecha(oficialMensual, mepMensual);
  const brechaCcl = computeBrecha(oficialMensual, cclMensual);

  const dolarEvents = filterEventsForSeries(events, "dolar_oficial", oficialDiario);
  const brechaEvents = filterEventsForSeries(events, "dolar_blue", brechaBlue);

  return (
    <DetailPage
      slug="dolar"
      eyebrow="Tipo de cambio"
      title="Dólar"
      subtitle="Las 7 cotizaciones del peso argentino contra el USD + brecha cambiaria desagregada."
      charts={[
        {
          data: oficialDiario,
          label: "Oficial (BCRA) — diario",
          color: "var(--chart-6)",
          format: "peso",
          events: dolarEvents,
          csvFilename: "dolar_oficial_diario_argentina",
        },
        {
          data: mayoristaDiario,
          label: "Mayorista — diario",
          color: "var(--chart-6)",
          format: "peso",
          events: dolarEvents,
          csvFilename: "dolar_mayorista_diario_argentina",
        },
        {
          data: mepDiario,
          label: "MEP (bolsa) — diario",
          color: "var(--chart-3)",
          format: "peso",
          events: dolarEvents,
          csvFilename: "dolar_mep_diario_argentina",
        },
        {
          data: cclDiario,
          label: "CCL (contado con liqui) — diario",
          color: "var(--chart-3)",
          format: "peso",
          events: dolarEvents,
          csvFilename: "dolar_ccl_diario_argentina",
        },
        {
          data: blueDiario,
          label: "Blue (paralelo) — diario",
          color: "var(--chart-3)",
          format: "peso",
          events: dolarEvents,
          csvFilename: "dolar_blue_diario_argentina",
        },
        {
          data: criptoDiario,
          label: "Cripto — diario",
          color: "var(--chart-8)",
          format: "peso",
          csvFilename: "dolar_cripto_diario_argentina",
        },
        {
          data: tarjetaDiario,
          label: "Tarjeta / turista — diario",
          color: "var(--chart-7)",
          format: "peso",
          csvFilename: "dolar_tarjeta_diario_argentina",
        },
        {
          data: brechaBlue,
          label: "Brecha BLUE vs oficial (%)",
          color: "var(--chart-3)",
          format: "decimal",
          events: brechaEvents,
          csvFilename: "brecha_blue_vs_oficial",
        },
        {
          data: brechaMep,
          label: "Brecha MEP vs oficial (%)",
          color: "var(--chart-3)",
          format: "decimal",
          events: brechaEvents,
          csvFilename: "brecha_mep_vs_oficial",
        },
        {
          data: brechaCcl,
          label: "Brecha CCL vs oficial (%)",
          color: "var(--chart-3)",
          format: "decimal",
          events: brechaEvents,
          csvFilename: "brecha_ccl_vs_oficial",
        },
      ]}
      tables={[
        {
          title: "Oficial mensual",
          data: oficialMensual,
          valueLabel: "$",
          format: "peso",
        },
        {
          title: "Blue mensual",
          data: blueMensual,
          valueLabel: "$",
          format: "peso",
        },
        {
          title: "MEP mensual",
          data: mepMensual,
          valueLabel: "$",
          format: "peso",
        },
        {
          title: "CCL mensual",
          data: cclMensual,
          valueLabel: "$",
          format: "peso",
        },
      ]}
      notes="El dólar oficial es el tipo de cambio minorista de referencia del BCRA. El mayorista lo usan bancos y empresas. MEP (bolsa) y CCL (contado con liqui) son operaciones legales vía mercado de capitales para acceder a divisas. Blue es el mercado paralelo no oficial. Tarjeta incluye impuesto país + percepciones. Cripto vía exchanges. La brecha cambiaria mide la diferencia entre cada tipo y el oficial: brecha alta = controles cambiarios estrictos o desconfianza. Los marcadores en los gráficos señalan eventos macro — pasale el mouse para ver el detalle."
      source="BCRA · argentinadatos.com"
      frequency="Diaria y mensual"
    />
  );
}
