import { readSeries } from "@/lib/readData";
import { DetailPage } from "@/components/DetailPage";

export default async function SalariosDetalle() {
  const [ripteMensual, ripteNivel] = await Promise.all([
    readSeries("ripte_mensual.json"),
    readSeries("ripte_nivel.json"),
  ]);

  return (
    <DetailPage
      eyebrow="Ingresos"
      title="Salarios"
      subtitle="RIPTE (Remuneracion Imponible Promedio de los Trabajadores Estables) e indices salariales."
      charts={[
        { data: ripteMensual, label: "RIPTE var. mensual (%)", color: "#8b5cf6", format: "percent" },
        { data: ripteNivel, label: "RIPTE nivel", color: "var(--color-accent)", format: "index" },
      ]}
      tables={[
        { title: "RIPTE variacion mensual", data: ripteMensual, valueLabel: "%", format: "percent" },
        { title: "RIPTE nivel", data: ripteNivel, valueLabel: "Indice", format: "index" },
      ]}
      notes="El RIPTE mide la remuneracion promedio sujeta a aportes de los trabajadores en relacion de dependencia registrados."
      source="INDEC / SSPM via datos.gob.ar"
      frequency="Mensual"
    />
  );
}
