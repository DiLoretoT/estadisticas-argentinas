"use client";

import { useMemo, useRef, useState } from "react";

interface ScatterChartProps {
  xs: number[];
  ys: number[];
  dates: string[];
  xLabel: string;
  yLabel: string;
  color?: string;
}

const W = 1000;
const H = 520;
const PAD_L = 80;
const PAD_R = 24;
const PAD_T = 32;
const PAD_B = 72;
const CHART_W = W - PAD_L - PAD_R;
const CHART_H = H - PAD_T - PAD_B;

function fmtNumber(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  if (Math.abs(v) < 1 && Math.abs(v) > 0) return v.toFixed(3);
  return v.toLocaleString("es-AR", { maximumFractionDigits: 1 });
}

function fmtDate(iso: string): string {
  // "2024-03" o "2024-03-15" → "Mar 2024"
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const parts = iso.split("-");
  const m = parseInt(parts[1] ?? "1", 10) - 1;
  return `${meses[m] ?? parts[1]} ${parts[0]}`;
}

/** Regresión lineal simple: devuelve {slope, intercept} */
function linearRegression(xs: number[], ys: number[]): { m: number; b: number } | null {
  if (xs.length < 2) return null;
  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  if (den === 0) return null;
  const m = num / den;
  const b = meanY - m * meanX;
  return { m, b };
}

export function ScatterChart({
  xs,
  ys,
  dates,
  xLabel,
  yLabel,
  color = "var(--chart-1)",
}: ScatterChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const { points, xTicks, yTicks, regressionLine, xMin, xMax, yMin, yMax } =
    useMemo(() => {
      if (xs.length === 0) {
        return {
          points: [],
          xTicks: [],
          yTicks: [],
          regressionLine: null,
          xMin: 0,
          xMax: 1,
          yMin: 0,
          yMax: 1,
        };
      }

      const xMinRaw = Math.min(...xs);
      const xMaxRaw = Math.max(...xs);
      const yMinRaw = Math.min(...ys);
      const yMaxRaw = Math.max(...ys);
      const xPad = (xMaxRaw - xMinRaw) * 0.08 || 1;
      const yPad = (yMaxRaw - yMinRaw) * 0.08 || 1;
      const xMin = xMinRaw - xPad;
      const xMax = xMaxRaw + xPad;
      const yMin = yMinRaw - yPad;
      const yMax = yMaxRaw + yPad;
      const xRange = xMax - xMin || 1;
      const yRange = yMax - yMin || 1;

      const points = xs.map((x, i) => ({
        idx: i,
        date: dates[i],
        x: PAD_L + ((x - xMin) / xRange) * CHART_W,
        y: PAD_T + CHART_H - ((ys[i] - yMin) / yRange) * CHART_H,
        rawX: x,
        rawY: ys[i],
      }));

      // Y ticks
      const ySteps = 5;
      const yTicks = Array.from({ length: ySteps + 1 }, (_, i) => {
        const v = yMin + (yRange * i) / ySteps;
        return { y: PAD_T + CHART_H - (i / ySteps) * CHART_H, label: fmtNumber(v) };
      });
      // X ticks
      const xSteps = 5;
      const xTicks = Array.from({ length: xSteps + 1 }, (_, i) => {
        const v = xMin + (xRange * i) / xSteps;
        return { x: PAD_L + (i / xSteps) * CHART_W, label: fmtNumber(v) };
      });

      // Regresión lineal
      const reg = linearRegression(xs, ys);
      let regressionLine: { x1: number; y1: number; x2: number; y2: number } | null =
        null;
      if (reg) {
        const yAtMinX = reg.m * xMin + reg.b;
        const yAtMaxX = reg.m * xMax + reg.b;
        regressionLine = {
          x1: PAD_L,
          y1: PAD_T + CHART_H - ((yAtMinX - yMin) / yRange) * CHART_H,
          x2: W - PAD_R,
          y2: PAD_T + CHART_H - ((yAtMaxX - yMin) / yRange) * CHART_H,
        };
      }

      return { points, xTicks, yTicks, regressionLine, xMin, xMax, yMin, yMax };
    }, [xs, ys, dates]);

  // Color de cada punto = índice temporal (azul claro → terracotta)
  function pointColor(idx: number): string {
    if (points.length <= 1) return color;
    const t = idx / (points.length - 1); // 0 = más viejo, 1 = más nuevo
    // Interpolación HSL del color base
    // Más viejo: más claro/desaturado. Más nuevo: más saturado.
    const opacity = 0.35 + t * 0.6;
    return `${color}`.includes("var(") ? color : color; // mantenemos el color, ajustamos opacity en el dot
    void opacity;
  }

  function pointOpacity(idx: number): number {
    if (points.length <= 1) return 1;
    const t = idx / (points.length - 1);
    return 0.35 + t * 0.6;
  }

  if (xs.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border text-sm"
        style={{
          aspectRatio: `${W}/${H}`,
          background: "var(--color-card)",
          borderColor: "var(--color-border)",
          color: "var(--color-text-muted)",
        }}
      >
        Las dos series no tienen períodos en común.
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border overflow-hidden relative"
      style={{
        background: "var(--color-card)",
        borderColor: "var(--color-border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ aspectRatio: `${W}/${H}`, display: "block" }}
        onMouseLeave={() => setHoverIdx(null)}
      >
        {/* Grid horizontal */}
        {yTicks.map((yt, i) => (
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
        {/* Grid vertical */}
        {xTicks.map((xt, i) => (
          <line
            key={`gx${i}`}
            x1={xt.x}
            y1={PAD_T}
            x2={xt.x}
            y2={PAD_T + CHART_H}
            stroke="var(--color-border)"
            strokeWidth="1"
            opacity={0.3}
          />
        ))}

        {/* Y labels */}
        {yTicks.map((yt, i) => (
          <text
            key={`yl${i}`}
            x={PAD_L - 10}
            y={yt.y}
            fontSize="14"
            fontWeight="500"
            textAnchor="end"
            dominantBaseline="middle"
            fill="var(--color-text-muted)"
            style={{ fontFamily: "var(--font-sans, system-ui)" }}
          >
            {yt.label}
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

        {/* Axis labels */}
        <text
          x={PAD_L + CHART_W / 2}
          y={H - 16}
          fontSize="14"
          fontWeight="700"
          textAnchor="middle"
          fill="var(--color-text)"
          style={{ fontFamily: "var(--font-sans, system-ui)" }}
        >
          {xLabel}
        </text>
        <text
          x={20}
          y={PAD_T + CHART_H / 2}
          fontSize="14"
          fontWeight="700"
          textAnchor="middle"
          fill="var(--color-text)"
          transform={`rotate(-90 20 ${PAD_T + CHART_H / 2})`}
          style={{ fontFamily: "var(--font-sans, system-ui)" }}
        >
          {yLabel}
        </text>

        {/* Linea de regresión */}
        {regressionLine && (
          <line
            x1={regressionLine.x1}
            y1={regressionLine.y1}
            x2={regressionLine.x2}
            y2={regressionLine.y2}
            stroke="var(--color-text-muted)"
            strokeWidth="2"
            strokeDasharray="6,4"
            opacity={0.7}
          />
        )}

        {/* Puntos */}
        {points.map((p) => (
          <circle
            key={p.idx}
            cx={p.x}
            cy={p.y}
            r={hoverIdx === p.idx ? 7 : 5}
            fill={color}
            stroke="var(--color-card)"
            strokeWidth={hoverIdx === p.idx ? 2 : 1.5}
            opacity={pointOpacity(p.idx)}
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setHoverIdx(p.idx)}
          />
        ))}
      </svg>

      {/* Tooltip */}
      {hoverIdx !== null && points[hoverIdx] && (
        <div
          className="absolute pointer-events-none px-3 py-2 rounded-lg text-xs"
          style={{
            left: `${(points[hoverIdx].x / W) * 100}%`,
            top: `${(points[hoverIdx].y / H) * 100}%`,
            transform:
              points[hoverIdx].x > W / 2
                ? "translate(-110%, -110%)"
                : "translate(10%, -110%)",
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-md)",
            color: "var(--color-text)",
            zIndex: 10,
          }}
        >
          <div className="font-bold" style={{ color: color }}>
            {fmtDate(points[hoverIdx].date)}
          </div>
          <div className="mt-1 tabular-nums" style={{ color: "var(--color-text-muted)" }}>
            {xLabel}: <span className="font-semibold" style={{ color: "var(--color-text)" }}>{fmtNumber(points[hoverIdx].rawX)}</span>
          </div>
          <div className="tabular-nums" style={{ color: "var(--color-text-muted)" }}>
            {yLabel}: <span className="font-semibold" style={{ color: "var(--color-text)" }}>{fmtNumber(points[hoverIdx].rawY)}</span>
          </div>
        </div>
      )}

      {/* Leyenda de gradient temporal */}
      <div
        className="px-4 py-2 text-[10px] flex items-center justify-between border-t"
        style={{
          color: "var(--color-text-muted)",
          borderColor: "var(--color-border)",
        }}
      >
        <span>← más antiguo</span>
        <span>los puntos más opacos son los más recientes</span>
        <span>más reciente →</span>
      </div>
    </div>
  );
}
