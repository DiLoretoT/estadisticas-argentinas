import { readSeries } from "@/lib/readData";
import { DetailPage } from "@/components/DetailPage";

export default async function DolarDetalle() {
  const [oficialMensual, oficialDiario, blueMensual, blueDiario] =
    await Promise.all([
      readSeries("dolar_oficial_mensual.json"),
      readSeries("dolar_oficial_diario.json"),
      readSeries("dolar_blue_mensual.json"),
      readSeries("dolar_blue_diario.json"),
    ]);

  return (
    <DetailPage
      eyebrow="Tipo de cambio"
      title="Dólar"
      subtitle="Cotización del dólar oficial (BCRA) y dólar blue. Series diarias y mensuales."
      charts={[
        {
          data: oficialDiario,
          label: "Oficial diario",
          color: "var(--chart-6)",
          format: "peso",
        },
        {
          data: blueDiario,
          label: "Blue diario",
          color: "var(--chart-3)",
          format: "peso",
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
      ]}
      notes="El dólar oficial corresponde al tipo de cambio minorista de referencia del BCRA. El dólar blue proviene de fuentes no oficiales que recopilan cotizaciones del mercado paralelo. Próximamente: MEP, CCL, tarjeta y brecha cambiaria."
      source="BCRA · argentinadatos.com"
      frequency="Diaria y mensual"
    />
  );
}
