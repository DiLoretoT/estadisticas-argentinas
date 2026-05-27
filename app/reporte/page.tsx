import Link from "next/link";
import { Footer } from "@/components/Footer";
import { readIndicator } from "@/lib/readData";
import { computeUpcomingPublications } from "@/lib/calendarioIndec";
import type { Metadata } from "next";

// El parte se regenera una vez por día tras el ETL diario. 30 min de ISR
// alcanza para reflejar el commit del día sin redeploy.
export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Parte diario",
  description:
    "Qué datos económicos se publicaron hoy en Argentina y cuáles se vienen: inflación, actividad, empleo, pobreza, comercio exterior y confianza.",
  alternates: { canonical: "/reporte" },
};

type Unit =
  | "percent_decimal"
  | "percent_pct"
  | "porcentaje_anual"
  | "peso_ars"
  | "millones_usd"
  | "millones_pesos"
  | "indice";

interface Indicador {
  series_id: string;
  label: string;
  category: string;
  unit: Unit;
  official: boolean;
  source: string;
  detail_path: string | null;
  period: string;
  value: number;
  prev_period: string | null;
  prev_value: number | null;
  change_abs: number | null;
  change_pct: number | null;
  is_new: boolean;
}

interface Editorial {
  for_date: string | null;
  senal_del_dia: string | null;
  propuesta: string | null;
  para_leer: { titulo: string; url?: string; nota?: string }[] | null;
}

interface Reporte {
  schema_version: number;
  generated_at: string;
  report_date: string;
  novedades_count: number;
  indicadores: Indicador[];
  editorial: Editorial | null;
}

const MESES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

const RATE_UNITS: Unit[] = ["percent_decimal", "percent_pct", "porcentaje_anual"];

/** "2026-03-01" → "mar 2026" (o "19 may 2026" si es un dato diario). */
function periodLabel(iso: string): string {
  if (!iso || iso.length < 7) return iso;
  const [y, m, d] = iso.split("-");
  const mi = parseInt(m, 10) - 1;
  const mes = MESES[mi] ?? m;
  if (d && d !== "01") return `${parseInt(d, 10)} ${mes} ${y}`;
  return `${mes} ${y}`;
}

function formatValue(value: number, unit: Unit): string {
  switch (unit) {
    case "percent_decimal":
      return (value * 100).toLocaleString("es-AR", { maximumFractionDigits: 1 }) + "%";
    case "percent_pct":
    case "porcentaje_anual":
      return value.toLocaleString("es-AR", { maximumFractionDigits: 1 }) + "%";
    case "peso_ars":
      return "$" + value.toLocaleString("es-AR", { maximumFractionDigits: 0 });
    case "millones_usd":
      return "US$ " + value.toLocaleString("es-AR", { maximumFractionDigits: 0 }) + " M";
    case "millones_pesos":
      return "$" + value.toLocaleString("es-AR", { maximumFractionDigits: 0 }) + " M";
    case "indice":
    default:
      return value.toLocaleString("es-AR", { maximumFractionDigits: 1 });
  }
}

/** Devuelve el texto del cambio y su dirección, sin connotar bueno/malo. */
function formatChange(ind: Indicador): { text: string; dir: "up" | "down" | "flat" } | null {
  if (ind.change_abs === null) return null;
  const dir = ind.change_abs > 0 ? "up" : ind.change_abs < 0 ? "down" : "flat";

  if (RATE_UNITS.includes(ind.unit)) {
    // El cambio se expresa en puntos porcentuales sobre el período previo.
    const pp = ind.unit === "percent_decimal" ? ind.change_abs * 100 : ind.change_abs;
    const sign = pp > 0 ? "+" : "";
    return {
      text: `${sign}${pp.toLocaleString("es-AR", { maximumFractionDigits: 1 })} pp`,
      dir,
    };
  }

  if (ind.change_pct !== null) {
    const pct = ind.change_pct * 100;
    const sign = pct > 0 ? "+" : "";
    return {
      text: `${sign}${pct.toLocaleString("es-AR", { maximumFractionDigits: 1 })}%`,
      dir,
    };
  }
  return null;
}

function Arrow({ dir }: { dir: "up" | "down" | "flat" }) {
  if (dir === "flat") return <span aria-hidden>→</span>;
  return <span aria-hidden>{dir === "up" ? "▲" : "▼"}</span>;
}

function IndicadorCard({ ind }: { ind: Indicador }) {
  const change = formatChange(ind);
  const inner = (
    <div
      className="rounded-xl border p-4 h-full flex flex-col"
      style={{
        background: "var(--color-card)",
        borderColor: ind.is_new ? "var(--color-primary)" : "var(--color-border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold leading-snug" style={{ color: "var(--color-text)" }}>
          {ind.label}
        </h3>
        {ind.is_new && (
          <span
            className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
            style={{ background: "var(--color-primary-soft)", color: "var(--color-primary)" }}
          >
            Nuevo
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl font-bold tabular-nums" style={{ color: "var(--color-text)" }}>
          {formatValue(ind.value, ind.unit)}
        </span>
        {change && (
          <span className="text-xs font-semibold tabular-nums inline-flex items-center gap-0.5" style={{ color: "var(--color-text-muted)" }}>
            <Arrow dir={change.dir} />
            {change.text}
          </span>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
        <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
          {periodLabel(ind.period)}
        </span>
        <span className="text-[10px] uppercase tracking-wider inline-flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
          {ind.source}
          {!ind.official && (
            <span title="Fuente privada, no oficial" style={{ color: "var(--color-warning)" }}>
              ·&nbsp;no&nbsp;oficial
            </span>
          )}
        </span>
      </div>
    </div>
  );

  if (ind.detail_path) {
    return (
      <Link href={ind.detail_path} className="block transition-transform hover:-translate-y-0.5">
        {inner}
      </Link>
    );
  }
  return inner;
}

function formatPubDate(d: Date): string {
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

export default async function ReportePage() {
  const reporte = (await readIndicator("reporte.json")) as unknown as Reporte;

  const indicadores = Array.isArray(reporte?.indicadores) ? reporte.indicadores : [];
  const novedades = indicadores.filter((i) => i.is_new);
  const panorama = indicadores;

  const reportDate = reporte?.report_date;
  const dateLabel = reportDate
    ? new Date(reportDate + "T12:00:00").toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  // Editorial: solo se muestra si la rutina de Claude lo escribió para HOY.
  const ed = reporte?.editorial;
  const editorialFresh = !!ed && ed.for_date === reportDate;
  const paraLeer = editorialFresh && Array.isArray(ed?.para_leer) ? ed!.para_leer! : [];

  const upcoming = computeUpcomingPublications().filter((p) => p.daysUntil >= 0).slice(0, 6);

  return (
    <>
      <div
        className="mx-auto max-w-5xl px-5"
        style={{ paddingTop: "calc(var(--navbar-h) + 3rem)", paddingBottom: "4rem" }}
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

        {/* Hero */}
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-2" style={{ color: "var(--color-primary)" }}>
            Parte diario
          </p>
          <h1 className="text-3xl md:text-4xl font-bold" style={{ color: "var(--color-text)" }}>
            La economía argentina, hoy
          </h1>
          {dateLabel && (
            <p className="mt-2 text-sm capitalize" style={{ color: "var(--color-text-muted)" }}>
              {dateLabel}
            </p>
          )}
          <p className="mt-3 text-base max-w-2xl" style={{ color: "var(--color-text-muted)" }}>
            Qué indicadores se actualizaron, dónde están parados los principales números
            y qué datos se esperan en los próximos días.
          </p>
        </div>

        {/* Señal del día (editorial, opcional) */}
        {editorialFresh && ed?.senal_del_dia && (
          <section
            className="mb-10 rounded-2xl border p-5 md:p-6"
            style={{
              background: "var(--color-primary-soft)",
              borderColor: "var(--color-primary)",
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-primary)" }}>
              Señal del día
            </p>
            <p className="text-base leading-relaxed" style={{ color: "var(--color-text)" }}>
              {ed.senal_del_dia}
            </p>
          </section>
        )}

        {/* Novedades */}
        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-text-muted)" }}>
            {novedades.length > 0 ? "Se publicó hoy" : "Novedades de hoy"}
          </h2>
          {novedades.length === 0 ? (
            <div
              className="rounded-xl border p-5 text-sm"
              style={{
                background: "var(--color-bg-alt)",
                borderColor: "var(--color-border)",
                color: "var(--color-text-muted)",
              }}
            >
              Hoy no se publicaron indicadores nuevos. Mirá el panorama actual abajo o el
              calendario de lo que se viene.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {novedades.map((ind) => (
                <IndicadorCard key={ind.series_id} ind={ind} />
              ))}
            </div>
          )}
        </section>

        {/* Panorama */}
        {panorama.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-text-muted)" }}>
              Panorama — último dato de cada indicador
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {panorama.map((ind) => (
                <IndicadorCard key={ind.series_id} ind={ind} />
              ))}
            </div>
          </section>
        )}

        {/* Propuesta (editorial, opcional) */}
        {editorialFresh && ed?.propuesta && (
          <section
            className="mb-10 rounded-xl border p-5"
            style={{ background: "var(--color-card)", borderColor: "var(--color-border)", boxShadow: "var(--shadow-sm)" }}
          >
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>
              Para pensar
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--color-text)" }}>
              {ed.propuesta}
            </p>
          </section>
        )}

        {/* Qué se viene */}
        {upcoming.length > 0 && (
          <section className="mb-10">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                Qué se viene
              </h2>
              <Link href="/calendario" className="text-xs underline" style={{ color: "var(--color-primary)" }}>
                Ver calendario completo →
              </Link>
            </div>
            <div className="space-y-2">
              {upcoming.map((p) => (
                <div
                  key={p.ruleId}
                  className="rounded-xl border p-3 flex items-center justify-between gap-3"
                  style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
                >
                  <div className="min-w-0">
                    <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                      {p.indicator}
                    </span>
                    <span className="ml-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {p.refPeriodLabel} · {p.source}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className="text-sm font-bold tabular-nums"
                      style={{ color: p.daysUntil <= 7 ? "var(--color-primary)" : "var(--color-text-muted)" }}
                    >
                      {p.daysUntil === 0 ? "hoy" : p.daysUntil === 1 ? "mañana" : `+${p.daysUntil}d`}
                    </span>
                    <span className="block text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                      {formatPubDate(p.estimatedDate)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Para leer (editorial, opcional) */}
        {editorialFresh && paraLeer.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--color-text-muted)" }}>
              Para leer
            </h2>
            <ul className="space-y-2">
              {paraLeer.map((item, i) => (
                <li
                  key={i}
                  className="rounded-xl border p-3"
                  style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
                >
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium underline" style={{ color: "var(--color-primary)" }}>
                      {item.titulo}
                    </a>
                  ) : (
                    <span className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                      {item.titulo}
                    </span>
                  )}
                  {item.nota && (
                    <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                      {item.nota}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Nota al pie */}
        <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
          Los valores salen del pipeline propio (INDEC, BCRA y otras fuentes públicas; ICG/ICC
          de la UTDT, no oficial). El cambio se mide contra el período inmediato anterior de cada
          serie. Las fechas de &ldquo;qué se viene&rdquo; son estimadas — ver{" "}
          <Link href="/calendario" className="underline" style={{ color: "var(--color-primary)" }}>
            calendario
          </Link>{" "}y{" "}
          <Link href="/metodologia" className="underline" style={{ color: "var(--color-primary)" }}>
            metodología
          </Link>.
        </p>
      </div>

      <Footer />
    </>
  );
}
