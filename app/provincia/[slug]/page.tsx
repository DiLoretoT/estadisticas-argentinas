import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { ProvinciaRubrosChart } from "@/components/ProvinciaRubrosChart";
import {
  findBySlug,
  listAllSlugs,
  provinciaSlug,
  rankIn,
  type ProvinciasStatsFile,
} from "@/lib/provincias";
import type { Metadata } from "next";

export const revalidate = 3600;

async function loadStats(): Promise<ProvinciasStatsFile> {
  const filePath = path.join(process.cwd(), "data", "provincias_stats.json");
  const content = await fs.readFile(filePath, "utf-8");
  return JSON.parse(content) as ProvinciasStatsFile;
}

interface Params {
  slug: string;
}

export async function generateStaticParams(): Promise<Params[]> {
  const stats = await loadStats();
  return listAllSlugs(stats).map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const stats = await loadStats();
  const prov = findBySlug(stats, slug);
  if (!prov) return { title: "Provincia no encontrada" };
  return {
    title: `${prov.provincia}`,
    description: `Perfil económico y social de ${prov.provincia}: población, IDH, exportaciones, tipo de economía. Datos del INDEC, MECON y PNUD.`,
  };
}

// Helpers de formateo
function fmtPob(v: number): string {
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)} M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(0)} mil`;
  return v.toLocaleString("es-AR");
}

function fmtUSD(v: number): string {
  if (v >= 1000) return `US$ ${(v / 1000).toFixed(2)} mil M`;
  return `US$ ${v.toLocaleString("es-AR", { maximumFractionDigits: 0 })} M`;
}

export default async function ProvinciaPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const stats = await loadStats();
  const prov = findBySlug(stats, slug);
  if (!prov) notFound();

  // Rankings vs las otras 23
  const rankPob = rankIn(stats, prov.provincia, "poblacion");
  const rankDen = rankIn(stats, prov.provincia, "densidad");
  const rankIdh = rankIn(stats, prov.provincia, "idh");
  const rankExp = rankIn(stats, prov.provincia, "export_total");

  // Lista para navegar a otras provincias
  const allSlugs = listAllSlugs(stats).filter(
    (s) => s.slug !== slug,
  );

  return (
    <>
      <div
        className="mx-auto max-w-5xl px-5"
        style={{
          paddingTop: "calc(var(--navbar-h) + 3rem)",
          paddingBottom: "4rem",
        }}
      >
        {/* Breadcrumb */}
        <div
          className="flex items-center gap-1.5 text-xs mb-6"
          style={{ color: "var(--color-text-muted)" }}
        >
          <Link href="/" className="hover:underline">
            Inicio
          </Link>
          <span>›</span>
          <Link href="/mapa" className="hover:underline">
            Mapa
          </Link>
          <span>›</span>
          <span>{prov.provincia}</span>
        </div>

        {/* Header */}
        <div className="mb-10">
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em] mb-2"
            style={{ color: "var(--color-primary)" }}
          >
            Perfil provincial
          </p>
          <h1
            className="text-3xl md:text-5xl font-bold"
            style={{ color: "var(--color-text)" }}
          >
            {prov.provincia}
          </h1>
          {prov.tipo_economia && (
            <p
              className="mt-3 text-lg max-w-2xl"
              style={{ color: "var(--color-text)" }}
            >
              <strong style={{ color: "var(--color-primary)" }}>
                Tipo de economía:
              </strong>{" "}
              {prov.tipo_economia}.
            </p>
          )}
        </div>

        {/* KPIs principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {prov.poblacion != null && (
            <KpiBlock
              label="Población"
              value={fmtPob(prov.poblacion)}
              meta="Censo 2022"
              rank={rankPob}
            />
          )}
          {prov.densidad != null && (
            <KpiBlock
              label="Densidad"
              value={`${prov.densidad.toFixed(1)} hab/km²`}
              meta="hab por km²"
              rank={rankDen}
            />
          )}
          {prov.idh != null && (
            <KpiBlock
              label="IDH"
              value={prov.idh.toFixed(3)}
              meta="Desarrollo Humano"
              rank={rankIdh}
            />
          )}
          {prov.export_total != null && (
            <KpiBlock
              label="Exportaciones"
              value={fmtUSD(prov.export_total)}
              meta="anual, FOB"
              rank={rankExp}
            />
          )}
        </div>

        {/* Sección: superficie + datos crudos */}
        <div
          className="rounded-xl border p-5 mb-8"
          style={{
            background: "var(--color-card)",
            borderColor: "var(--color-border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: "var(--color-text-muted)" }}
          >
            Datos básicos
          </h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            {prov.area_km2 != null && (
              <Detail
                label="Superficie"
                value={`${prov.area_km2.toLocaleString("es-AR")} km²`}
              />
            )}
            {prov.poblacion != null && prov.area_km2 != null && (
              <Detail
                label="Densidad"
                value={`${(prov.poblacion / prov.area_km2).toFixed(1)} hab/km²`}
              />
            )}
            {prov.idh != null && (
              <Detail
                label="IDH (PNUD)"
                value={`${prov.idh.toFixed(3)} (0-1)`}
              />
            )}
            {prov.export_total != null && (
              <Detail
                label="Exportaciones anuales"
                value={fmtUSD(prov.export_total)}
              />
            )}
          </div>
        </div>

        {/* Composición de exportaciones */}
        {prov.export_total != null &&
          prov.export_total > 0 &&
          (prov.export_pp ?? 0) +
            (prov.export_moa ?? 0) +
            (prov.export_moi ?? 0) +
            (prov.export_cye ?? 0) >
            0 && (
            <div className="mb-8">
              <ProvinciaRubrosChart
                pp={prov.export_pp ?? 0}
                moa={prov.export_moa ?? 0}
                moi={prov.export_moi ?? 0}
                cye={prov.export_cye ?? 0}
              />
            </div>
          )}

        {/* Pendientes / qué falta */}
        <div
          className="rounded-xl border p-5 mb-8"
          style={{
            background: "var(--color-bg-alt)",
            borderColor: "var(--color-border)",
          }}
        >
          <h3
            className="text-sm font-semibold mb-2"
            style={{ color: "var(--color-text)" }}
          >
            Próximamente en este perfil
          </h3>
          <ul
            className="text-xs space-y-1 leading-relaxed list-disc pl-4"
            style={{ color: "var(--color-text-muted)" }}
          >
            <li>
              <strong>Empleo registrado privado</strong> (SIPA/MTEySS): tasa de
              empleo y evolución últimos 12 meses por provincia.
            </li>
            <li>
              <strong>Coparticipación recibida</strong> (MECON): transferencias
              automáticas mensuales.
            </li>
            <li>
              <strong>Deuda pública provincial</strong> (MECON DNAP): stock
              trimestral por instrumento.
            </li>
            <li>
              <strong>Pobreza por aglomerado urbano</strong> (INDEC EPH): si la
              provincia tiene aglomerado relevado.
            </li>
          </ul>
        </div>

        {/* Navegación a otras provincias */}
        <div
          className="rounded-xl border p-5"
          style={{
            background: "var(--color-card)",
            borderColor: "var(--color-border)",
          }}
        >
          <h3
            className="text-sm font-semibold mb-3"
            style={{ color: "var(--color-text)" }}
          >
            Ver otra provincia
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {allSlugs.map((p) => (
              <Link
                key={p.slug}
                href={`/provincia/${p.slug}`}
                className="text-xs px-2 py-1 rounded border hover:underline"
                style={{
                  borderColor: "var(--color-border)",
                  background: "var(--color-bg)",
                  color: "var(--color-text)",
                }}
              >
                {p.provincia}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

function KpiBlock({
  label,
  value,
  meta,
  rank,
}: {
  label: string;
  value: string;
  meta: string;
  rank: { rank: number; total: number; isTopHalf: boolean } | null;
}) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{
        background: "var(--color-card)",
        borderColor: "var(--color-border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-wider mb-1"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </p>
      <p
        className="text-2xl font-bold tabular-nums"
        style={{ color: "var(--color-text)" }}
      >
        {value}
      </p>
      <div
        className="flex items-baseline justify-between mt-1 text-[10px]"
        style={{ color: "var(--color-text-muted)" }}
      >
        <span>{meta}</span>
        {rank && (
          <span
            className="font-semibold"
            style={{
              color: rank.isTopHalf
                ? "var(--color-success)"
                : "var(--color-text-muted)",
            }}
          >
            #{rank.rank}/{rank.total}
          </span>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-baseline justify-between gap-2 py-1.5 border-b"
      style={{ borderColor: "var(--color-border)" }}
    >
      <span style={{ color: "var(--color-text-muted)" }}>{label}</span>
      <span
        className="font-semibold tabular-nums"
        style={{ color: "var(--color-text)" }}
      >
        {value}
      </span>
    </div>
  );
}
