"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  COMPARATIVAS,
  COEF_EXPLANATIONS,
  GROUP_LABELS,
  groupComparativas,
  type Comparativa,
  type CoefType,
} from "@/lib/comparativas";
import { getSeriesById } from "@/lib/seriesCatalog";
import {
  pearson,
  spearman,
  kendallTau,
  alignByDate,
  describeCorrelation,
  crossCorrelation,
  bestLag,
} from "@/lib/correlation";

interface PrecomputedResult {
  comparativa: Comparativa;
  coefValue: number | null;
  coefLabel: string;
  coefColor: string;
  bestLagValue: { lag: number; r: number } | null;
  n: number;
  dateRange: { start: string; end: string } | null;
}

interface Props {
  /** Función para cargar la serie desde el server (la página la pasa). */
  seriesData: Map<string, [string, number][]>;
}

export function ComparativasDestacadas({ seriesData }: Props) {
  const [groupFilter, setGroupFilter] = useState<Comparativa["group"] | "all">(
    "all",
  );
  const [coefInfoOpen, setCoefInfoOpen] = useState<CoefType | null>(null);

  // Pre-calcular todas las comparativas (ya viene el data)
  const results = useMemo<PrecomputedResult[]>(() => {
    return COMPARATIVAS.map((comp) => {
      const xData = seriesData.get(comp.xId);
      const yData = seriesData.get(comp.yId);
      if (!xData || !yData) {
        return {
          comparativa: comp,
          coefValue: null,
          coefLabel: "Sin datos",
          coefColor: "var(--color-text-muted)",
          bestLagValue: null,
          n: 0,
          dateRange: null,
        };
      }
      const { dates, xs, ys } = alignByDate(xData, yData, {
        dateGranularity: "month",
      });
      if (dates.length < 3) {
        return {
          comparativa: comp,
          coefValue: null,
          coefLabel: "Pocas observaciones",
          coefColor: "var(--color-text-muted)",
          bestLagValue: null,
          n: dates.length,
          dateRange: null,
        };
      }
      let coefValue: number | null = null;
      if (comp.coef === "pearson") coefValue = pearson(xs, ys);
      else if (comp.coef === "spearman") coefValue = spearman(xs, ys);
      else coefValue = kendallTau(xs, ys);

      // Best lag si se espera lag
      let lagResult: { lag: number; r: number } | null = null;
      if (comp.expectedLag !== undefined) {
        const cc = crossCorrelation(
          xs,
          ys,
          Math.min(12, Math.floor(dates.length / 3)),
        );
        lagResult = bestLag(cc);
      }

      const desc = describeCorrelation(coefValue);
      return {
        comparativa: comp,
        coefValue,
        coefLabel: desc.label,
        coefColor: desc.color,
        bestLagValue: lagResult,
        n: dates.length,
        dateRange: { start: dates[0], end: dates[dates.length - 1] },
      };
    });
  }, [seriesData]);

  // Filtrar por grupo
  const filtered = useMemo(() => {
    if (groupFilter === "all") return results;
    return results.filter((r) => r.comparativa.group === groupFilter);
  }, [results, groupFilter]);

  const grouped = useMemo(() => groupComparativas(), []);
  const groups = Object.keys(grouped) as Comparativa["group"][];

  return (
    <div className="space-y-5">
      {/* Header con explicación */}
      <div
        className="rounded-xl p-5 border"
        style={{
          background: "var(--color-primary-soft)",
          borderColor: "var(--color-primary)",
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold"
            style={{ background: "var(--color-primary)", color: "#fff" }}
          >
            DESTACADAS
          </span>
          <h2
            className="text-lg font-bold"
            style={{ color: "var(--color-primary)" }}
          >
            Comparativas curadas
          </h2>
        </div>
        <p
          className="text-sm leading-relaxed"
          style={{ color: "var(--color-text)" }}
        >
          {COMPARATIVAS.length} pares de indicadores que sí se analizan
          frecuentemente en Argentina. Para cada uno elegimos el coeficiente de
          correlación que <strong>realmente representa la relación</strong>{" "}
          (Pearson no siempre es el correcto). Tocá cualquiera para ver el
          scatter completo en{" "}
          <Link
            href="/analisis"
            className="underline"
            style={{ color: "var(--color-primary)" }}
          >
            análisis cruzado
          </Link>
          .
        </p>
      </div>

      {/* Explicaciones de coeficientes (3 botones expandibles) */}
      <div className="grid md:grid-cols-3 gap-3">
        {(Object.keys(COEF_EXPLANATIONS) as CoefType[]).map((coefType) => {
          const expl = COEF_EXPLANATIONS[coefType];
          const open = coefInfoOpen === coefType;
          return (
            <button
              key={coefType}
              onClick={() => setCoefInfoOpen(open ? null : coefType)}
              className="rounded-xl border p-3 text-left transition-colors"
              style={{
                background: open
                  ? "var(--color-primary-soft)"
                  : "var(--color-card)",
                borderColor: open
                  ? "var(--color-primary)"
                  : "var(--color-border)",
              }}
            >
              <div
                className="text-xs font-bold mb-1"
                style={{ color: "var(--color-primary)" }}
              >
                {expl.name}
              </div>
              <div
                className="text-xs leading-relaxed"
                style={{ color: "var(--color-text)" }}
              >
                {open ? expl.detail : expl.short}
              </div>
              <div
                className="text-[10px] mt-2 underline"
                style={{ color: "var(--color-text-muted)" }}
              >
                {open ? "ver menos" : "ver más"}
              </div>
            </button>
          );
        })}
      </div>

      {/* Filtros por grupo */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setGroupFilter("all")}
          className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
          style={{
            background:
              groupFilter === "all"
                ? "var(--color-primary)"
                : "var(--color-card)",
            color: groupFilter === "all" ? "#fff" : "var(--color-text-muted)",
            borderColor: "var(--color-border)",
          }}
        >
          Todas ({COMPARATIVAS.length})
        </button>
        {groups.map((g) => (
          <button
            key={g}
            onClick={() => setGroupFilter(g)}
            className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
            style={{
              background:
                groupFilter === g
                  ? "var(--color-primary)"
                  : "var(--color-card)",
              color: groupFilter === g ? "#fff" : "var(--color-text-muted)",
              borderColor: "var(--color-border)",
            }}
          >
            {GROUP_LABELS[g]} ({grouped[g].length})
          </button>
        ))}
      </div>

      {/* Grid de cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((res) => (
          <ComparativaCard key={res.comparativa.id} result={res} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p
          className="text-sm text-center py-6"
          style={{ color: "var(--color-text-muted)" }}
        >
          No hay comparativas en esta categoría todavía.
        </p>
      )}
    </div>
  );
}

function ComparativaCard({ result }: { result: PrecomputedResult }) {
  const { comparativa, coefValue, coefLabel, coefColor, bestLagValue, n, dateRange } =
    result;
  const xMeta = getSeriesById(comparativa.xId);
  const yMeta = getSeriesById(comparativa.yId);
  const coefName = COEF_EXPLANATIONS[comparativa.coef].name;

  return (
    <Link
      href={`/analisis?x=${comparativa.xId}&y=${comparativa.yId}`}
      className="block rounded-xl border p-4 transition-all hover:shadow-md"
      style={{
        background: "var(--color-card)",
        borderColor: "var(--color-border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3
          className="text-sm font-bold flex-1"
          style={{ color: "var(--color-text)" }}
        >
          {comparativa.title}
        </h3>
        <span
          className="text-2xl font-bold tabular-nums shrink-0"
          style={{ color: coefColor }}
        >
          {coefValue !== null ? coefValue.toFixed(2) : "—"}
        </span>
      </div>

      <div
        className="text-xs mb-3"
        style={{ color: coefColor }}
      >
        {coefLabel}{" "}
        <span
          className="opacity-70"
          style={{ color: "var(--color-text-muted)" }}
        >
          · {coefName.split(" ")[0]}
        </span>
      </div>

      <p
        className="text-xs leading-relaxed mb-2"
        style={{ color: "var(--color-text-muted)" }}
      >
        <strong style={{ color: "var(--color-text)" }}>Pregunta:</strong>{" "}
        {comparativa.question}
      </p>

      <p
        className="text-xs leading-relaxed mb-3"
        style={{ color: "var(--color-text-muted)" }}
      >
        <strong style={{ color: "var(--color-text)" }}>Interpretación:</strong>{" "}
        {comparativa.interpretation}
      </p>

      {/* Metadata */}
      <div
        className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] pt-2 border-t"
        style={{
          borderColor: "var(--color-border)",
          color: "var(--color-text-muted)",
        }}
      >
        <span>
          <strong>{n}</strong> observaciones
        </span>
        {dateRange && (
          <span>
            {dateRange.start} → {dateRange.end}
          </span>
        )}
        {bestLagValue && bestLagValue.lag !== 0 && (
          <span
            className="font-semibold"
            style={{ color: "var(--color-primary)" }}
          >
            Mejor lag: {bestLagValue.lag > 0 ? "+" : ""}{bestLagValue.lag} meses (r={bestLagValue.r.toFixed(2)})
          </span>
        )}
      </div>
    </Link>
  );
}
