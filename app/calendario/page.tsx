import Link from "next/link";
import { Footer } from "@/components/Footer";
import { computeUpcomingPublications } from "@/lib/calendarioIndec";
import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Calendario de publicaciones",
  description:
    "Cuándo sale el próximo dato: IPC, EMAE, EPH, PBI, balanza comercial, pobreza. Cronograma estimado de INDEC y BCRA.",
};

function formatDate(d: Date): string {
  return d.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function daysLabel(daysUntil: number): { text: string; color: string } {
  if (daysUntil < 0) {
    return {
      text: `publicado hace ${Math.abs(daysUntil)} día${Math.abs(daysUntil) === 1 ? "" : "s"}`,
      color: "var(--color-text-muted)",
    };
  }
  if (daysUntil === 0)
    return { text: "hoy", color: "var(--color-primary)" };
  if (daysUntil === 1)
    return { text: "mañana", color: "var(--color-primary)" };
  if (daysUntil <= 7)
    return {
      text: `en ${daysUntil} días`,
      color: "var(--color-warning)",
    };
  return {
    text: `en ${daysUntil} días`,
    color: "var(--color-text-muted)",
  };
}

function freqLabel(freq: "monthly" | "quarterly" | "semiannual"): string {
  if (freq === "monthly") return "Mensual";
  if (freq === "quarterly") return "Trimestral";
  return "Semestral";
}

export default function CalendarioPage() {
  const upcoming = computeUpcomingPublications();

  const next = upcoming.filter((p) => p.daysUntil >= 0);
  const recent = upcoming.filter((p) => p.daysUntil < 0);

  return (
    <>
      <div
        className="mx-auto max-w-5xl px-5"
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
            Próximos datos
          </p>
          <h1
            className="text-3xl md:text-4xl font-bold"
            style={{ color: "var(--color-text)" }}
          >
            Calendario de publicaciones
          </h1>
          <p
            className="mt-3 text-base max-w-2xl"
            style={{ color: "var(--color-text-muted)" }}
          >
            Cuándo se espera el próximo dato de cada indicador. Calculado a
            partir del cronograma habitual de INDEC y BCRA (día típico de
            publicación). Las fechas pueden variar ±2-3 días respecto al
            calendario oficial.
          </p>
        </div>

        {/* Próximas */}
        <section className="mb-10">
          <h2
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: "var(--color-text-muted)" }}
          >
            Próximas publicaciones
          </h2>
          <div className="space-y-2">
            {next.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                No hay publicaciones programadas en los próximos días.
              </p>
            ) : (
              next.map((p) => {
                const lbl = daysLabel(p.daysUntil);
                return (
                  <div
                    key={p.ruleId}
                    className="rounded-xl border p-4 flex items-start justify-between gap-4"
                    style={{
                      background: "var(--color-card)",
                      borderColor: "var(--color-border)",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap mb-1">
                        <h3
                          className="text-base font-semibold"
                          style={{ color: "var(--color-text)" }}
                        >
                          {p.indicator}
                        </h3>
                        <span
                          className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                          style={{
                            background: "var(--color-bg-alt)",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          {p.source}
                        </span>
                        <span
                          className="text-[10px] uppercase tracking-wider"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          {freqLabel(p.frequency)}
                        </span>
                      </div>
                      <p
                        className="text-xs leading-relaxed mb-2"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {p.description}
                      </p>
                      <div className="flex items-baseline gap-3 text-xs">
                        <span style={{ color: "var(--color-text-muted)" }}>
                          Dato de:
                        </span>
                        <span
                          className="font-semibold"
                          style={{ color: "var(--color-text)" }}
                        >
                          {p.refPeriodLabel}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div
                        className="text-2xl font-bold tabular-nums"
                        style={{ color: lbl.color }}
                      >
                        {p.daysUntil === 0
                          ? "Hoy"
                          : p.daysUntil === 1
                            ? "Mañana"
                            : `+${p.daysUntil}d`}
                      </div>
                      <div
                        className="text-xs mt-0.5"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {formatDate(p.estimatedDate)}
                      </div>
                      {p.detailPath && (
                        <Link
                          href={p.detailPath}
                          className="inline-block mt-2 text-xs underline"
                          style={{ color: "var(--color-primary)" }}
                        >
                          Ver serie →
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Recién publicadas */}
        {recent.length > 0 && (
          <section className="mb-10">
            <h2
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: "var(--color-text-muted)" }}
            >
              Publicadas recientemente
            </h2>
            <div className="space-y-2">
              {recent.map((p) => (
                <div
                  key={p.ruleId}
                  className="rounded-xl border p-3 flex items-baseline justify-between gap-3"
                  style={{
                    background: "var(--color-bg-alt)",
                    borderColor: "var(--color-border)",
                    opacity: 0.75,
                  }}
                >
                  <div>
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--color-text)" }}
                    >
                      {p.indicator}
                    </span>
                    <span
                      className="ml-2 text-xs"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      ({p.refPeriodLabel})
                    </span>
                  </div>
                  <span
                    className="text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    hace {Math.abs(p.daysUntil)} día
                    {Math.abs(p.daysUntil) === 1 ? "" : "s"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Notas */}
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
              Las fechas son <strong>estimadas</strong> a partir del día típico
              de publicación. INDEC y BCRA publican el calendario oficial pero
              no via API — chequeá{" "}
              <a
                href="https://www.indec.gob.ar/calendario/calendario.asp"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
                style={{ color: "var(--color-primary)" }}
              >
                indec.gob.ar/calendario
              </a>{" "}
              para confirmación exacta.
            </li>
            <li>
              Cuando un dato se demora (frecuente en pobreza/EPH), la fecha que
              ves acá pasa al historial pero la próxima estimación se reasigna
              al período siguiente.
            </li>
            <li>
              Los datos se publican típicamente a las 16hs hora Argentina.
            </li>
          </ul>
        </div>
      </div>

      <Footer />
    </>
  );
}
