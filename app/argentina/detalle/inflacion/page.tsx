import { readSeries } from "@/lib/readData";
import { DetailPage } from "@/components/DetailPage";

export default async function InflacionDetalle() {
  const mensual = await readSeries("inflacion_mensual.json");

  return (
    <DetailPage
      eyebrow="Precios"
      title="Inflación"
      subtitle="Índice de Precios al Consumidor (IPC). Variación porcentual mensual desde 2016."
      charts={[
        {
          data: mensual,
          label: "IPC — variación mensual (%)",
          color: "var(--chart-1)",
          format: "percent",
        },
      ]}
      tables={[
        {
          title: "Inflación mensual",
          data: mensual,
          valueLabel: "%",
          format: "percent",
        },
      ]}
      notes="Serie INDEC desde mayo 2016 (base IPC Nacional). El empalme con la serie histórica del IPC GBA (1943–2016) se incorporará próximamente; por la fragmentación metodológica entre regímenes (IPC-GBA, IPC-CABA con cobertura 2014–2017 y IPC Nacional desde 2016) requiere un proceso de empalme cuidadoso."
      source="INDEC vía datos.gob.ar"
      frequency="Mensual"
    />
  );
}
