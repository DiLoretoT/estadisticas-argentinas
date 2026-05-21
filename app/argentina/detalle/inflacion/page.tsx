import { readSeries } from "@/lib/readData";
import { loadEvents, filterEventsForSeries } from "@/lib/events";
import { DetailPage } from "@/components/DetailPage";

export default async function InflacionDetalle() {
  const [mensual, events] = await Promise.all([
    readSeries("inflacion_mensual.json"),
    loadEvents(),
  ]);

  const inflEvents = filterEventsForSeries(events, "ipc", mensual);

  return (
    <DetailPage
      eyebrow="Precios"
      title="Inflación"
      subtitle="Índice de Precios al Consumidor (IPC). Variación porcentual mensual desde 2016."
      charts={[
        {
          data: mensual,
          label: "IPC — variación mensual (%)",
          color: "var(--chart-1)",
          format: "percent",
          events: inflEvents,
          csvFilename: "inflacion_mensual_argentina",
        },
      ]}
      tables={[
        {
          title: "Inflación mensual",
          data: mensual,
          valueLabel: "%",
          format: "percent",
        },
      ]}
      notes="Serie INDEC desde mayo 2016 (base IPC Nacional). Los marcadores sobre el gráfico (líneas punteadas verticales) señalan eventos macroeconómicos relevantes — pasale el mouse para ver el detalle. El empalme con la serie histórica del IPC GBA (1943–2016) se incorporará próximamente."
      source="INDEC vía datos.gob.ar"
      frequency="Mensual"
    />
  );
}
