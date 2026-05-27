import { readSeries } from "@/lib/readData";
import { DetailPage } from "@/components/DetailPage";
import { detalleMetadata, rangeOf } from "@/lib/detalleSeo";

export const revalidate = 1800;

export const metadata = detalleMetadata("euro");

export default async function EuroDetalle() {
  const [euroDiario, euroMensual] = await Promise.all([
    readSeries("euro_diario.json"),
    readSeries("euro_mensual.json"),
  ]);

  return (
    <DetailPage
      slug="euro"
      datasetRange={rangeOf(euroDiario)}
      eyebrow="Tipo de cambio"
      title="Euro"
      subtitle="Cotización del euro publicada por el BCRA. Series diarias y mensuales."
      charts={[
        { data: euroDiario, label: "Euro diario", color: "var(--chart-8)", format: "peso" },
        { data: euroMensual, label: "Euro mensual (cierre)", color: "var(--chart-6)", format: "peso" },
      ]}
      tables={[
        { title: "Euro mensual", data: euroMensual, valueLabel: "$", format: "peso" },
      ]}
      notes="El euro corresponde al tipo de cambio de referencia del BCRA para la moneda europea."
      source="BCRA"
      frequency="Diaria y mensual"
    />
  );
}
