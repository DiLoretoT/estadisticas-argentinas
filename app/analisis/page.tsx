import Link from "next/link";
import { readSeries } from "@/lib/readData";
import { getSeriesById } from "@/lib/seriesCatalog";
import { CrossAnalysisClient } from "@/components/CrossAnalysisClient";
import { Footer } from "@/components/Footer";
import type { Metadata } from "next";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Análisis cruzado",
  description:
    "Compará cualquier par de indicadores económicos argentinos. Scatter plot con correlación, R² y regresión lineal sobre 50+ series.",
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

  const [xData, yData] = await Promise.all([
    readSeries(xMeta.file),
    readSeries(yMeta.file),
  ]);

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
            Elegí dos indicadores cualesquiera del catálogo y mirá cómo se
            relacionan. Calculamos la correlación, R² y la regresión lineal
            sobre los períodos en que ambas series tienen datos en común.
          </p>
        </div>

        <CrossAnalysisClient
          xId={xId}
          yId={yId}
          xData={xData}
          yData={yData}
        />
      </div>

      <Footer />
    </>
  );
}
