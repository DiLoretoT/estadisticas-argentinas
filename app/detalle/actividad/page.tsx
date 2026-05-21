import { readSeries } from "@/lib/readData";
import { DetailPage } from "@/components/DetailPage";

export default async function ActividadDetalle() {
  const [emae, pbi] = await Promise.all([
    readSeries("emae_mensual.json"),
    readSeries("pbi_trimestral.json"),
  ]);

  return (
    <DetailPage
      eyebrow="Producción"
      title="Actividad económica"
      subtitle="Estimador Mensual de Actividad Económica (EMAE) y Producto Bruto Interno (PBI)."
      charts={[
        { data: emae, label: "EMAE mensual", color: "var(--chart-2)", format: "decimal" },
        { data: pbi, label: "PBI trimestral", color: "var(--chart-6)", format: "index" },
      ]}
      tables={[
        { title: "EMAE mensual", data: emae, valueLabel: "Índice", format: "decimal" },
        { title: "PBI trimestral", data: pbi, valueLabel: "Mill. $", format: "index" },
      ]}
      notes="El EMAE resume la actividad económica mensual con base 2004=100. El PBI trimestral se publica en millones de pesos a precios constantes (base 2004)."
      source="INDEC · SSPM vía datos.gob.ar"
      frequency="EMAE mensual · PBI trimestral"
    />
  );
}
