import { readSeries } from "@/lib/readData";
import { DetailPage } from "@/components/DetailPage";

export default async function EmpleoDetalle() {
  const [desocupacion, empleo] = await Promise.all([
    readSeries("tasa_desocupacion.json"),
    readSeries("tasa_empleo.json"),
  ]);

  return (
    <DetailPage
      eyebrow="Mercado laboral"
      title="Empleo"
      subtitle="Tasas de desocupación y empleo trimestrales de la Encuesta Permanente de Hogares (EPH)."
      charts={[
        { data: desocupacion, label: "Tasa de desocupación (%)", color: "var(--chart-4)", format: "percent" },
        { data: empleo, label: "Tasa de empleo (%)", color: "var(--chart-2)", format: "percent" },
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
