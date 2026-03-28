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
      subtitle="Tasas de desocupacion y empleo trimestrales de la Encuesta Permanente de Hogares (EPH)."
      charts={[
        { data: desocupacion, label: "Tasa de desocupacion (%)", color: "var(--color-warning)", format: "percent" },
        { data: empleo, label: "Tasa de empleo (%)", color: "var(--color-success)", format: "percent" },
      ]}
      tables={[
        { title: "Desocupacion trimestral", data: desocupacion, valueLabel: "%", format: "percent" },
        { title: "Empleo trimestral", data: empleo, valueLabel: "%", format: "percent" },
      ]}
      notes="La tasa de desocupacion mide el porcentaje de la poblacion economicamente activa que no tiene empleo y lo busca. La tasa de empleo expresa el cociente entre la poblacion ocupada y la poblacion total."
      source="INDEC — EPH via datos.gob.ar"
      frequency="Trimestral"
    />
  );
}
