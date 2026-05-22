"use client";

import dynamic from "next/dynamic";
import type { CurrencySeries } from "@/components/MultiCurrencyChart";

interface Props {
  series: CurrencySeries[];
  label?: string;
  defaultBaseDate?: string;
}

/**
 * Skeleton con la misma altura que el chart real para evitar layout shift
 * cuando se monta el componente client-side.
 */
function ChartSkeleton({ label }: { label?: string }) {
  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        background: "var(--color-card)",
        borderColor: "var(--color-border)",
        boxShadow: "var(--shadow-sm)",
        aspectRatio: "1000/480",
      }}
    >
      <div className="px-4 pt-4 pb-2 flex items-baseline justify-between gap-2">
        <div
          className="h-4 w-2/3 rounded"
          style={{ background: "var(--color-bg-alt)" }}
        />
        <div
          className="h-3 w-24 rounded"
          style={{ background: "var(--color-bg-alt)" }}
        />
      </div>
      <div className="flex items-center justify-center h-3/4">
        <span
          className="text-xs"
          style={{ color: "var(--color-text-muted)" }}
        >
          Cargando comparativa{label ? ` — ${label}` : ""}...
        </span>
      </div>
    </div>
  );
}

/**
 * Lazy wrapper para MultiCurrencyChart.
 *
 * El chart real es ~30 KB de código + cálculos sobre cientos de puntos
 * (interpolación + paths SVG). Renderizándolo client-only evitamos que
 * bloquee el LCP de la home, que tiene que mostrar primero las KPI cards.
 */
const MultiCurrencyChartInner = dynamic(
  () => import("@/components/MultiCurrencyChart").then((m) => m.MultiCurrencyChart),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  },
);

export function MultiCurrencyChartLazy(props: Props) {
  return <MultiCurrencyChartInner {...props} />;
}
