import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";
import { ArgentinaMap, type FeatureCollection } from "@/components/ArgentinaMap";
import { Footer } from "@/components/Footer";
import type { Metadata } from "next";

export const revalidate = 86400; // 24h — la data por provincia se actualiza poco

export const metadata: Metadata = {
  title: "Mapa de Argentina",
  description:
    "Argentina por provincia: población, superficie, densidad. Mapa choropleth interactivo con datos del INDEC Censo 2022.",
};

interface IndicatorMeta {
  key: string;
  label: string;
  unit: string;
  higher_is_better: boolean;
  source: string;
}

interface StatsFile {
  indicators: IndicatorMeta[];
  data: Array<{ provincia: string; [key: string]: string | number }>;
}

async function loadGeoJson(): Promise<FeatureCollection> {
  // Siempre se sirve desde public/ del propio sitio. El archivo es estático y
  // forma parte del bundle de assets, así que no usamos jsdelivr.
  const filePath = path.join(
    process.cwd(),
    "public",
    "data",
    "argentina-provincias.geojson",
  );
  const content = await fs.readFile(filePath, "utf-8");
  return JSON.parse(content) as FeatureCollection;
}

async function loadStats(): Promise<StatsFile> {
  const filePath = path.join(process.cwd(), "data", "provincias_stats.json");
  const content = await fs.readFile(filePath, "utf-8");
  return JSON.parse(content) as StatsFile;
}

export default async function MapaPage() {
  const [geojson, stats] = await Promise.all([loadGeoJson(), loadStats()]);

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

        <div className="mb-8">
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em] mb-2"
            style={{ color: "var(--color-primary)" }}
          >
            Por provincia
          </p>
          <h1
            className="text-3xl md:text-4xl font-bold"
            style={{ color: "var(--color-text)" }}
          >
            Mapa de Argentina
          </h1>
          <p
            className="mt-3 text-base max-w-2xl"
            style={{ color: "var(--color-text-muted)" }}
          >
            Indicadores demográficos por jurisdicción. Datos del INDEC Censo 2022.
            Próximamente se sumarán exportaciones provinciales, empleo registrado
            y PBG (Producto Bruto Geográfico).
          </p>
        </div>

        <ArgentinaMap
          geojson={geojson}
          data={stats.data}
          indicators={stats.indicators}
          defaultIndicator="poblacion"
        />

        <div
          className="rounded-xl border p-5 mt-8"
          style={{
            background: "var(--color-bg-alt)",
            borderColor: "var(--color-border)",
          }}
        >
          <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--color-text)" }}>
            Datos curiosos
          </h3>
          <ul
            className="text-xs space-y-1.5 leading-relaxed"
            style={{ color: "var(--color-text-muted)" }}
          >
            <li>
              <strong>Buenos Aires</strong> concentra el 38% de la población total
              del país (17.6 M de 47 M).
            </li>
            <li>
              <strong>CABA</strong> tiene la mayor densidad: 15.603 hab/km², más
              de 200 veces el promedio nacional.
            </li>
            <li>
              <strong>Tucumán</strong> es la 2da más densa (75 hab/km²) — la
              provincia más chica de Argentina continental con población alta.
            </li>
            <li>
              <strong>Santa Cruz</strong> tiene la densidad más baja: 1.37 hab/km².
              Toda la provincia tiene menos gente que San Isidro (PBA).
            </li>
            <li>
              <strong>Las 4 provincias más pobladas</strong> (BA, CABA, Córdoba,
              Santa Fe) concentran el 60% del país.
            </li>
          </ul>
        </div>

        <p className="mt-6 text-xs" style={{ color: "var(--color-text-muted)" }}>
          GeoJSON simplificado a partir de{" "}
          <a
            href="https://github.com/jazzido/Polymaps-Argentina"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            style={{ color: "var(--color-primary)" }}
          >
            jazzido/Polymaps-Argentina
          </a>
          {" "}(coordenadas redondeadas a 3 decimales, ~100m precisión).
        </p>
      </div>

      <Footer />
    </>
  );
}
