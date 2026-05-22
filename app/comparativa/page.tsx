import Link from "next/link";
import { fetchDataJson } from "@/lib/cdn";
import { LatamRanking } from "@/components/LatamRanking";
import { Footer } from "@/components/Footer";
import type { Metadata } from "next";
import { promises as fs } from "fs";
import path from "path";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Comparativa LATAM",
  description:
    "Argentina vs LATAM en 9 indicadores comparables: PBI per cápita, inflación, desempleo, pobreza, Gini, deuda externa, esperanza de vida, exportaciones, urbanización. Datos del Banco Mundial.",
};

interface SnapshotRow {
  iso3: string;
  country: string;
  year: string | null;
  value: number | null;
}

interface IndicatorRow {
  key: string;
  display_name: string;
  unit: string;
  higher_is_better: boolean;
  snapshot: SnapshotRow[];
}

interface ComparativaSummary {
  updated_at: string;
  countries: string[];
  indicators: IndicatorRow[];
  source: { name: string; official: boolean };
}

async function loadSummary(): Promise<ComparativaSummary | null> {
  if (process.env.NODE_ENV === "development") {
    try {
      const p = path.join(
        process.cwd(),
        "data",
        "comparativa_latam_summary.json",
      );
      const content = await fs.readFile(p, "utf-8");
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
  return fetchDataJson<ComparativaSummary>(
    "comparativa_latam_summary.json",
    1800,
  );
}

export default async function ComparativaPage() {
  const summary = await loadSummary();

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
            LATAM
          </p>
          <h1
            className="text-3xl md:text-4xl font-bold"
            style={{ color: "var(--color-text)" }}
          >
            Argentina en contexto LATAM
          </h1>
          <p
            className="mt-3 text-base max-w-2xl"
            style={{ color: "var(--color-text-muted)" }}
          >
            9 indicadores comparables entre Argentina y 9 países vecinos.
            Datos del Banco Mundial — World Development Indicators. Argentina
            aparece destacada en cada ranking para que la encuentres rápido.
          </p>
        </div>

        {!summary || summary.indicators.length === 0 ? (
          <div
            className="rounded-xl border p-8 text-center"
            style={{
              background: "var(--color-card)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-muted)",
            }}
          >
            Cargando datos del Banco Mundial...
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-5 mb-8">
              {summary.indicators.map((ind) => (
                <LatamRanking key={ind.key} indicator={ind} />
              ))}
            </div>

            <div
              className="rounded-xl border p-5 mt-8"
              style={{
                background: "var(--color-bg-alt)",
                borderColor: "var(--color-border)",
              }}
            >
              <h3
                className="text-sm font-semibold mb-2"
                style={{ color: "var(--color-text)" }}
              >
                Notas
              </h3>
              <ul
                className="text-xs space-y-1.5 leading-relaxed"
                style={{ color: "var(--color-text-muted)" }}
              >
                <li>
                  Los rankings muestran el último año disponible por país. Algunos
                  países tienen rezago en publicación, especialmente para
                  indicadores sociales (Gini, pobreza) que se reportan con 1-2
                  años de demora.
                </li>
                <li>
                  Para inflación: el Banco Mundial usa CPI anual promedio. Para
                  países con alta inflación como Argentina, el valor anual puede
                  diferir del "punta a punta" diciembre/diciembre que usamos
                  internamente.
                </li>
                <li>
                  Argentina aparece en color terracotta y resaltada en cada
                  ranking para facilitar la lectura.
                </li>
                <li>
                  Datos del Banco Mundial — actualizados al{" "}
                  {summary.updated_at}.
                </li>
              </ul>
            </div>
          </>
        )}
      </div>

      <Footer />
    </>
  );
}
