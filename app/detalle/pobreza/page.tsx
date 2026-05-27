import { readSeries } from "@/lib/readData";
import { loadEvents, filterEventsForSeries } from "@/lib/events";
import { DetailPage } from "@/components/DetailPage";
import { detalleMetadata, rangeOf } from "@/lib/detalleSeo";

export const revalidate = 1800;

export const metadata = detalleMetadata("pobreza");

export default async function PobrezaDetalle() {
  const [pobreza, lineaIndigencia, events] = await Promise.all([
    readSeries("tasa_pobreza.json"),
    readSeries("linea_indigencia.json"),
    loadEvents(),
  ]);

  const pobrezaEvents = filterEventsForSeries(events, "pobreza", pobreza);
  const lineaShort = lineaIndigencia.slice(-60);
  const lineaEvents = filterEventsForSeries(events, "pobreza", lineaShort);

  return (
    <DetailPage
      slug="pobreza"
      datasetRange={rangeOf(pobreza)}
      eyebrow="Social"
      title="Pobreza e indigencia"
      subtitle="Tasa de pobreza semestral y línea de indigencia mensual (Canasta Básica Alimentaria)."
      charts={[
        {
          data: pobreza,
          label: "Tasa de pobreza (%)",
          color: "var(--chart-7)",
          format: "percent",
          events: pobrezaEvents,
          csvFilename: "tasa_pobreza_argentina",
        },
        {
          data: lineaShort,
          label: "Línea de indigencia ($ por adulto/mes)",
          color: "var(--chart-3)",
          format: "peso",
          events: lineaEvents,
          csvFilename: "linea_indigencia_argentina",
        },
      ]}
      tables={[
        { title: "Pobreza semestral", data: pobreza, valueLabel: "%", format: "percent" },
        { title: "Línea de indigencia", data: lineaIndigencia, valueLabel: "$", format: "peso" },
      ]}
      notes="La tasa de pobreza indica el porcentaje de personas en hogares con ingresos por debajo de la Canasta Básica Total. La línea de indigencia refleja el valor mensual de la Canasta Básica Alimentaria para un adulto equivalente. La tasa de indigencia como porcentaje de personas no se publica como serie continua en datos.gob.ar — sólo en informes PDF semestrales del INDEC."
      source="INDEC — EPH vía datos.gob.ar"
      frequency="Pobreza semestral · Indigencia mensual"
    />
  );
}
