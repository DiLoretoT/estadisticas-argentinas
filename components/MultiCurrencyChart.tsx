"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { formatDate } from "@/lib/formatters";

export interface CurrencySeries {
  /** Slug stable identifier, e.g. "ars", "brl" */
  key: string;
  /** Visible label, e.g. "ARS (Argentina)" */
  label: string;
  /** Display color (CSS variable or hex) */
  color: string;
  /** Datapoints: [ISO date, value]. Value = local-currency-units-per-USD. */
  data: [string, number][];
  /** If true, can't be toggled off (anchor of the comparison) */
  pinned?: boolean;
}

interface MultiCurrencyChartProps {
  series: CurrencySeries[];
  /** Title shown above the chart */
  label?: string;
  /** Default fecha base (YYYY-MM-DD). If not set, uses the first month all
   *  series have in common. */
  defaultBaseDate?: string;
}

// SVG coords — padding right generoso para end-labels.
const W = 1000;
const H = 460;
const PAD_L = 56;
const PAD_R = 110;
const PAD_T = 22;
const PAD_B = 36;
const CHART_W = W - PAD_L - PAD_R;
const CHART_H = H - PAD_T - PAD_B;

/** Index a series to base 100 at baseDate (or first available point on/after it). */
function indexToBase(
  data: [string, number][],
  baseDate: string,
): [string, number][] {
  if (!data.length) return [];
  // Find first point >= baseDate
  let baseIdx = data.findIndex(([d]) => d >= baseDate);
  if (baseIdx === -1) {
    // baseDate is after all data — anchor to last point
    baseIdx = data.length - 1;
  }
  const baseValue = data[baseIdx][1];
  if (!baseValue) return [];
  return data
    .slice(baseIdx)
    .map(([d, v]) => [d, (v / baseValue) * 100] as [string, number]);
}

function minDate(data: [string, number][]): string | null {
  return data.length ? data[0][0] : null;
}

function maxDate(data: [string, number][]): string | null {
  return data.length ? data[data.length - 1][0] : null;
}

export function MultiCurrencyChart({
  series,
  label,
  defaultBaseDate,
}: MultiCurrencyChartProps) {
  // Visibility toggles
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  // Base date for normalization. Default = max of mins (so every visible series
  // has data at the base). User can change with a few preset choices.
  const minCommonDate = useMemo(() => {
    const mins = series
      .filter((s) => !hidden.has(s.key))
      .map((s) => minDate(s.data))
      .filter((d): d is string => !!d);
    return mins.length ? mins.reduce((a, b) => (a > b ? a : b)) : "2015-01-01";
  }, [series, hidden]);

  const [baseDate, setBaseDate] = useState<string>(
    defaultBaseDate || minCommonDate,
  );

  // If user toggles series and current baseDate is no longer feasible, snap
  // to the new minCommonDate.
  const effectiveBaseDate = baseDate < minCommonDate ? minCommonDate : baseDate;

  // Normalize each visible series to base 100 at effectiveBaseDate
  const normalized = useMemo(
    () =>
      series
        .filter((s) => !hidden.has(s.key))
        .map((s) => ({
          ...s,
          dataIdx: indexToBase(s.data, effectiveBaseDate),
        })),
    [series, hidden, effectiveBaseDate],
  );

  // Compute global x range and y range
  const xRange = useMemo(() => {
    const allDates = normalized
      .flatMap((s) => s.dataIdx.map(([d]) => d))
      .filter(Boolean);
    if (!allDates.length) return null;
    const start = allDates.reduce((a, b) => (a < b ? a : b));
    const end = allDates.reduce((a, b) => (a > b ? a : b));
    const startT = new Date(start).getTime();
    const endT = new Date(end).getTime();
    return { start, end, startT, endT, span: endT - startT || 1 };
  }, [normalized]);

  const yRange = useMemo(() => {
    const vals = normalized.flatMap((s) => s.dataIdx.map(([, v]) => v));
    if (!vals.length) return { min: 0, max: 100 };
    const min = Math.min(...vals, 100);
    const max = Math.max(...vals, 100);
    const pad = (max - min) * 0.08 || 10;
    return { min: min - pad, max: max + pad };
  }, [normalized]);

  // Build path for each visible series
  const seriesPaths = useMemo(() => {
    if (!xRange) return [];
    const { startT, span } = xRange;
    const yMin = yRange.min;
    const yMax = yRange.max;
    const yRangeSize = yMax - yMin || 1;
    return normalized.map((s) => {
      const points = s.dataIdx.map(([d, v]) => {
        const t = new Date(d).getTime();
        const x = PAD_L + ((t - startT) / span) * CHART_W;
        const y = PAD_T + CHART_H - ((v - yMin) / yRangeSize) * CHART_H;
        return { x, y, date: d, value: v };
      });
      const path = points
        .map(
          (p, i) =>
            `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`,
        )
        .join("");
      return { key: s.key, label: s.label, color: s.color, points, path };
    });
  }, [normalized, xRange, yRange]);

  // Y axis ticks
  const yTicks = useMemo(() => {
    const yMin = yRange.min;
    const yMax = yRange.max;
    const yRangeSize = yMax - yMin || 1;
    const steps = 5;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const v = yMin + (yRangeSize * i) / steps;
      const y = PAD_T + CHART_H - (i / steps) * CHART_H;
      return { y, value: v };
    });
  }, [yRange]);

  // X axis ticks (5 dates)
  const xTicks = useMemo(() => {
    if (!xRange) return [];
    const { startT, endT, span } = xRange;
    const steps = 5;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const t = startT + (span * i) / steps;
      const x = PAD_L + (i / steps) * CHART_W;
      const dateIso = new Date(t).toISOString().slice(0, 10);
      return { x, date: dateIso };
    });
  }, [xRange]);

  // Hover state for crosshair tooltip
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current || !xRange) return;
      const rect = svgRef.current.getBoundingClientRect();
      const mouseXSvg = ((e.clientX - rect.left) / rect.width) * W;
      const t = xRange.startT + ((mouseXSvg - PAD_L) / CHART_W) * xRange.span;
      if (t < xRange.startT || t > xRange.endT) {
        setHoverDate(null);
        return;
      }
      // Find closest point in the first visible series (proxy)
      const ref = seriesPaths[0]?.points || [];
      if (!ref.length) return;
      let closest = ref[0];
      let minDist = Infinity;
      for (const p of ref) {
        const dist = Math.abs(new Date(p.date).getTime() - t);
        if (dist < minDist) {
          minDist = dist;
          closest = p;
        }
      }
      setHoverDate(closest.date);
    },
    [xRange, seriesPaths],
  );

  function toggle(key: string, pinned?: boolean) {
    if (pinned) return;
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Base date presets
  const PRESETS: { label: string; date: string }[] = [
    { label: "Pre-Macri (2015)", date: "2015-12-10" },
    { label: "Pre-PASO 2019", date: "2019-08-10" },
    { label: "Pre-COVID (2020)", date: "2020-02-28" },
    { label: "Pre-Milei (2023)", date: "2023-11-19" },
    { label: "Año actual", date: `${new Date().getFullYear()}-01-01` },
  ];

  // Hovered tooltip values (one row per visible series)
  const hoverValues = useMemo(() => {
    if (!hoverDate) return null;
    return seriesPaths.map((sp) => {
      const point = sp.points.find((p) => p.date === hoverDate);
      return {
        key: sp.key,
        label: sp.label,
        color: sp.color,
        value: point ? point.value : null,
      };
    });
  }, [hoverDate, seriesPaths]);

  if (!series.length) {
    return (
      <div
        className="rounded-xl border p-6 text-sm"
        style={{
          background: "var(--color-card)",
          borderColor: "var(--color-border)",
          color: "var(--color-text-muted)",
        }}
      >
        Sin series para comparar.
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        background: "var(--color-card)",
        borderColor: "var(--color-border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex flex-col gap-3">
        {label && (
          <div className="flex items-baseline justify-between gap-2">
            <h3
              className="text-sm font-semibold"
              style={{ color: "var(--color-text)" }}
            >
              {label}
            </h3>
            <span
              className="text-[10px] uppercase tracking-wider"
              style={{ color: "var(--color-text-muted)" }}
            >
              Base 100 = {formatDate(effectiveBaseDate)}
            </span>
          </div>
        )}

        {/* Base date presets */}
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.filter((p) => p.date >= minCommonDate).map((p) => (
            <button
              key={p.label}
              onClick={() => setBaseDate(p.date)}
              className="text-[11px] px-2 py-0.5 rounded transition-colors duration-150"
              style={{
                background:
                  effectiveBaseDate === p.date
                    ? "var(--color-primary)"
                    : "transparent",
                color:
                  effectiveBaseDate === p.date
                    ? "#fff"
                    : "var(--color-text-muted)",
                border: "1px solid var(--color-border)",
              }}
              title={`Anclar a ${p.date}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Legend / toggles */}
        <div className="flex flex-wrap gap-x-3 gap-y-1.5">
          {series.map((s) => {
            const isHidden = hidden.has(s.key);
            return (
              <button
                key={s.key}
                onClick={() => toggle(s.key, s.pinned)}
                className="inline-flex items-center gap-1.5 text-xs transition-opacity"
                style={{
                  opacity: isHidden ? 0.35 : 1,
                  cursor: s.pinned ? "default" : "pointer",
                  color: "var(--color-text)",
                }}
                title={
                  s.pinned
                    ? "Serie ancla — siempre visible"
                    : isHidden
                      ? "Mostrar"
                      : "Ocultar"
                }
              >
                <span
                  className="w-3 h-1 rounded-sm"
                  style={{ background: s.color }}
                />
                <span style={{ textDecoration: isHidden ? "line-through" : "none" }}>
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ aspectRatio: `${W}/${H}`, display: "block" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverDate(null)}
      >
        {/* Grid */}
        {yTicks.map((yt, i) => (
          <line
            key={i}
            x1={PAD_L}
            y1={yt.y}
            x2={W - PAD_R}
            y2={yt.y}
            stroke="var(--color-border)"
            strokeWidth="1"
            strokeDasharray={Math.abs(yt.value - 100) < 0.5 ? undefined : "4,4"}
            opacity={Math.abs(yt.value - 100) < 0.5 ? 0.6 : 0.4}
          />
        ))}

        {/* Y axis labels */}
        {yTicks.map((yt, i) => (
          <text
            key={`y${i}`}
            x={PAD_L - 10}
            y={yt.y}
            fontSize="12"
            textAnchor="end"
            dominantBaseline="middle"
            fill="var(--color-text-muted)"
            style={{ fontFamily: "var(--font-sans, system-ui)" }}
          >
            {yt.value.toFixed(0)}
          </text>
        ))}

        {/* X axis labels */}
        {xTicks.map((xt, i) => (
          <text
            key={`x${i}`}
            x={xt.x}
            y={H - 12}
            fontSize="12"
            textAnchor={i === 0 ? "start" : i === xTicks.length - 1 ? "end" : "middle"}
            fill="var(--color-text-muted)"
            style={{ fontFamily: "var(--font-sans, system-ui)" }}
          >
            {formatDate(xt.date)}
          </text>
        ))}

        {/* Series lines — la pinned (ARS) más gruesa y opaca, las demás más finas */}
        {seriesPaths.map((sp) => {
          const isPinned =
            series.find((s) => s.key === sp.key)?.pinned === true;
          return (
            <path
              key={sp.key}
              d={sp.path}
              fill="none"
              stroke={sp.color}
              strokeWidth={isPinned ? 3 : 1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={isPinned ? 1 : 0.85}
            />
          );
        })}

        {/* End-labels: nombre + valor de cada serie al final de la línea */}
        {(() => {
          // Algoritmo simple para evitar choques: ordenar por Y final, separar
          // verticalmente si están a menos de 16px.
          const minSeparation = 16;
          const lasts = seriesPaths
            .map((sp) => {
              const lastPt = sp.points[sp.points.length - 1];
              if (!lastPt) return null;
              return {
                key: sp.key,
                label: sp.label,
                color: sp.color,
                value: lastPt.value,
                x: lastPt.x,
                y: lastPt.y,
                isPinned: series.find((s) => s.key === sp.key)?.pinned === true,
              };
            })
            .filter((l): l is NonNullable<typeof l> => l !== null)
            .sort((a, b) => a.y - b.y);

          // Ajustar Y para separación mínima
          for (let i = 1; i < lasts.length; i++) {
            if (lasts[i].y - lasts[i - 1].y < minSeparation) {
              lasts[i].y = lasts[i - 1].y + minSeparation;
            }
          }

          return lasts.map((l) => (
            <g key={`label-${l.key}`}>
              <line
                x1={l.x}
                y1={l.y}
                x2={W - PAD_R + 2}
                y2={l.y}
                stroke={l.color}
                strokeWidth="1"
                opacity={0.4}
                strokeDasharray="2,3"
              />
              <circle
                cx={l.x}
                cy={
                  seriesPaths.find((sp) => sp.key === l.key)?.points.slice(-1)[0]
                    ?.y ?? l.y
                }
                r={l.isPinned ? 4 : 3}
                fill={l.color}
                stroke="var(--color-card)"
                strokeWidth="1.5"
              />
              <text
                x={W - PAD_R + 6}
                y={l.y}
                fontSize={l.isPinned ? 13 : 12}
                fontWeight={l.isPinned ? 700 : 600}
                fill={l.color}
                textAnchor="start"
                dominantBaseline="middle"
                stroke="var(--color-card)"
                strokeWidth="4"
                paintOrder="stroke"
                style={{ fontFamily: "var(--font-sans, system-ui)" }}
              >
                {l.label.replace(/^[^\sA-Za-z]+ /, "")}
                {" "}
                {l.value.toFixed(0)}
              </text>
            </g>
          ));
        })()}

        {/* Crosshair */}
        {hoverDate && xRange && (() => {
          const t = new Date(hoverDate).getTime();
          const x = PAD_L + ((t - xRange.startT) / xRange.span) * CHART_W;
          return (
            <line
              x1={x}
              y1={PAD_T}
              x2={x}
              y2={PAD_T + CHART_H}
              stroke="var(--color-text-muted)"
              strokeWidth="1"
              strokeDasharray="3,3"
              opacity="0.6"
            />
          );
        })()}
      </svg>

      {/* Tooltip table */}
      {hoverValues && (
        <div
          className="px-4 pb-3 pt-1 border-t"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="text-[10px] uppercase tracking-wider"
              style={{ color: "var(--color-text-muted)" }}
            >
              {hoverDate ? formatDate(hoverDate) : ""}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1">
            {hoverValues.map((row) => (
              <div
                key={row.key}
                className="flex items-center justify-between gap-2 text-xs tabular-nums"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: row.color }}
                  />
                  <span
                    className="truncate"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {row.label}
                  </span>
                </span>
                <span
                  className="font-semibold"
                  style={{ color: "var(--color-text)" }}
                >
                  {row.value !== null ? row.value.toFixed(1) : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Helper text */}
      <div
        className="px-4 pb-3 text-[11px] leading-relaxed"
        style={{ color: "var(--color-text-muted)" }}
      >
        Cada serie es <strong>unidades locales por USD</strong>, normalizada a
        100 en la fecha base. Subir = la moneda se devaluó vs USD; bajar = se
        apreció. Una serie creciendo más rápido que otra significa mayor
        devaluación relativa.
      </div>
    </div>
  );
}
