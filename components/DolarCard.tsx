"use client";

import { Sparkline } from "@/components/KpiCard";
import { formatPesoFx } from "@/lib/formatters";

interface DolarCardProps {
  label: string;
  /** Venta = precio "titular" que muestran los sitios de cotización. */
  venta: number | null;
  /** Compra. Puede faltar en el dato estático server-rendered. */
  compra: number | null;
  /** Período del dato ("Intradía" cuando hay cotización en vivo). */
  period?: string;
  /** Variación mensual ya formateada ("+1,2%"). */
  change?: string;
  changeDirection?: "up" | "down" | "neutral";
  accentColor?: string;
  sparkData?: number[];
  /** Hay cotización en vivo para esta casa. */
  live?: boolean;
  /** El panel de detalle de esta card está abierto. */
  expanded?: boolean;
  onToggle?: () => void;
}

export function DolarCard({
  label,
  venta,
  compra,
  period,
  change,
  changeDirection,
  accentColor = "var(--color-primary)",
  sparkData,
  live = false,
  expanded = false,
  onToggle,
}: DolarCardProps) {
  const changeColor =
    changeDirection === "up"
      ? "var(--color-danger)" // para el dólar, subir es "malo" (goodDirection=down)
      : changeDirection === "down"
        ? "var(--color-success)"
        : "var(--color-text-muted)";
  const arrow =
    changeDirection === "up" ? "↑" : changeDirection === "down" ? "↓" : "";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-label={`${label} — ver detalle de la jornada`}
      className="group text-left rounded-xl p-4 border card-hover transition-transform duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2"
      style={{
        background: "var(--color-card)",
        borderColor: expanded ? accentColor : "var(--color-border)",
        boxShadow: "var(--shadow-sm)",
        borderTop: `3px solid ${accentColor}`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-text-muted)" }}
          >
            {label}
          </span>
          {live && (
            <span
              className="relative flex h-1.5 w-1.5"
              aria-label="cotización en vivo"
            >
              <span
                className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
                style={{ background: "var(--color-positive, #16a34a)" }}
              />
              <span
                className="relative inline-flex h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--color-positive, #16a34a)" }}
              />
            </span>
          )}
        </span>
        <span
          className="text-xs transition-transform duration-200"
          style={{
            color: "var(--color-text-muted)",
            transform: expanded ? "rotate(180deg)" : "none",
          }}
          aria-hidden
        >
          ⌄
        </span>
      </div>

      <div className="flex items-end justify-between gap-2">
        <div className="flex-1 min-w-0">
          <span
            className="block text-2xl font-bold tabular-nums leading-none"
            style={{ color: "var(--color-text)" }}
          >
            {formatPesoFx(venta)}
          </span>

          {/* Compra / venta cuando hay ambos. */}
          {compra != null ? (
            <div className="flex items-center gap-2 mt-1.5 text-[11px] tabular-nums">
              <span style={{ color: "var(--color-text-muted)" }}>
                Compra{" "}
                <span className="font-semibold" style={{ color: "var(--color-text)" }}>
                  {formatPesoFx(compra)}
                </span>
              </span>
              <span style={{ color: "var(--color-text-muted)" }}>
                Venta{" "}
                <span className="font-semibold" style={{ color: "var(--color-text)" }}>
                  {formatPesoFx(venta)}
                </span>
              </span>
            </div>
          ) : null}

          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {change && (
              <span
                className="inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums"
                style={{ color: changeColor }}
              >
                {arrow && <span>{arrow}</span>}
                {change}
                <span
                  className="font-normal ml-0.5 text-[10px] opacity-75"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  m/m
                </span>
              </span>
            )}
            {period && (
              <span
                className="text-[10px] tabular-nums"
                style={{ color: "var(--color-text-muted)" }}
              >
                · {period}
              </span>
            )}
          </div>
        </div>

        {sparkData && sparkData.length > 1 && (
          <Sparkline data={sparkData} color={accentColor} />
        )}
      </div>
    </button>
  );
}
