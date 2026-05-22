"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MultiSeriesChart, type SeriesInput } from "@/components/MultiSeriesChart";
import {
  SERIES_CATALOG,
  CATEGORY_LABELS,
  groupByCategory,
  getSeriesById,
  type SeriesCategory,
} from "@/lib/seriesCatalog";
import {
  PERIOD_LABELS,
  type PeriodPreset,
  periodToRange,
  filterByRange,
  globalDateBounds,
  SERIES_COLORS,
} from "@/lib/explorer";

interface LoadedSeries {
  id: string;
  data: [string, number][];
}

interface Props {
  /** Series cargadas en el server (las que el user pidió en la URL). */
  loadedSeries: LoadedSeries[];
  /** Configuración inicial leída de searchParams. */
  initial: {
    selectedIds: string[];
    y2Ids: string[];
    period: PeriodPreset;
    customFrom?: string;
    customTo?: string;
  };
}

export function ExplorerClient({ loadedSeries, initial }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [selectedIds, setSelectedIds] = useState<string[]>(initial.selectedIds);
  const [y2Ids, setY2Ids] = useState<Set<string>>(new Set(initial.y2Ids));
  const [period, setPeriod] = useState<PeriodPreset>(initial.period);
  const [customFrom, setCustomFrom] = useState(initial.customFrom || "");
  const [customTo, setCustomTo] = useState(initial.customTo || "");
  const [showAddSeries, setShowAddSeries] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Cuando cambia la lista de seleccionados, navegamos para que server cargue
  function pushState(
    nextSelected: string[],
    nextY2: Set<string>,
    nextPeriod: PeriodPreset,
    nextFrom: string,
    nextTo: string,
  ) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("series", nextSelected.join(","));
    if (nextY2.size > 0) params.set("y2", Array.from(nextY2).join(","));
    else params.delete("y2");
    params.set("period", nextPeriod);
    if (nextPeriod === "custom") {
      params.set("from", nextFrom);
      params.set("to", nextTo);
    } else {
      params.delete("from");
      params.delete("to");
    }
    startTransition(() => {
      router.push(`/explorar?${params.toString()}`);
    });
  }

  function addSeries(id: string) {
    if (selectedIds.includes(id) || selectedIds.length >= 6) return;
    const next = [...selectedIds, id];
    setSelectedIds(next);
    setShowAddSeries(false);
    pushState(next, y2Ids, period, customFrom, customTo);
  }

  function removeSeries(id: string) {
    if (selectedIds.length <= 1) return; // mantener al menos 1
    const next = selectedIds.filter((x) => x !== id);
    const nextY2 = new Set(y2Ids);
    nextY2.delete(id);
    setSelectedIds(next);
    setY2Ids(nextY2);
    pushState(next, nextY2, period, customFrom, customTo);
  }

  function toggleAxis(id: string) {
    const nextY2 = new Set(y2Ids);
    if (nextY2.has(id)) nextY2.delete(id);
    else nextY2.add(id);
    setY2Ids(nextY2);
    pushState(selectedIds, nextY2, period, customFrom, customTo);
  }

  function setPeriodPreset(p: PeriodPreset) {
    setPeriod(p);
    pushState(selectedIds, y2Ids, p, customFrom, customTo);
  }

  function applyCustomDates() {
    if (!customFrom || !customTo) return;
    setPeriod("custom");
    pushState(selectedIds, y2Ids, "custom", customFrom, customTo);
  }

  function shareUrl() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  }

  // Construir las SeriesInput aplicando filtro de período
  const seriesData = useMemo<SeriesInput[]>(() => {
    // Computar rango global ANTES de filtrar para usar como base
    const allRaw = loadedSeries.map((s) => s.data);
    const bounds = globalDateBounds(allRaw);
    const lastDate = bounds?.max || new Date();
    const range = periodToRange(period, lastDate, customFrom, customTo);

    return loadedSeries.map((s, idx) => {
      const meta = getSeriesById(s.id);
      const filtered = filterByRange(s.data, range);
      return {
        id: s.id,
        label: meta?.label || s.id,
        unit: meta?.unit || "",
        data: filtered,
        color: SERIES_COLORS[idx % SERIES_COLORS.length],
        axis: y2Ids.has(s.id) ? "y2" : "y1",
      };
    });
  }, [loadedSeries, period, customFrom, customTo, y2Ids]);

  const grouped = useMemo(() => groupByCategory(), []);

  const totalObs = useMemo(
    () => seriesData.reduce((sum, s) => sum + s.data.length, 0),
    [seriesData],
  );

  return (
    <div className="space-y-5">
      {/* Filtros de período */}
      <div
        className="rounded-xl border p-4"
        style={{
          background: "var(--color-card)",
          borderColor: "var(--color-border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <p
          className="text-[10px] font-semibold uppercase tracking-wider mb-2"
          style={{ color: "var(--color-text-muted)" }}
        >
          Período
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "10y", "5y", "3y", "1y", "6m", "custom"] as PeriodPreset[]).map(
            (p) => (
              <button
                key={p}
                onClick={() => p !== "custom" && setPeriodPreset(p)}
                className="text-xs px-2.5 py-1 rounded border transition-colors"
                style={{
                  background:
                    period === p ? "var(--color-primary)" : "var(--color-bg)",
                  color: period === p ? "#fff" : "var(--color-text)",
                  borderColor: "var(--color-border)",
                  fontWeight: period === p ? 600 : 400,
                }}
              >
                {PERIOD_LABELS[p]}
              </button>
            ),
          )}
          {period === "custom" && (
            <>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="text-xs px-2 py-1 rounded border"
                style={{
                  background: "var(--color-bg)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                }}
              />
              <span style={{ color: "var(--color-text-muted)" }}>→</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="text-xs px-2 py-1 rounded border"
                style={{
                  background: "var(--color-bg)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                }}
              />
              <button
                onClick={applyCustomDates}
                className="text-xs px-3 py-1 rounded border font-semibold"
                style={{
                  background: "var(--color-primary)",
                  color: "#fff",
                  borderColor: "var(--color-primary)",
                }}
              >
                Aplicar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Selector de series y asignación de eje */}
      <div
        className="rounded-xl border p-4"
        style={{
          background: "var(--color-card)",
          borderColor: "var(--color-border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <p
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-text-muted)" }}
          >
            Series activas ({selectedIds.length}/6)
          </p>
          <button
            onClick={() => setShowAddSeries((s) => !s)}
            disabled={selectedIds.length >= 6}
            className="text-xs px-2.5 py-1 rounded border"
            style={{
              background: "var(--color-bg)",
              borderColor: "var(--color-border)",
              color:
                selectedIds.length >= 6
                  ? "var(--color-text-muted)"
                  : "var(--color-text)",
              opacity: selectedIds.length >= 6 ? 0.5 : 1,
              cursor: selectedIds.length >= 6 ? "not-allowed" : "pointer",
            }}
          >
            + Agregar serie
          </button>
        </div>

        <div className="space-y-2">
          {selectedIds.map((id, idx) => {
            const meta = getSeriesById(id);
            const onY2 = y2Ids.has(id);
            const color = SERIES_COLORS[idx % SERIES_COLORS.length];
            return (
              <div
                key={id}
                className="flex items-center gap-2 p-2 rounded border"
                style={{
                  background: "var(--color-bg)",
                  borderColor: "var(--color-border)",
                }}
              >
                <span
                  className="inline-block w-3 h-3 rounded shrink-0"
                  style={{ background: color }}
                />
                <span
                  className="text-sm flex-1 truncate"
                  style={{ color: "var(--color-text)" }}
                >
                  {meta?.label || id}
                </span>
                <button
                  onClick={() => toggleAxis(id)}
                  className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold"
                  style={{
                    background: onY2 ? "var(--color-primary)" : "var(--color-bg-alt)",
                    color: onY2 ? "#fff" : "var(--color-text-muted)",
                  }}
                  title="Cambiar entre eje Y izquierdo y derecho"
                >
                  {onY2 ? "Y der" : "Y izq"}
                </button>
                <button
                  onClick={() => removeSeries(id)}
                  disabled={selectedIds.length <= 1}
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    color: "var(--color-danger)",
                    opacity: selectedIds.length <= 1 ? 0.3 : 1,
                    cursor: selectedIds.length <= 1 ? "not-allowed" : "pointer",
                  }}
                  title="Quitar serie"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>

        {/* Drop-down para agregar serie */}
        {showAddSeries && (
          <div
            className="mt-3 p-3 rounded border max-h-72 overflow-y-auto"
            style={{
              background: "var(--color-bg)",
              borderColor: "var(--color-border)",
            }}
          >
            {(Object.keys(grouped) as SeriesCategory[]).map((cat) => {
              const candidates = grouped[cat].filter((s) => !selectedIds.includes(s.id));
              if (candidates.length === 0) return null;
              return (
                <div key={cat} className="mb-2">
                  <p
                    className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {CATEGORY_LABELS[cat]}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {candidates.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => addSeries(s.id)}
                        className="text-xs px-2 py-1 rounded border"
                        style={{
                          background: "var(--color-card)",
                          borderColor: "var(--color-border)",
                          color: "var(--color-text)",
                        }}
                      >
                        + {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p
          className="text-[11px] mt-3 leading-relaxed"
          style={{ color: "var(--color-text-muted)" }}
        >
          <strong>Cómo usar el doble eje:</strong> si dos series tienen
          magnitudes muy distintas (ej. inflación en % y dólar en miles de
          pesos), poné una en <strong>Y izq</strong> y la otra en{" "}
          <strong>Y der</strong>. Así cada serie usa su propia escala y
          podés ver cómo se mueven juntas en el tiempo.
        </p>
      </div>

      {/* Chart */}
      <MultiSeriesChart serieses={seriesData} />

      {/* Acciones */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span style={{ color: "var(--color-text-muted)" }}>
          {seriesData.length} series · {totalObs} observaciones · período: {PERIOD_LABELS[period]}
        </span>
        <button
          onClick={shareUrl}
          className="px-3 py-1.5 rounded border font-medium"
          style={{
            background: "var(--color-card)",
            borderColor: "var(--color-border)",
            color: shareCopied ? "var(--color-success)" : "var(--color-text)",
          }}
        >
          {shareCopied ? "✓ Link copiado" : "Compartir esta vista"}
        </button>
      </div>
    </div>
  );
}
