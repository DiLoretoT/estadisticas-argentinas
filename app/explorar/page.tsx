import Link from "next/link";
import { readSeries } from "@/lib/readData";
import { getSeriesById, SERIES_CATALOG } from "@/lib/seriesCatalog";
import { ExplorerClient } from "@/components/ExplorerClient";
import { Footer } from "@/components/Footer";
import type { Metadata } from "next";
import type { PeriodPreset } from "@/lib/explorer";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Explorar series",
  description:
    "Explorá hasta 6 indicadores económicos argentinos juntos. Doble eje Y, filtros de período, URL compartible. Más de 40 series disponibles.",
  alternates: { canonical: "/explorar" },
};

const DEFAULT_SERIES = ["ipc_mensual", "dolar_oficial_mensual"];
const VALID_PERIODS: PeriodPreset[] = [
  "all",
  "10y",
  "5y",
  "3y",
  "1y",
  "6m",
  "custom",
];
const MAX_SERIES = 6;

interface SearchParams {
  series?: string;
  y2?: string;
  period?: string;
  from?: string;
  to?: string;
}

export default async function ExplorarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  // Parse selected series IDs (whitelist contra catálogo + dedup + max 6)
  const rawIds = params.series ? params.series.split(",") : DEFAULT_SERIES;
  const seen = new Set<string>();
  const selectedIds: string[] = [];
  for (const id of rawIds) {
    if (!seen.has(id) && getSeriesById(id) && selectedIds.length < MAX_SERIES) {
      seen.add(id);
      selectedIds.push(id);
    }
  }
  if (selectedIds.length === 0) selectedIds.push(...DEFAULT_SERIES);

  // Parse y2 ids (también whitelist)
  const y2Ids = params.y2
    ? params.y2.split(",").filter((id) => selectedIds.includes(id))
    : [];

  // Parse period
  const period: PeriodPreset = VALID_PERIODS.includes(params.period as PeriodPreset)
    ? (params.period as PeriodPreset)
    : "5y";

  // Parse custom dates (formato ISO YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const customFrom =
    period === "custom" && params.from && dateRegex.test(params.from)
      ? params.from
      : undefined;
  const customTo =
    period === "custom" && params.to && dateRegex.test(params.to)
      ? params.to
      : undefined;

  // Cargar las series seleccionadas en paralelo
  const seriesEntries = selectedIds
    .map((id) => getSeriesById(id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const loaded = await Promise.all(
    seriesEntries.map(async (s) => ({
      id: s.id,
      data: await readSeries(s.file).catch(() => [] as [string, number][]),
    })),
  );

  return (
    <>
      <div
        className="mx-auto max-w-6xl px-5"
        style={{
          paddingTop: "calc(var(--navbar-h) + 3rem)",
          paddingBottom: "4rem",
        }}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium mb-6"
          style={{ color: "var(--color-text-muted)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Volver
        </Link>

        <div className="mb-10">
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em] mb-2"
            style={{ color: "var(--color-primary)" }}
          >
            Herramienta
          </p>
          <h1
            className="text-3xl md:text-4xl font-bold"
            style={{ color: "var(--color-text)" }}
          >
            Explorar series
          </h1>
          <p
            className="mt-3 text-base max-w-2xl"
            style={{ color: "var(--color-text-muted)" }}
          >
            Compará hasta 6 indicadores en un mismo eje temporal. Cada serie puede
            ir en el eje Y izquierdo o derecho — útil cuando comparás cosas con
            escalas muy distintas (ej. inflación en % y dólar en pesos). La
            configuración queda en la URL para que puedas compartir el link.
          </p>
        </div>

        <ExplorerClient
          loadedSeries={loaded}
          initial={{
            selectedIds,
            y2Ids,
            period,
            customFrom,
            customTo,
          }}
        />

        {/* Ejemplos sugeridos */}
        <div
          className="rounded-xl border p-5 mt-10"
          style={{
            background: "var(--color-bg-alt)",
            borderColor: "var(--color-border)",
          }}
        >
          <h3
            className="text-sm font-semibold mb-3"
            style={{ color: "var(--color-text)" }}
          >
            Vistas sugeridas
          </h3>
          <div className="grid md:grid-cols-2 gap-2 text-sm">
            {EXAMPLES.map((ex) => (
              <Link
                key={ex.title}
                href={`/explorar?${ex.params}`}
                className="block px-3 py-2 rounded-lg transition-colors duration-150 border"
                style={{
                  borderColor: "var(--color-border)",
                  background: "var(--color-card)",
                  color: "var(--color-text)",
                }}
              >
                <span className="font-semibold">{ex.title}</span>
                <span
                  className="block text-xs mt-0.5"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {ex.description}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

const EXAMPLES: { title: string; description: string; params: string }[] = [
  {
    title: "Inflación + Dólar (último año)",
    description: "Ver el pass-through cambiario con eje dual.",
    params: "series=ipc_mensual,dolar_oficial_mensual&y2=dolar_oficial_mensual&period=1y",
  },
  {
    title: "Reservas + Riesgo país",
    description: "Cómo se mueve el spread soberano vs el stock de reservas.",
    params: "series=reservas_bcra,riesgo_pais&y2=riesgo_pais&period=3y",
  },
  {
    title: "TPM + Inflación + Plazo Fijo",
    description: "Política monetaria en una sola vista.",
    params: "series=tpm,ipc_mensual,plazo_fijo_30d&period=3y",
  },
  {
    title: "Salario real + Pobreza",
    description: "La conexión clave del bienestar argentino.",
    params: "series=ripte_nivel,tasa_pobreza&y2=tasa_pobreza&period=5y",
  },
  {
    title: "Brecha cambiaria (Oficial + Blue + MEP + CCL)",
    description: "Las 4 cotizaciones en un solo gráfico.",
    params: "series=dolar_oficial_mensual,dolar_blue_mensual,dolar_mep_mensual,dolar_ccl_mensual&period=3y",
  },
  {
    title: "Merval + Riesgo país + GGAL ADR",
    description: "Mercado de capitales argentino completo.",
    params: "series=merval,riesgo_pais,adr_ggal&y2=adr_ggal&period=3y",
  },
];
