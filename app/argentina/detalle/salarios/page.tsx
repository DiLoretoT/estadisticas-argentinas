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
      subtitle="RIPTE (Remuneración Imponible Promedio de los Trabajadores Estables) e índices salariales."
      charts={[
        { data: ripteMensual, label: "RIPTE — variación mensual (%)", color: "var(--chart-8)", format: "percent" },
        { data: ripteNivel, label: "RIPTE — nivel", color: "var(--chart-6)", format: "index" },
      ]}
      tables={[
        { title: "RIPTE variación mensual", data: ripteMensual, valueLabel: "%", format: "percent" },
        { title: "RIPTE nivel", data: ripteNivel, valueLabel: "Índice", format: "index" },
      ]}
      notes="El RIPTE mide la remuneración promedio sujeta a aportes de los trabajadores en relación de dependencia registrados. Próximamente: salario real deflactado por IPC."
      source="INDEC · SSPM vía datos.gob.ar"
      frequency="Mensual"
    />
  );
}
