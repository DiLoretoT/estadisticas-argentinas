import { readSeries } from "@/lib/readData";
import { DetailPage } from "@/components/DetailPage";

export default async function PobrezaDetalle() {
  const [pobreza, lineaIndigencia] = await Promise.all([
    readSeries("tasa_pobreza.json"),
    readSeries("linea_indigencia.json"),
  ]);

  return (
    <DetailPage
      eyebrow="Social"
      title="Pobreza e indigencia"
      subtitle="Tasa de pobreza semestral y línea de indigencia mensual (Canasta Básica Alimentaria)."
      charts={[
        { data: pobreza, label: "Tasa de pobreza (%)", color: "var(--chart-7)", format: "percent" },
        { data: lineaIndigencia.slice(-60), label: "Línea de indigencia ($ por adulto/mes)", color: "var(--chart-3)", format: "peso" },
      ]}
      tables={[
        { title: "Pobreza semestral", data: pobreza, valueLabel: "%", format: "percent" },
        { title: "Línea de indigencia", data: lineaIndigencia, valueLabel: "$", format: "peso" },
      ]}
      notes="La tasa de pobreza indica el porcentaje de personas en hogares con ingresos por debajo de la Canasta Básica Total. La línea de indigencia refleja el valor mensual de la Canasta Básica Alimentaria para un adulto equivalente. La tasa de indigencia (% personas) no se publica como serie continua en datos.gob.ar — sólo en informes PDF semestrales del INDEC."
      source="INDEC — EPH vía datos.gob.ar"
      frequency="Pobreza semestral · Indigencia mensual"
    />
  );
}
