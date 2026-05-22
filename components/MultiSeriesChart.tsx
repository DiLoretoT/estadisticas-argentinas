"use client";

import { useMemo, useState, useRef } from "react";
import { formatValueByUnit } from "@/lib/explorer";

export type Axis = "y1" | "y2";

export interface SeriesInput {
  /** ID estable de la serie. */
  id: string;
  /** Etiqueta para leyenda y tooltip. */
  label: string;
  /** Unidad textual (para formatear valores). */
  unit: string;
  /** Datos cronológicos [date_iso, value]. */
  data: [string, number][];
  /** Color (CSS var o hex). */
  color: string;
  /** A qué eje pertenece (y1 = izquierda, y2 = derecha). */
  axis: Axis;
}

interface Props {
  serieses: SeriesInput[];
  /** Si se setea, etiqueta del eje izquierdo. Si no, se calcula a partir de la primera serie y1. */
  y1Label?: string;
  /** Si se setea, etiqueta del eje derecho. Si no, se calcula a partir de la primera serie y2. */
  y2Label?: string;
}

const W = 1100;
const H = 520;
const PAD_L = 80;
const PAD_R = 80;
const PAD_T = 32;
const PAD_B = 60;
const CHART_W = W - PAD_L - PAD_R;
const CHART_H = H - PAD_T - PAD_B;

function bestUnit(serieses: SeriesInput[], axis: Axis): string {
  const first = serieses.find((s) => s.axis === axis);
  return first?.unit || "";
}

function fmtDateShort(iso: string): string {
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const parts = iso.split("-");
  const m = parseInt(parts[1] ?? "1", 10) - 1;
  return `${meses[m] ?? "?"} ${parts[0]?.slice(2) ?? ""}`;
}

function fmtDateFull(iso: string): string {
  const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const parts = iso.split("-");
  const m = parseInt(parts[1] ?? "1", 10) - 1;
  return `${parts[2] ? parts[2] + " " : ""}${meses[m] ?? ""} ${parts[0]}`;
}

export function MultiSeriesChart({ serieses, y1Label, y2Label }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  // Time bounds globales: min y max date sobre TODAS las series
  const { tMin, tMax, allDates } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    const dateSet = new Set<string>();
    for (const s of serieses) {
      for (const [d] of s.data) {
        dateSet.add(d);
        const t = new Date(d).getTime();
        if (t < min) min = t;
        if (t > max) max = t;
      }
    }
    return {
      tMin: min,
      tMax: max,
      allDates: Array.from(dateSet).sort(),
    };
  }, [serieses]);
  const tSpan = tMax - tMin || 1;

  // Bounds por eje
  const y1Series = useMemo(() => serieses.filter((s) => s.axis === "y1"), [serieses]);
  const y2Series = useMemo(() => serieses.filter((s) => s.axis === "y2"), [serieses]);

  function computeAxisBounds(group: SeriesInput[]) {
    let min = Infinity;
    let max = -Infinity;
    for (const s of group) {
      for (const [, v] of s.data) {
        if (v < min) min = v;
        if (v > max) max = v;
      }
    }
    if (!isFinite(min) || !isFinite(max)) return { min: 0, max: 1 };
    if (min === max) {
      const pad = Math.abs(min) * 0.1 || 1;
      return { min: min - pad, max: max + pad };
    }
    const pad = (max - min) * 0.08;
    return { min: min - pad, max: max + pad };
  }

  const y1Bounds = useMemo(() => computeAxisBounds(y1Series), [y1Series]);
  const y2Bounds = useMemo(() => computeAxisBounds(y2Series), [y2Series]);

  function xScale(t: number): number {
    return PAD_L + ((t - tMin) / tSpan) * CHART_W;
  }
  function yScale(v: number, bounds: { min: number; max: number }): number {
    const range = bounds.max - bounds.min || 1;
    return PAD_T + CHART_H - ((v - bounds.min) / range) * CHART_H;
  }

  // Paths
  const paths = useMemo(() => {
    return serieses.map((s) => {
      const bounds = s.axis === "y1" ? y1Bounds : y2Bounds;
      const points = s.data.map(([d, v]) => {
        const t = new Date(d).getTime();
        return { date: d, value: v, x: xScale(t), y: yScale(v, bounds) };
      });
      const d = points
        .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
        .join("");
      return { ...s, points, d };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serieses, y1Bounds, y2Bounds, tMin, tSpan]);

  // Ticks de tiempo (5)
  const xTicks = useMemo(() => {
    const steps = 5;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const t = tMin + (tSpan * i) / steps;
      const x = PAD_L + (i / steps) * CHART_W;
      return { x, label: fmtDateShort(new Date(t).toISOString().slice(0, 7)) };
    });
  }, [tMin, tSpan]);

  // Y ticks por eje (5)
  function makeYTicks(bounds: { min: number; max: number }) {
    const steps = 5;
    const range = bounds.max - bounds.min || 1;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const value = bounds.min + (range * i) / steps;
      const y = PAD_T + CHART_H - (i / steps) * CHART_H;
      return { y, value };
    });
  }
  const y1Ticks = useMemo(() => (y1Series.length ? makeYTicks(y1Bounds) : []), [y1Bounds, y1Series.length]);
  const y2Ticks = useMemo(() => (y2Series.length ? makeYTicks(y2Bounds) : []), [y2Bounds, y2Series.length]);

  const y1U = y1Label ?? bestUnit(serieses, "y1");
  const y2U = y2Label ?? bestUnit(serieses, "y2");

  // Snap hover a la fecha más cercana entre allDates
  function onMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseXSvg = ((e.clientX - rect.left) / rect.width) * W;
    if (mouseXSvg < PAD_L || mouseXSvg > W - PAD_R) {
      setHoverIdx(null);
      return;
    }
    // Encontrar el índice de fecha más cercano
    let bestI = 0;
    let bestDist = Infinity;
    for (let i = 0; i < allDates.length; i++) {
      const t = new Date(allDates[i]).getTime();
      const x = xScale(t);
      const dist = Math.abs(x - mouseXSvg);
      if (dist < bestDist) {
        bestDist = dist;
        bestI = i;
      }
    }
    setHoverIdx(bestI);
  }

  const hoverDate = hoverIdx !== null ? allDates[hoverIdx] : null;
  const hoverX = hoverDate ? xScale(new Date(hoverDate).getTime()) : null;

  // Valores por serie en la fecha del hover (carry-forward para series con menor frecuencia)
  const hoverValues = useMemo(() => {
    if (!hoverDate) return [];
    return paths.map((p) => {
      // Encontrar el punto con date <= hoverDate más cercano
      let best: typeof p.points[number] | null = null;
      for (const pt of p.points) {
        if (pt.date <= hoverDate) best = pt;
        else break;
      }
      return { ...p, hoverPoint: best };
    });
  }, [paths, hoverDate]);

  return (
    <div
      className="rounded-xl border overflow-hidden relative"
      style={{
        background: "var(--color-card)",
        borderColor: "var(--color-border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Leyenda */}
      <div
        className="px-4 py-3 border-b flex flex-wrap gap-x-4 gap-y-2"
        style={{ borderColor: "var(--color-border)" }}
      >
        {serieses.map((s) => (
          <div key={s.id} className="flex items-center gap-1.5 text-xs">
            <span
              className="inline-block w-3 h-1 rounded-sm"
              style={{ background: s.color }}
            />
            <span style={{ color: "var(--color-text)" }}>{s.label}</span>
            <span
              className="text-[10px] px-1 rounded"
              style={{
                background: "var(--color-bg-alt)",
                color: "var(--color-text-muted)",
              }}
            >
              {s.axis === "y1" ? "Y izq" : "Y der"}
            </span>
          </div>
        ))}
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ display: "block" }}
        onMouseMove={onMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        {/* Grid horizontal (Y1 ticks) */}
        {y1Ticks.map((yt, i) => (
          <line
            key={`gy${i}`}
            x1={PAD_L}
            y1={yt.y}
            x2={W - PAD_R}
            y2={yt.y}
            stroke="var(--color-border)"
            strokeWidth="1"
            opacity={i === 0 ? 0.8 : 0.4}
          />
        ))}

        {/* Y1 labels (izquierda) */}
        {y1Ticks.map((yt, i) => (
          <text
            key={`y1l${i}`}
            x={PAD_L - 10}
            y={yt.y}
            fontSize="14"
            fontWeight="500"
            textAnchor="end"
            dominantBaseline="middle"
            fill="var(--color-text-muted)"
            style={{ fontFamily: "var(--font-sans, system-ui)" }}
          >
            {formatValueByUnit(yt.value, y1U)}
          </text>
        ))}

        {/* Y2 labels (derecha) */}
        {y2Ticks.map((yt, i) => (
          <text
            key={`y2l${i}`}
            x={W - PAD_R + 10}
            y={yt.y}
            fontSize="14"
            fontWeight="500"
            textAnchor="start"
            dominantBaseline="middle"
            fill="var(--color-text-muted)"
            style={{ fontFamily: "var(--font-sans, system-ui)" }}
          >
            {formatValueByUnit(yt.value, y2U)}
          </text>
        ))}

        {/* X labels */}
        {xTicks.map((xt, i) => (
          <text
            key={`xl${i}`}
            x={xt.x}
            y={H - PAD_B + 22}
            fontSize="14"
            fontWeight="500"
            textAnchor="middle"
            fill="var(--color-text-muted)"
            style={{ fontFamily: "var(--font-sans, system-ui)" }}
          >
            {xt.label}
          </text>
        ))}

        {/* Etiquetas de ejes Y */}
        {y1Series.length > 0 && (
          <text
            x={20}
            y={PAD_T + CHART_H / 2}
            fontSize="12"
            fontWeight="700"
            textAnchor="middle"
            fill={y1Series[0].color}
            transform={`rotate(-90 20 ${PAD_T + CHART_H / 2})`}
            style={{ fontFamily: "var(--font-sans, system-ui)" }}
          >
            {y1Series[0].label}
          </text>
        )}
        {y2Series.length > 0 && (
          <text
            x={W - 20}
            y={PAD_T + CHART_H / 2}
            fontSize="12"
            fontWeight="700"
            textAnchor="middle"
            fill={y2Series[0].color}
            transform={`rotate(90 ${W - 20} ${PAD_T + CHART_H / 2})`}
            style={{ fontFamily: "var(--font-sans, system-ui)" }}
          >
            {y2Series[0].label}
          </text>
        )}

        {/* Líneas de series */}
        {paths.map((p, idx) => (
          <path
            key={p.id}
            d={p.d}
            fill="none"
            stroke={p.color}
            strokeWidth={2}
            opacity={0.9}
            style={{ pointerEvents: "none" }}
          />
        ))}

        {/* Crosshair vertical */}
        {hoverX !== null && (
          <line
            x1={hoverX}
            y1={PAD_T}
            x2={hoverX}
            y2={PAD_T + CHART_H}
            stroke="var(--color-text)"
            strokeWidth="1"
            opacity={0.3}
            strokeDasharray="3,3"
            style={{ pointerEvents: "none" }}
          />
        )}

        {/* Puntos hover */}
        {hoverValues.map((p) =>
          p.hoverPoint ? (
            <circle
              key={`h-${p.id}`}
              cx={p.hoverPoint.x}
              cy={p.hoverPoint.y}
              r={5}
              fill={p.color}
              stroke="var(--color-card)"
              strokeWidth={2}
              style={{ pointerEvents: "none" }}
            />
          ) : null,
        )}
      </svg>

      {/* Tooltip flotante */}
      {hoverDate && hoverValues.length > 0 && (
        <div
          className="absolute pointer-events-none px-3 py-2 rounded-lg text-xs"
          style={{
            left: (hoverX! / W) * 100 + "%",
            top: "12%",
            transform:
              hoverX! > W / 2 ? "translate(-110%, 0)" : "translate(20%, 0)",
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-md)",
            color: "var(--color-text)",
            zIndex: 20,
            minWidth: 180,
          }}
        >
          <div
            className="font-bold text-xs mb-1.5"
            style={{ color: "var(--color-text)" }}
          >
            {fmtDateFull(hoverDate)}
          </div>
          {hoverValues.map((p) =>
            p.hoverPoint ? (
              <div
                key={`t-${p.id}`}
                className="flex items-center justify-between gap-3 text-xs tabular-nums py-0.5"
              >
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ background: p.color }}
                  />
                  <span style={{ color: "var(--color-text-muted)" }}>{p.label}</span>
                </span>
                <span
                  className="font-semibold"
                  style={{ color: p.color }}
                >
                  {formatValueByUnit(p.hoverPoint.value, p.unit)}
                </span>
              </div>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}
