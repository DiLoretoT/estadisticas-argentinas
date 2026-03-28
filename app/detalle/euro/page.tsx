import { readSeries } from "@/lib/readData";
import { DetailPage } from "@/components/DetailPage";

export default async function EuroDetalle() {
  const [euroDiario, euroMensual] = await Promise.all([
    readSeries("euro_diario.json"),
    readSeries("euro_mensual.json"),
  ]);

  return (
    <DetailPage
      eyebrow="Tipo de cambio"
      title="Euro"
      subtitle="Cotizacion del euro publicada por el BCRA. Series diarias y mensuales."
      charts={[
        { data: euroDiario, label: "Euro diario", color: "#6366f1", format: "peso" },
        { data: euroMensual, label: "Euro mensual", color: "#8b5cf6", format: "peso" },
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
