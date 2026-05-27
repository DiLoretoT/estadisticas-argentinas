import { readSeries } from "@/lib/readData";
import { loadEvents, filterEventsForSeries } from "@/lib/events";
import { DetailPage } from "@/components/DetailPage";
import { detalleMetadata } from "@/lib/detalleSeo";

export const revalidate = 1800;

export const metadata = detalleMetadata("actividad");

export default async function ActividadDetalle() {
  const [emae, pbi, events] = await Promise.all([
    readSeries("emae_mensual.json"),
    readSeries("pbi_trimestral.json"),
    loadEvents(),
  ]);

  const emaeEvents = filterEventsForSeries(events, "emae", emae);
  const pbiEvents = filterEventsForSeries(events, "pbi", pbi);

  return (
    <DetailPage
      slug="actividad"
      eyebrow="Producción"
      title="Actividad económica"
      subtitle="Estimador Mensual de Actividad Económica (EMAE) y Producto Bruto Interno (PBI)."
      charts={[
        {
          data: emae,
          label: "EMAE mensual — índice base 2004=100",
          color: "var(--chart-2)",
          format: "decimal",
          events: emaeEvents,
          csvFilename: "emae_mensual_argentina",
        },
        {
          data: pbi,
          label: "PBI trimestral (mill. $ constantes)",
          color: "var(--chart-6)",
          format: "index",
          events: pbiEvents,
          csvFilename: "pbi_trimestral_argentina",
        },
      ]}
      tables={[
        { title: "EMAE mensual", data: emae, valueLabel: "Índice", format: "decimal" },
        { title: "PBI trimestral", data: pbi, valueLabel: "Mill. $", format: "index" },
      ]}
      notes="El EMAE resume la actividad económica mensual con base 2004=100. El PBI trimestral se publica en millones de pesos a precios constantes (base 2004). Los marcadores señalan eventos económicos que impactaron la actividad — pasale el mouse para detalle."
      source="INDEC · SSPM vía datos.gob.ar"
      frequency="EMAE mensual · PBI trimestral"
    />
  );
}
