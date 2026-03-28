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
      title="Dolar"
      subtitle="Cotizacion del dolar oficial (BCRA) y dolar blue. Series diarias y mensuales."
      charts={[
        { data: oficialDiario.slice(-120), label: "Oficial diario", color: "var(--color-accent)", format: "peso" },
        { data: blueDiario.slice(-120), label: "Blue diario", color: "var(--color-primary)", format: "peso" },
      ]}
      tables={[
        { title: "Oficial mensual", data: oficialMensual, valueLabel: "$", format: "peso" },
        { title: "Blue mensual", data: blueMensual, valueLabel: "$", format: "peso" },
      ]}
      notes="El dolar oficial corresponde al tipo de cambio minorista de referencia del BCRA. El dolar blue proviene de fuentes no oficiales que recopilan cotizaciones del mercado paralelo."
      source="BCRA / argentinadatos.com"
      frequency="Diaria y mensual"
    />
  );
}
