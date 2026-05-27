import Link from "next/link";
import { readSeries } from "@/lib/readData";
import { getSeriesById } from "@/lib/seriesCatalog";
import { COMPARATIVAS } from "@/lib/comparativas";
import { CrossAnalysisClient } from "@/components/CrossAnalysisClient";
import { ComparativasDestacadas } from "@/components/ComparativasDestacadas";
import { FinanzasCTA } from "@/components/FinanzasCTA";
import { Footer } from "@/components/Footer";
import type { Metadata } from "next";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Análisis cruzado",
  description:
    "Compará cualquier par de indicadores económicos argentinos. Scatter plot con correlación, R² y regresión lineal sobre 50+ series.",
  alternates: { canonical: "/analisis" },
};

const DEFAULT_X = "dolar_oficial_mensual";
const DEFAULT_Y = "ipc_mensual";

interface SearchParams {
  x?: string;
  y?: string;
}

export default async function AnalisisPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const xId = params.x && getSeriesById(params.x) ? params.x : DEFAULT_X;
  const yId =
    params.y && getSeriesById(params.y) && params.y !== xId
      ? params.y
      : xId === DEFAULT_Y
        ? DEFAULT_X
        : DEFAULT_Y;

  const xMeta = getSeriesById(xId)!;
  const yMeta = getSeriesById(yId)!;

  // Para el análisis cruzado custom
  const [xData, yData] = await Promise.all([
    readSeries(xMeta.file),
    readSeries(yMeta.file),
  ]);

  // Para las comparativas destacadas pre-armadas: cargamos en paralelo TODAS
  // las series únicas que aparecen en COMPARATIVAS, una sola vez por serie.
  const requiredIds = new Set<string>();
  for (const c of COMPARATIVAS) {
    requiredIds.add(c.xId);
    requiredIds.add(c.yId);
  }
  const seriesEntries = Array.from(requiredIds)
    .map((id) => getSeriesById(id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const loaded = await Promise.all(
    seriesEntries.map(async (s) => {
      const data = await readSeries(s.file).catch(() => []);
      return [s.id, data] as const;
    }),
  );
  const seriesData = new Map<string, [string, number][]>(loaded);

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
            Análisis cruzado
          </h1>
          <p
            className="mt-3 text-base max-w-2xl"
            style={{ color: "var(--color-text-muted)" }}
          >
            Compará dos indicadores cualesquiera con correlación + R² +
            regresión. Más abajo hay comparativas <strong>pre-curadas</strong>{" "}
            con el coeficiente estadístico correcto para cada caso.
          </p>
        </div>

        {/* Comparativas destacadas pre-armadas */}
        <section className="mb-16">
          <ComparativasDestacadas seriesData={seriesData} />
        </section>

        {/* Análisis cruzado libre */}
        <section>
          <div className="mb-6">
            <h2
              className="text-2xl font-bold"
              style={{ color: "var(--color-text)" }}
            >
              Análisis libre
            </h2>
            <p
              className="mt-2 text-sm max-w-2xl"
              style={{ color: "var(--color-text-muted)" }}
            >
              Elegí cualquier par de series para crear tu propia comparativa.
              Usa Pearson por simplicidad — los coeficientes específicos por
              caso están en las comparativas pre-curadas arriba.
            </p>
          </div>
          <CrossAnalysisClient
            xId={xId}
            yId={yId}
            xData={xData}
            yData={yData}
          />
        </section>

        <FinanzasCTA variant="inline" />
      </div>

      <Footer />
    </>
  );
}
