"use client";

import { formatPesoFx, formatHoraBA, formatDiaBA } from "@/lib/formatters";

export interface IntradiaPoint {
  t: string;
  compra: number | null;
  venta: number | null;
  /** Punto tomado de la cotización en vivo (aún no persistido por el cron). */
  live?: boolean;
}

interface Props {
  label: string;
  accentColor: string;
  /** Puntos del día en orden cronológico (viejo → nuevo). */
  points: IntradiaPoint[];
}

export function DolarIntradiaPanel({ label, accentColor, points }: Props) {
  const last = points[points.length - 1];
  // Mostramos más reciente arriba.
  const rows = [...points].reverse();

  return (
    <div
      className="rounded-xl border p-4 md:p-5"
      style={{
        background: "var(--color-card)",
        borderColor: accentColor,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
        <h3 className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
          {label} · movimientos de la jornada
        </h3>
        {last && (
          <span
            className="text-[11px] tabular-nums"
            style={{ color: "var(--color-text-muted)" }}
          >
            Última: {formatDiaBA(last.t)} {formatHoraBA(last.t)}
          </span>
        )}
      </div>

      {points.length === 0 ? (
        <p
          className="text-xs leading-relaxed py-2"
          style={{ color: "var(--color-text-muted)" }}
        >
          Todavía no se registraron cotizaciones hoy. El log se actualiza durante
          el horario de mercado.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs tabular-nums">
            <thead>
              <tr style={{ color: "var(--color-text-muted)" }}>
                <th className="text-left font-medium pb-2 pr-4">Hora</th>
                <th className="text-right font-medium pb-2 pr-4">Compra</th>
                <th className="text-right font-medium pb-2 pr-4">Venta</th>
                <th className="text-right font-medium pb-2">Δ venta</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p, i) => {
                // índice cronológico para comparar contra el anterior
                const chronoIdx = points.length - 1 - i;
                const prev = chronoIdx > 0 ? points[chronoIdx - 1] : null;
                const delta =
                  prev?.venta != null && p.venta != null
                    ? p.venta - prev.venta
                    : null;
                const deltaColor =
                  delta == null || delta === 0
                    ? "var(--color-text-muted)"
                    : delta > 0
                      ? "var(--color-danger)"
                      : "var(--color-success)";
                const isLast = i === 0;
                return (
                  <tr
                    key={`${p.t}-${i}`}
                    style={{
                      color: "var(--color-text)",
                      borderTop: "1px solid var(--color-border)",
                    }}
                  >
                    <td className="text-left py-1.5 pr-4">
                      <span className="inline-flex items-center gap-1.5">
                        {formatHoraBA(p.t)}
                        {isLast && (
                          <span
                            className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
                            style={{
                              color: accentColor,
                              background: "var(--color-primary-soft, rgba(0,0,0,0.05))",
                            }}
                          >
                            {p.live ? "en vivo" : "última"}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="text-right py-1.5 pr-4">{formatPesoFx(p.compra)}</td>
                    <td className="text-right py-1.5 pr-4 font-semibold">
                      {formatPesoFx(p.venta)}
                    </td>
                    <td
                      className="text-right py-1.5"
                      style={{ color: deltaColor }}
                    >
                      {delta == null
                        ? "—"
                        : delta === 0
                          ? "="
                          : `${delta > 0 ? "+" : ""}${delta.toLocaleString("es-AR", { maximumFractionDigits: 2 })}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p
        className="mt-3 text-[10px] leading-relaxed"
        style={{ color: "var(--color-text-muted)" }}
      >
        Sólo se registran los cambios de cotización del día (las lecturas sin
        variación no generan fila). Fuente: dolarapi.com.
      </p>
    </div>
  );
}
