import { readSeries } from "@/lib/readData";
import { loadEvents, filterEventsForSeries } from "@/lib/events";
import { DetailPage } from "@/components/DetailPage";

/** Compute brecha cambiaria mensual: (blue/oficial - 1) * 100 (%) */
function computeBrecha(
  oficial: [string, number][],
  blue: [string, number][],
): [string, number][] {
  const oficialMap = new Map(oficial);
  const out: [string, number][] = [];
  for (const [date, blueValue] of blue) {
    const oficialValue = oficialMap.get(date);
    if (!oficialValue || oficialValue === 0) continue;
    const gap = (blueValue / oficialValue - 1) * 100;
    out.push([date, gap]);
  }
  return out;
}

export const revalidate = 1800;

export default async function DolarDetalle() {
  const [oficialMensual, oficialDiario, blueMensual, blueDiario, events] =
    await Promise.all([
      readSeries("dolar_oficial_mensual.json"),
      readSeries("dolar_oficial_diario.json"),
      readSeries("dolar_blue_mensual.json"),
      readSeries("dolar_blue_diario.json"),
      loadEvents(),
    ]);

  const brechaMensual = computeBrecha(oficialMensual, blueMensual);

  const dolarEvents = filterEventsForSeries(events, "dolar_oficial", oficialDiario);
  const brechaEvents = filterEventsForSeries(events, "dolar_blue", brechaMensual);

  return (
    <DetailPage
      eyebrow="Tipo de cambio"
      title="Dólar"
      subtitle="Cotización del dólar oficial (BCRA) y dólar blue, con cálculo de brecha cambiaria."
      charts={[
        {
          data: oficialDiario,
          label: "Oficial diario ($)",
          color: "var(--chart-6)",
          format: "peso",
          events: dolarEvents,
          csvFilename: "dolar_oficial_diario_argentina",
        },
        {
          data: blueDiario,
          label: "Blue diario ($)",
          color: "var(--chart-3)",
          format: "peso",
          events: dolarEvents,
          csvFilename: "dolar_blue_diario_argentina",
        },
        {
          data: brechaMensual,
          label: "Brecha cambiaria (% blue vs oficial)",
          color: "var(--chart-7)",
          format: "decimal",
          events: brechaEvents,
          csvFilename: "brecha_cambiaria_mensual_argentina",
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
          title: "Brecha cambiaria mensual",
          data: brechaMensual,
          valueLabel: "%",
          format: "decimal",
        },
      ]}
      notes="El dólar oficial es el tipo de cambio minorista de referencia del BCRA. El blue proviene de fuentes no oficiales del mercado paralelo. La brecha cambiaria mide la diferencia porcentual entre blue y oficial: una brecha alta refleja desconfianza en el peso o controles cambiarios estrictos. Los marcadores señalan eventos macro relevantes — pasale el mouse para ver el detalle. Próximamente: MEP, CCL y dólar tarjeta."
      source="BCRA · argentinadatos.com"
      frequency="Diaria y mensual"
    />
  );
}
