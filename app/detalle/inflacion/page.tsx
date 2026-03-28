import { readSeries } from "@/lib/readData";
import { DetailPage } from "@/components/DetailPage";

export default async function InflacionDetalle() {
  const [mensual, empalmada] = await Promise.all([
    readSeries("inflacion_mensual.json"),
    readSeries("inflacion_empalmada.json"),
  ]);

  return (
    <DetailPage
      eyebrow="Precios"
      title="Inflacion"
      subtitle="Indice de Precios al Consumidor (IPC). Variacion porcentual mensual, serie empalmada historica."
      charts={[
        { data: mensual.slice(-60), label: "IPC mensual (%)", color: "var(--color-danger)", format: "percent" },
        { data: empalmada.slice(-120), label: "Serie empalmada (%)", color: "var(--color-primary)", format: "percent" },
      ]}
      tables={[
        { title: "Inflacion mensual", data: mensual, valueLabel: "%", format: "percent" },
        { title: "Serie empalmada", data: empalmada, valueLabel: "%", format: "percent" },
      ]}
      notes="El IPC mensual refleja la variacion del Indice de Precios al Consumidor publicado por INDEC. La serie empalmada combina distintos periodos base mediante el metodo de empalme por ratio."
      source="INDEC via datos.gob.ar"
      frequency="Mensual"
    />
  );
}
