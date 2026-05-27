import { readSeries } from "@/lib/readData";
import { loadEvents, filterEventsForSeries } from "@/lib/events";
import { computeSalarioReal } from "@/lib/salarioReal";
import { DetailPage } from "@/components/DetailPage";
import { detalleMetadata, rangeOf } from "@/lib/detalleSeo";

export const revalidate = 1800;

export const metadata = detalleMetadata("salarios");

export default async function SalariosDetalle() {
  const [ripteMensual, ripteNivel, ipcMensual, events] = await Promise.all([
    readSeries("ripte_mensual.json"),
    readSeries("ripte_nivel.json"),
    readSeries("inflacion_mensual.json"),
    loadEvents(),
  ]);

  const salarioReal = computeSalarioReal(ripteNivel, ipcMensual);
  const salarioEvents = filterEventsForSeries(events, "all", ripteNivel);

  return (
    <DetailPage
      slug="salarios"
      datasetRange={rangeOf(ripteNivel)}
      eyebrow="Ingresos"
      title="Salarios"
      subtitle="RIPTE (Remuneración Imponible Promedio de los Trabajadores Estables): nominal vs real deflactado por IPC."
      charts={[
        {
          data: salarioReal,
          label: "Salario real (RIPTE deflactado por IPC, base 100)",
          color: "var(--chart-2)",
          format: "decimal",
          events: salarioEvents,
          csvFilename: "salario_real_argentina",
        },
        {
          data: ripteNivel,
          label: "RIPTE nominal — nivel",
          color: "var(--chart-6)",
          format: "index",
          events: salarioEvents,
          csvFilename: "ripte_nivel_argentina",
        },
        {
          data: ripteMensual,
          label: "RIPTE — variación mensual (%)",
          color: "var(--chart-8)",
          format: "percent",
          csvFilename: "ripte_variacion_mensual_argentina",
        },
      ]}
      tables={[
        { title: "Salario real (deflactado por IPC)", data: salarioReal, valueLabel: "Índice", format: "decimal" },
        { title: "RIPTE nivel nominal", data: ripteNivel, valueLabel: "Índice", format: "index" },
        { title: "RIPTE variación mensual", data: ripteMensual, valueLabel: "%", format: "percent" },
      ]}
      notes="El RIPTE mide la remuneración promedio sujeta a aportes de los trabajadores en relación de dependencia registrados. El salario real es el RIPTE deflactado por el IPC (base 100 en el primer mes de superposición de ambas series): mide el poder adquisitivo real, no el monto en pesos. Una caída del salario real indica que los aumentos nominales fueron menores que la inflación."
      source="INDEC · SSPM vía datos.gob.ar"
      frequency="Mensual"
    />
  );
}
