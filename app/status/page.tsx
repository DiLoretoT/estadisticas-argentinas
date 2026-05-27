import Link from "next/link";
import { Footer } from "@/components/Footer";
import { getStatusEntries } from "@/lib/lastUpdated";
import type { Metadata } from "next";

// ISR: revalidamos /status cada 5 minutos para que los runs recientes del ETL
// se reflejen rápido sin necesidad de redeployar.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Estado del ETL",
  description:
    "Estado de la última corrida del pipeline de datos: qué series están actualizadas y cuáles tienen errores.",
  alternates: { canonical: "/status" },
};

interface StatusEntry {
  series_id: string;
  last_status: "success" | "error";
  last_run_at: string | null;
  last_date: string | null;
  row_count: number;
  error_message: string | null;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Argentina/Buenos_Aires",
    }).format(d);
  } catch {
    return iso;
  }
}

function StatusBadge({ status }: { status: "success" | "error" }) {
  const bg = status === "success" ? "var(--color-success-soft)" : "var(--color-danger-soft)";
  const fg = status === "success" ? "var(--color-success)" : "var(--color-danger)";
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider"
      style={{ background: bg, color: fg }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: fg }}
      />
      {status === "success" ? "OK" : "Error"}
    </span>
  );
}

export default async function StatusPage() {
  const entries = (await getStatusEntries()) as StatusEntry[];
  const okCount = entries.filter((e) => e.last_status === "success").length;
  const errCount = entries.filter((e) => e.last_status === "error").length;
  const lastRun = entries
    .map((e) => (e.last_run_at ? new Date(e.last_run_at).getTime() : 0))
    .reduce((a, b) => Math.max(a, b), 0);
  const lastRunStr = lastRun > 0 ? formatDateTime(new Date(lastRun).toISOString()) : "—";

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

        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-2" style={{ color: "var(--color-primary)" }}>
            Estado
          </p>
          <h1 className="text-3xl md:text-4xl font-bold" style={{ color: "var(--color-text)" }}>
            Pipeline de datos
          </h1>
          <p className="mt-3 text-sm max-w-xl" style={{ color: "var(--color-text-muted)" }}>
            Estado de la última corrida del ETL por serie. Se ejecuta automáticamente
            vía GitHub Actions dos veces al día. Cada serie muestra cuándo se actualizó
            por última vez y si hubo error.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div
            className="rounded-xl p-4 border"
            style={{
              background: "var(--color-card)",
              borderColor: "var(--color-border)",
              boxShadow: "var(--shadow-sm)",
              borderTop: "3px solid var(--color-success)",
            }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--color-text-muted)" }}>
              Series OK
            </p>
            <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--color-success)" }}>
              {okCount}
            </p>
          </div>
          <div
            className="rounded-xl p-4 border"
            style={{
              background: "var(--color-card)",
              borderColor: "var(--color-border)",
              boxShadow: "var(--shadow-sm)",
              borderTop: `3px solid ${errCount > 0 ? "var(--color-danger)" : "var(--color-border)"}`,
            }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--color-text-muted)" }}>
              Con error
            </p>
            <p
              className="text-2xl font-bold tabular-nums"
              style={{ color: errCount > 0 ? "var(--color-danger)" : "var(--color-text)" }}
            >
              {errCount}
            </p>
          </div>
          <div
            className="rounded-xl p-4 border col-span-2 md:col-span-1"
            style={{
              background: "var(--color-card)",
              borderColor: "var(--color-border)",
              boxShadow: "var(--shadow-sm)",
              borderTop: "3px solid var(--color-primary)",
            }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--color-text-muted)" }}>
              Última corrida
            </p>
            <p className="text-sm font-bold tabular-nums" style={{ color: "var(--color-text)" }}>
              {lastRunStr}
            </p>
          </div>
        </div>

        {/* Status table */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{
            background: "var(--color-card)",
            borderColor: "var(--color-border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: "var(--color-bg-alt)" }}>
                <tr>
                  {["Serie", "Estado", "Última corrida", "Último dato", "Registros", "Error"].map((th) => (
                    <th
                      key={th}
                      className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {th}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => (
                  <tr
                    key={entry.series_id}
                    style={{
                      borderBottom:
                        i < entries.length - 1
                          ? "1px solid var(--color-border)"
                          : undefined,
                    }}
                  >
                    <td className="px-3 py-3 font-semibold" style={{ color: "var(--color-text)" }}>
                      {entry.series_id}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={entry.last_status} />
                    </td>
                    <td className="px-3 py-3 tabular-nums text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {formatDateTime(entry.last_run_at)}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {entry.last_date ?? "—"}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {entry.row_count.toLocaleString("es-AR")}
                    </td>
                    <td className="px-3 py-3 text-xs" style={{ color: "var(--color-danger)" }}>
                      {entry.error_message ? entry.error_message.slice(0, 80) + (entry.error_message.length > 80 ? "…" : "") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-6 text-xs" style={{ color: "var(--color-text-muted)" }}>
          Si una serie está en estado <code className="px-1 rounded font-mono" style={{ background: "var(--color-bg-alt)" }}>error</code>{" "}
          de forma persistente, suele significar que el ID de la fuente cambió o que
          la API está caída. El pipeline se ejecuta vía GitHub Actions dos veces al día.
        </p>
      </div>

      <Footer />
    </>
  );
}
