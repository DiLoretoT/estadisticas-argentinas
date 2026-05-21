"use client";

import { motion } from "framer-motion";
import { useCallback, useMemo, useRef, useState } from "react";
import { formatValue as fmtVal, formatDate, type FormatType } from "@/lib/formatters";

export interface ChartEvent {
  date: string;
  label: string;
  description?: string;
  category?: "crisis" | "devaluacion" | "default" | "politica";
}

interface AreaChartProps {
  data: [string, number][];
  color?: string;
  label?: string;
  format?: FormatType;
  /** Events to annotate as vertical markers on the chart. */
  events?: ChartEvent[];
  /** If provided, shows a "Descargar CSV" button. */
  csvFilename?: string;
  /** Show horizontal average line + label. Default false. */
  showAverage?: boolean;
  /** Show min/max markers + labels. Default true. */
  showExtremes?: boolean;
}

// SVG coordinate space — generoso a la derecha para end-labels.
const W = 1000;
const H = 380;
const PAD_L = 56;
const PAD_R = 86; // espacio para data label al final
const PAD_T = 24;
const PAD_B = 36;
const CHART_W = W - PAD_L - PAD_R;
const CHART_H = H - PAD_T - PAD_B;

function downloadCSV(data: [string, number][], filename: string) {
  const lines = ["fecha,valor"];
  for (const [date, value] of data) {
    lines.push(`${date},${value}`);
  }
  const csv = lines.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Text with white halo (paint-order: stroke). Lo usa Datawrapper por default
 * para que las etiquetas no choquen con grid lines o áreas.
 */
function HaloText({
  x,
  y,
  fill,
  fontSize = 13,
  fontWeight = 600,
  textAnchor = "start",
  dominantBaseline = "middle",
  children,
}: {
  x: number;
  y: number;
  fill: string;
  fontSize?: number;
  fontWeight?: number | string;
  textAnchor?: "start" | "middle" | "end";
  dominantBaseline?: "auto" | "middle" | "central" | "hanging";
  children: React.ReactNode;
}) {
  return (
    <text
      x={x}
      y={y}
      fontSize={fontSize}
      fontWeight={fontWeight}
      textAnchor={textAnchor}
      dominantBaseline={dominantBaseline}
      fill={fill}
      stroke="var(--color-card)"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      paintOrder="stroke"
      style={{ fontFamily: "var(--font-sans, system-ui)" }}
    >
      {children}
    </text>
  );
}

export function AreaChart({
  data,
  color = "var(--color-primary)",
  label,
  format = "decimal",
  events = [],
  csvFilename,
  showAverage = false,
  showExtremes = true,
}: AreaChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [hoverEvent, setHoverEvent] = useState<number | null>(null);
  const fmt = useCallback((v: number) => fmtVal(v, format), [format]);

  // Compute event positions
  const eventMarkers = useMemo(() => {
    if (!data.length || !events.length) return [];
    const firstDate = new Date(data[0][0]).getTime();
    const lastDate = new Date(data[data.length - 1][0]).getTime();
    const range = lastDate - firstDate;
    if (range <= 0) return [];
    return events
      .map((ev) => {
        const t = new Date(ev.date).getTime();
        if (isNaN(t) || t < firstDate || t > lastDate) return null;
        const x = PAD_L + ((t - firstDate) / range) * CHART_W;
        return { ...ev, x };
      })
      .filter((m): m is ChartEvent & { x: number } => m !== null);
  }, [data, events]);

  const {
    points,
    linePath,
    areaPath,
    yTicks,
    xTicks,
    minPoint,
    maxPoint,
    avgValue,
    avgY,
  } = useMemo(() => {
    if (!data.length)
      return {
        points: [] as Array<{ x: number; y: number; date: string; value: number }>,
        linePath: "",
        areaPath: "",
        yTicks: [] as Array<{ y: number; label: string }>,
        xTicks: [] as Array<{ x: number; label: string }>,
        minPoint: null as null | { x: number; y: number; value: number; date: string },
        maxPoint: null as null | { x: number; y: number; value: number; date: string },
        avgValue: 0,
        avgY: 0,
      };

    const vals = data.map((d) => d[1]);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const sum = vals.reduce((a, b) => a + b, 0);
    const avg = sum / vals.length;
    const span = max - min || Math.abs(max) || 1;

    // Eje Y: si los datos están todos ≥ 0 y el rango es razonable, anclamos a 0.
    // Si no, padding del 10% arriba/abajo.
    let adjMin: number;
    let adjMax: number;
    if (min >= 0 && min < span * 0.5) {
      adjMin = 0;
      adjMax = max + span * 0.12;
    } else {
      adjMin = min - span * 0.1;
      adjMax = max + span * 0.12;
    }
    const yRange = adjMax - adjMin || 1;

    const pts = data.map((d, i) => ({
      x: PAD_L + (i / Math.max(data.length - 1, 1)) * CHART_W,
      y: PAD_T + CHART_H - ((d[1] - adjMin) / yRange) * CHART_H,
      date: d[0],
      value: d[1],
    }));

    const lineD = pts
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join("");
    const areaD = `${lineD}L${pts[pts.length - 1].x.toFixed(1)},${PAD_T + CHART_H}L${pts[0].x.toFixed(1)},${PAD_T + CHART_H}Z`;

    // Y ticks "nice" (5 estimados)
    const ySteps = 4;
    const yTs = Array.from({ length: ySteps + 1 }, (_, i) => {
      const v = adjMin + (yRange * i) / ySteps;
      return { y: PAD_T + CHART_H - (i / ySteps) * CHART_H, label: fmt(v) };
    });

    // X ticks: 5 puntos espaciados
    const xCount = Math.min(5, data.length);
    const xTs = Array.from({ length: xCount }, (_, i) => {
      const idx = Math.round((i / Math.max(xCount - 1, 1)) * (data.length - 1));
      return { x: pts[idx].x, label: formatDate(data[idx][0]) };
    });

    // Min/max points
    let minIdx = 0;
    let maxIdx = 0;
    for (let i = 1; i < vals.length; i++) {
      if (vals[i] < vals[minIdx]) minIdx = i;
      if (vals[i] > vals[maxIdx]) maxIdx = i;
    }

    const avgYpos = PAD_T + CHART_H - ((avg - adjMin) / yRange) * CHART_H;

    return {
      points: pts,
      linePath: lineD,
      areaPath: areaD,
      yTicks: yTs,
      xTicks: xTs,
      minPoint: { ...pts[minIdx] },
      maxPoint: { ...pts[maxIdx] },
      avgValue: avg,
      avgY: avgYpos,
    };
  }, [data, fmt]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current || !points.length) return;
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * W;
      let closest = 0;
      let minDist = Infinity;
      for (let i = 0; i < points.length; i++) {
        const dist = Math.abs(points[i].x - mouseX);
        if (dist < minDist) {
          minDist = dist;
          closest = i;
        }
      }
      setHoverIdx(closest);
    },
    [points],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<SVGSVGElement>) => {
      if (!svgRef.current || !points.length) return;
      const touch = e.touches[0];
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = ((touch.clientX - rect.left) / rect.width) * W;
      let closest = 0;
      let minDist = Infinity;
      for (let i = 0; i < points.length; i++) {
        const dist = Math.abs(points[i].x - mouseX);
        if (dist < minDist) {
          minDist = dist;
          closest = i;
        }
      }
      setHoverIdx(closest);
    },
    [points],
  );

  if (!data.length) {
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
        Sin datos
      </div>
    );
  }

  const last = points[points.length - 1];
  const hoveredPt = hoverIdx !== null ? points[hoverIdx] : null;
  const hoveredPrev = hoverIdx !== null && hoverIdx > 0 ? points[hoverIdx - 1] : null;
  const gradId = `grad-${(label || "c").replace(/[^a-zA-Z0-9]/g, "")}`;

  // ¿Dónde poner el label del máximo? Por arriba del punto.
  // ¿Y el mínimo? Por debajo.
  // Para evitar colisión con el end-label, sólo los mostramos si están suficientemente lejos del último punto.
  const showMaxLabel =
    showExtremes &&
    maxPoint !== null &&
    Math.abs((maxPoint?.x ?? 0) - last.x) > 50;
  const showMinLabel =
    showExtremes &&
    minPoint !== null &&
    Math.abs((minPoint?.x ?? 0) - last.x) > 50 &&
    minPoint?.value !== maxPoint?.value;

  return (
    <div
      className="rounded-xl border overflow-hidden relative"
      style={{
        background: "var(--color-card)",
        borderColor: "var(--color-border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Header */}
      {label && (
        <div className="px-4 pt-3 pb-1 flex items-baseline justify-between gap-2">
          <span
            className="text-xs font-semibold uppercase tracking-wider truncate"
            style={{ color: "var(--color-text-muted)" }}
          >
            {label}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="text-sm font-bold tabular-nums"
              style={{ color: color }}
            >
              {hoveredPt ? fmt(hoveredPt.value) : fmt(last.value)}
            </span>
            {csvFilename && (
              <button
                onClick={() => downloadCSV(data, csvFilename)}
                className="text-[10px] font-medium px-1.5 py-0.5 rounded transition-colors duration-150"
                style={{
                  color: "var(--color-text-muted)",
                  border: "1px solid var(--color-border)",
                }}
                aria-label="Descargar serie como CSV"
                title="Descargar como CSV"
              >
                CSV
              </button>
            )}
          </div>
        </div>
      )}

      {/* SVG */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ aspectRatio: `${W}/${H}`, display: "block" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => setHoverIdx(null)}
      >
        {/* Horizontal grid lines (no verticales) */}
        {yTicks.map((yt, i) => (
          <line
            key={i}
            x1={PAD_L}
            y1={yt.y}
            x2={W - PAD_R}
            y2={yt.y}
            stroke="var(--color-border)"
            strokeWidth="1"
            opacity={i === 0 ? 0.9 : 0.5}
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
            {yt.label}
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
            {xt.label}
          </text>
        ))}

        {/* Gradient para el area */}
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Average horizontal line */}
        {showAverage && (
          <>
            <line
              x1={PAD_L}
              y1={avgY}
              x2={W - PAD_R}
              y2={avgY}
              stroke="var(--color-text-muted)"
              strokeWidth="1"
              strokeDasharray="5,4"
              opacity={0.5}
            />
            <HaloText
              x={W - PAD_R - 4}
              y={avgY - 4}
              fill="var(--color-text-muted)"
              fontSize={11}
              fontWeight={500}
              textAnchor="end"
              dominantBaseline="auto"
            >
              Prom. {fmt(avgValue)}
            </HaloText>
          </>
        )}

        {/* Area */}
        <motion.path
          d={areaPath}
          fill={`url(#${gradId})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        />

        {/* Line */}
        <motion.path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />

        {/* Min/Max markers */}
        {showMaxLabel && maxPoint && (
          <>
            <circle cx={maxPoint.x} cy={maxPoint.y} r={3.5} fill={color} />
            <HaloText
              x={maxPoint.x}
              y={maxPoint.y - 10}
              fill="var(--color-text)"
              fontSize={11}
              fontWeight={600}
              textAnchor="middle"
              dominantBaseline="auto"
            >
              ▲ {fmt(maxPoint.value)}
            </HaloText>
          </>
        )}
        {showMinLabel && minPoint && (
          <>
            <circle cx={minPoint.x} cy={minPoint.y} r={3.5} fill={color} />
            <HaloText
              x={minPoint.x}
              y={minPoint.y + 14}
              fill="var(--color-text-muted)"
              fontSize={11}
              fontWeight={500}
              textAnchor="middle"
              dominantBaseline="hanging"
            >
              ▼ {fmt(minPoint.value)}
            </HaloText>
          </>
        )}

        {/* Event annotations */}
        {eventMarkers.map((ev, i) => (
          <g
            key={`ev-${i}`}
            onMouseEnter={() => setHoverEvent(i)}
            onMouseLeave={() => setHoverEvent(null)}
            style={{ cursor: "help" }}
          >
            <line
              x1={ev.x}
              y1={PAD_T}
              x2={ev.x}
              y2={PAD_T + CHART_H}
              stroke="var(--color-text-muted)"
              strokeWidth={hoverEvent === i ? 1.5 : 1}
              strokeDasharray="3,3"
              opacity={hoverEvent === i ? 0.85 : 0.4}
            />
            <circle
              cx={ev.x}
              cy={PAD_T + 8}
              r={hoverEvent === i ? 7 : 5}
              fill="var(--color-card)"
              stroke="var(--color-text-muted)"
              strokeWidth="1.5"
            />
            <text
              x={ev.x}
              y={PAD_T + 12}
              fontSize="10"
              textAnchor="middle"
              fill="var(--color-text-muted)"
              fontWeight="700"
              pointerEvents="none"
              style={{ fontFamily: "var(--font-sans, system-ui)" }}
            >
              !
            </text>
            <rect
              x={ev.x - 8}
              y={PAD_T}
              width={16}
              height={CHART_H}
              fill="transparent"
            />
          </g>
        ))}

        {/* End-label: el valor actual a la derecha de la línea */}
        <circle cx={last.x} cy={last.y} r={4} fill={color} stroke="var(--color-card)" strokeWidth="2" />
        <HaloText
          x={last.x + 7}
          y={last.y}
          fill={color}
          fontSize={14}
          fontWeight={700}
          textAnchor="start"
          dominantBaseline="middle"
        >
          {fmt(last.value)}
        </HaloText>

        {/* Hover crosshair + dot */}
        {hoveredPt && hoveredPt !== last && (
          <>
            <line
              x1={hoveredPt.x}
              y1={PAD_T}
              x2={hoveredPt.x}
              y2={PAD_T + CHART_H}
              stroke="var(--color-text-muted)"
              strokeWidth="1"
              strokeDasharray="4,3"
              opacity="0.5"
            />
            <circle
              cx={hoveredPt.x}
              cy={hoveredPt.y}
              r="5"
              fill={color}
              stroke="var(--color-card)"
              strokeWidth="2"
            />
          </>
        )}
      </svg>

      {/* Event tooltip */}
      {hoverEvent !== null && eventMarkers[hoverEvent] && (
        <div
          className="absolute pointer-events-none px-3 py-2 rounded-lg text-xs max-w-[220px]"
          style={{
            left: `${(eventMarkers[hoverEvent].x / W) * 100}%`,
            top: "18%",
            transform:
              eventMarkers[hoverEvent].x > W / 2
                ? "translate(-105%, 0)"
                : "translate(5%, 0)",
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-md)",
            color: "var(--color-text)",
            zIndex: 11,
          }}
        >
          <div className="font-semibold" style={{ color: "var(--color-text)" }}>
            {eventMarkers[hoverEvent].label}
          </div>
          <div
            className="tabular-nums mt-0.5"
            style={{ color: "var(--color-text-muted)", fontSize: 10 }}
          >
            {formatDate(eventMarkers[hoverEvent].date)}
          </div>
          {eventMarkers[hoverEvent].description && (
            <div
              className="mt-1.5 leading-snug"
              style={{ color: "var(--color-text-muted)" }}
            >
              {eventMarkers[hoverEvent].description}
            </div>
          )}
        </div>
      )}

      {/* Tooltip de punto */}
      {hoveredPt && hoveredPt !== last && (
        <div
          className="absolute pointer-events-none px-3 py-2 rounded-lg text-xs"
          style={{
            left: `${(hoveredPt.x / W) * 100}%`,
            top: "50%",
            transform:
              hoveredPt.x > W / 2
                ? "translate(-110%, -50%)"
                : "translate(10%, -50%)",
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-md)",
            color: "var(--color-text)",
            zIndex: 10,
          }}
        >
          <div className="font-bold tabular-nums" style={{ color: color }}>
            {fmt(hoveredPt.value)}
          </div>
          <div style={{ color: "var(--color-text-muted)" }}>
            {formatDate(hoveredPt.date)}
          </div>
          {hoveredPrev && (
            <div
              style={{ color: "var(--color-text-muted)", marginTop: 2 }}
            >
              vs ant:{" "}
              {hoveredPt.value - hoveredPrev.value >= 0 ? "+" : ""}
              {fmt(hoveredPt.value - hoveredPrev.value)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
