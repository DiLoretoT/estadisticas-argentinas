"use client";

import { useState } from "react";
import { analyzeSeries, type AnalysisInput } from "@/lib/analysisEngine";

interface Props extends AnalysisInput {
  /** Etiqueta corta del botón (default "Análisis automático"). */
  label?: string;
}

export function AnalysisPanel(props: Props) {
  const [expanded, setExpanded] = useState(false);
  const { label = "Análisis automático", ...analysisInput } = props;

  const result = analyzeSeries(analysisInput);
  if (!result) return null;

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        background: "var(--color-card)",
        borderColor: "var(--color-border)",
      }}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full px-4 py-3 flex items-center justify-between gap-2 text-left transition-colors"
        style={{
          color: expanded ? "var(--color-primary)" : "var(--color-text)",
        }}
        aria-expanded={expanded}
      >
        <span className="inline-flex items-center gap-2">
          <span
            className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold"
            style={{
              background: "var(--color-primary-soft)",
              color: "var(--color-primary)",
            }}
          >
            AUTO
          </span>
          <span className="text-sm font-semibold">{label}</span>
          <span
            className="text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            {expanded ? "" : "(click para expandir)"}
          </span>
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 12 12"
          fill="currentColor"
          style={{
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        >
          <path d="M2 4l4 4 4-4z" />
        </svg>
      </button>

      {expanded && (
        <div
          className="px-4 pb-4 pt-1 border-t"
          style={{ borderColor: "var(--color-border)" }}
        >
          <ul className="space-y-2 mt-3">
            {result.bullets.map((b, i) => (
              <li
                key={i}
                className="text-sm leading-relaxed flex gap-2"
                style={{ color: "var(--color-text)" }}
              >
                <span
                  className="flex-shrink-0 mt-1.5"
                  style={{ color: "var(--color-primary)" }}
                >
                  ▸
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <div
            className="mt-4 pt-3 border-t flex flex-wrap gap-x-4 gap-y-1 text-[11px]"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-muted)",
            }}
          >
            <span>
              <strong>{result.metrics.n}</strong> observaciones
            </span>
            <span>
              Período: <strong>{result.metrics.firstDate.slice(0, 7)}</strong> →{" "}
              <strong>{result.metrics.lastDate.slice(0, 7)}</strong>
            </span>
            <span>
              Tendencia reciente:{" "}
              <strong>{result.metrics.trend.replace(/_/g, " ")}</strong>
            </span>
            <span>
              Volatilidad:{" "}
              <strong>{result.metrics.volatility.replace(/_/g, " ")}</strong>
            </span>
          </div>

          <p
            className="mt-3 text-[10px] italic"
            style={{ color: "var(--color-text-muted)" }}
          >
            Análisis generado automáticamente a partir de la serie temporal. Usa
            cálculos estadísticos determinísticos (sin IA). Se actualiza con
            cada nuevo dato del ETL.
          </p>
        </div>
      )}
    </div>
  );
}
