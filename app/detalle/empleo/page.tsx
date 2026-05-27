import { readSeries } from "@/lib/readData";
import { loadEvents, filterEventsForSeries } from "@/lib/events";
import { DetailPage } from "@/components/DetailPage";
import { detalleMetadata, rangeOf } from "@/lib/detalleSeo";

export const revalidate = 1800;

export const metadata = detalleMetadata("empleo");

export default async function EmpleoDetalle() {
  const [desocupacion, empleo, events] = await Promise.all([
    readSeries("tasa_desocupacion.json"),
    readSeries("tasa_empleo.json"),
    loadEvents(),
  ]);

  const empleoEvents = filterEventsForSeries(events, "empleo", desocupacion);

  return (
    <DetailPage
      slug="empleo"
      datasetRange={rangeOf(desocupacion)}
      eyebrow="Mercado laboral"
      title="Empleo"
      subtitle="Tasas de desocupación y empleo trimestrales de la Encuesta Permanente de Hogares (EPH)."
      charts={[
        {
          data: desocupacion,
          label: "Tasa de desocupación (%)",
          color: "var(--chart-4)",
          format: "percent",
          events: empleoEvents,
          csvFilename: "tasa_desocupacion_argentina",
        },
        {
          data: empleo,
          label: "Tasa de empleo (%)",
          color: "var(--chart-2)",
          format: "percent",
          events: empleoEvents,
          csvFilename: "tasa_empleo_argentina",
        },
      ]}
      tables={[
        { title: "Desocupación trimestral", data: desocupacion, valueLabel: "%", format: "percent" },
        { title: "Empleo trimestral", data: empleo, valueLabel: "%", format: "percent" },
      ]}
      notes="La tasa de desocupación mide el porcentaje de la población económicamente activa que no tiene empleo y lo busca. La tasa de empleo expresa el cociente entre la población ocupada y la población total. Próximamente: desagregación por género, edad y región."
      source="INDEC — EPH vía datos.gob.ar"
      frequency="Trimestral"
    />
  );
}
