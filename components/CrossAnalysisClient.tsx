"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ScatterChart } from "@/components/ScatterChart";
import {
  SERIES_CATALOG,
  CATEGORY_LABELS,
  groupByCategory,
  getSeriesById,
  type SeriesCategory,
} from "@/lib/seriesCatalog";
import { pearson, alignByDate, describeCorrelation } from "@/lib/correlation";

interface Props {
  xId: string;
  yId: string;
  xData: [string, number][];
  yData: [string, number][];
}

function SeriesSelector({
  label,
  selected,
  onChange,
  exclude,
}: {
  label: string;
  selected: string;
  onChange: (id: string) => void;
  exclude?: string;
}) {
  const grouped = useMemo(() => groupByCategory(), []);
  return (
    <div className="flex flex-col gap-2">
      <label
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </label>
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg border text-sm"
        style={{
          background: "var(--color-bg)",
          borderColor: "var(--color-border)",
          color: "var(--color-text)",
          fontFamily: "var(--font-sans)",
        }}
      >
        {(Object.keys(grouped) as SeriesCategory[]).map((cat) => (
          <optgroup key={cat} label={CATEGORY_LABELS[cat]}>
            {grouped[cat].map((s) => (
              <option key={s.id} value={s.id} disabled={s.id === exclude}>
                {s.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

export function CrossAnalysisClient({ xId, yId, xData, yData }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [currentX, setCurrentX] = useState(xId);
  const [currentY, setCurrentY] = useState(yId);

  // Cuando cambia un selector, actualizamos la URL para que el server
  // recargue con la nueva combinación.
  function updateSelection(newX: string, newY: string) {
    setCurrentX(newX);
    setCurrentY(newY);
    const params = new URLSearchParams(searchParams.toString());
    params.set("x", newX);
    params.set("y", newY);
    startTransition(() => {
      router.push(`/analisis?${params.toString()}`);
    });
  }

  const xMeta = getSeriesById(currentX);
  const yMeta = getSeriesById(currentY);

  // Alinear las dos series por mes
  const { dates, xs, ys } = useMemo(
    () => alignByDate(xData, yData, { dateGranularity: "month" }),
    [xData, yData],
  );
  const r = useMemo(() => pearson(xs, ys), [xs, ys]);
  const corrDesc = describeCorrelation(r);

  return (
    <div className="space-y-6">
      {/* Selectores */}
      <div className="grid md:grid-cols-2 gap-4">
        <SeriesSelector
          label="Eje X (variable independiente)"
          selected={currentX}
          onChange={(id) => updateSelection(id, currentY)}
          exclude={currentY}
        />
        <SeriesSelector
          label="Eje Y (variable dependiente)"
          selected={currentY}
          onChange={(id) => updateSelection(currentX, id)}
          exclude={currentX}
        />
      </div>

      {/* Stats */}
      <div
        className="rounded-xl border p-5"
        style={{
          background: "var(--color-card)",
          borderColor: "var(--color-border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-wider mb-1"
              style={{ color: "var(--color-text-muted)" }}
            >
              Coeficiente de correlación (Pearson)
            </p>
            <p
              className="text-3xl font-bold tabular-nums"
              style={{ color: corrDesc.color }}
            >
              {r !== null ? r.toFixed(3) : "—"}
            </p>
            <p className="text-xs mt-1" style={{ color: corrDesc.color }}>
              {corrDesc.label}
            </p>
          </div>
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-wider mb-1"
              style={{ color: "var(--color-text-muted)" }}
            >
              Períodos comparados
            </p>
            <p
              className="text-3xl font-bold tabular-nums"
              style={{ color: "var(--color-text)" }}
            >
              {dates.length}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
              {dates.length > 0
                ? `${dates[0]} → ${dates[dates.length - 1]}`
                : "sin solapamiento"}
            </p>
          </div>
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-wider mb-1"
              style={{ color: "var(--color-text-muted)" }}
            >
              R² (varianza explicada)
            </p>
            <p
              className="text-3xl font-bold tabular-nums"
              style={{ color: "var(--color-text)" }}
            >
              {r !== null ? `${(r * r * 100).toFixed(1)}%` : "—"}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
              {r !== null
                ? `${(r * r * 100).toFixed(0)}% del movimiento de Y se explica por X`
                : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Scatter */}
      <ScatterChart
        xs={xs}
        ys={ys}
        dates={dates}
        xLabel={xMeta?.label ?? currentX}
        yLabel={yMeta?.label ?? currentY}
        color="var(--chart-1)"
      />

      {/* Disclaimer */}
      <p
        className="text-xs leading-relaxed"
        style={{ color: "var(--color-text-muted)" }}
      >
        <strong>Cómo interpretar:</strong> el coeficiente de Pearson mide la
        fuerza de la relación lineal entre dos variables. Valores cercanos a
        +1 indican que cuando una sube la otra también; cercanos a −1 indican
        que cuando una sube la otra baja; cercanos a 0 indican que no hay
        relación lineal. <strong>Correlación no implica causalidad</strong>:
        dos series pueden estar correlacionadas por casualidad, por un
        factor común (ej. inflación afecta a casi todo en pesos), o por una
        relación causal real. La línea punteada gris es la regresión lineal.
        Los puntos más opacos son los más recientes en el tiempo.
      </p>

      {/* Ejemplos de combinaciones interesantes */}
      <div
        className="rounded-xl border p-5"
        style={{
          background: "var(--color-bg-alt)",
          borderColor: "var(--color-border)",
        }}
      >
        <h3
          className="text-sm font-semibold mb-3"
          style={{ color: "var(--color-text)" }}
        >
          Combinaciones interesantes para explorar
        </h3>
        <div className="grid md:grid-cols-2 gap-2 text-sm">
          {EXAMPLES.map((ex) => (
            <button
              key={`${ex.x}-${ex.y}`}
              onClick={() => updateSelection(ex.x, ex.y)}
              className="text-left px-3 py-2 rounded-lg transition-colors duration-150 border"
              style={{
                borderColor: "var(--color-border)",
                background: "var(--color-card)",
                color: "var(--color-text)",
              }}
            >
              <span className="font-semibold">{ex.title}</span>
              <span
                className="block text-xs mt-0.5"
                style={{ color: "var(--color-text-muted)" }}
              >
                {ex.description}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const EXAMPLES: { x: string; y: string; title: string; description: string }[] = [
  {
    x: "dolar_oficial_mensual",
    y: "ipc_mensual",
    title: "Dólar oficial vs Inflación",
    description: "El clásico pass-through cambiario.",
  },
  {
    x: "reservas_bcra",
    y: "riesgo_pais",
    title: "Reservas BCRA vs Riesgo país",
    description: "¿Cuánto importa el stock de reservas para el spread soberano?",
  },
  {
    x: "tpm",
    y: "ipc_mensual",
    title: "TPM vs Inflación",
    description: "Efectividad de la política monetaria.",
  },
  {
    x: "dolar_oficial_mensual",
    y: "dolar_blue_mensual",
    title: "Oficial vs Blue",
    description: "¿Se mueven juntos? Brecha implícita.",
  },
  {
    x: "ripte_nivel",
    y: "ipc_mensual",
    title: "RIPTE nivel vs IPC",
    description: "Salario nominal contra precios.",
  },
  {
    x: "merval",
    y: "riesgo_pais",
    title: "Merval vs Riesgo país",
    description: "Correlación inversa típica.",
  },
];
