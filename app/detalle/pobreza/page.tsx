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
      subtitle="Tasa de pobreza semestral y linea de indigencia mensual (Canasta Basica Alimentaria)."
      charts={[
        { data: pobreza, label: "Tasa de pobreza (%)", color: "var(--color-danger)", format: "percent" },
        { data: lineaIndigencia.slice(-60), label: "Linea de indigencia ($)", color: "var(--color-warning)", format: "peso" },
      ]}
      tables={[
        { title: "Pobreza semestral", data: pobreza, valueLabel: "%", format: "percent" },
        { title: "Linea de indigencia", data: lineaIndigencia, valueLabel: "$", format: "peso" },
      ]}
      notes="La tasa de pobreza indica el porcentaje de personas en hogares con ingresos por debajo de la Canasta Basica Total. La linea de indigencia refleja el valor mensual de la Canasta Basica Alimentaria para un adulto equivalente."
      source="INDEC — EPH via datos.gob.ar"
      frequency="Pobreza semestral / Indigencia mensual"
    />
  );
}
