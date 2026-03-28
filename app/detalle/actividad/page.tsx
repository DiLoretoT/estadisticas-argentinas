import { readSeries } from "@/lib/readData";
import { DetailPage } from "@/components/DetailPage";

export default async function ActividadDetalle() {
  const [emae, pbi] = await Promise.all([
    readSeries("emae_mensual.json"),
    readSeries("pbi_trimestral.json"),
  ]);

  return (
    <DetailPage
      eyebrow="Produccion"
      title="Actividad economica"
      subtitle="Estimador Mensual de Actividad Economica (EMAE) y Producto Bruto Interno (PBI)."
      charts={[
        { data: emae, label: "EMAE mensual", color: "var(--color-success)", format: "decimal" },
        { data: pbi, label: "PBI trimestral", color: "var(--color-accent)", format: "index" },
      ]}
      tables={[
        { title: "EMAE mensual", data: emae, valueLabel: "Indice", format: "decimal" },
        { title: "PBI trimestral", data: pbi, valueLabel: "Mill. $", format: "index" },
      ]}
      notes="El EMAE resume la actividad economica mensual con base 2004=100. El PBI trimestral se publica en millones de pesos a precios constantes (base 2004)."
      source="INDEC / SSPM via datos.gob.ar"
      frequency="EMAE mensual / PBI trimestral"
    />
  );
}
