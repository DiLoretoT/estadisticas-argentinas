import { readSeries } from "@/lib/readData";
import { DetailPage } from "@/components/DetailPage";

export default async function InflacionDetalle() {
  const [mensual, historica] = await Promise.all([
    readSeries("inflacion_mensual.json"),
    readSeries("inflacion_empalmada.json"),
  ]);

  return (
    <DetailPage
      eyebrow="Precios"
      title="Inflacion"
      subtitle="Indice de Precios al Consumidor (IPC). Variacion porcentual mensual con serie historica completa."
      charts={[
        { data: mensual, label: "IPC mensual (%)", color: "var(--color-danger)", format: "percent" },
        { data: historica, label: "Inflacion historica (%)", color: "var(--color-primary)", format: "percent" },
      ]}
      tables={[
        { title: "Inflacion mensual", data: mensual, valueLabel: "%", format: "percent" },
        { title: "Inflacion historica", data: historica, valueLabel: "%", format: "percent" },
      ]}
      notes="La serie historica combina distintos periodos base del IPC para ofrecer una vision continua de largo plazo. Datos originales de INDEC."
      source="INDEC via datos.gob.ar"
      frequency="Mensual"
    />
  );
}
