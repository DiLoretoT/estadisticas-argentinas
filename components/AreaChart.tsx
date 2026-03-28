"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatValue as fmtVal, formatDate, type FormatType } from "@/lib/formatters";

interface AreaChartProps {
  data: [string, number][];
  color?: string;
  label?: string;
  format?: FormatType;
}

/** Resolve a CSS variable to a hex color at runtime. */
function useResolvedColor(cssVar: string) {
  const ref = useRef<HTMLDivElement>(null);
  const [hex, setHex] = useState(cssVar);

  useEffect(() => {
    if (!ref.current || !cssVar.startsWith("var(")) {
      setHex(cssVar);
      return;
    }
    const varName = cssVar.slice(4, -1);
    const resolved = getComputedStyle(ref.current).getPropertyValue(varName).trim();
    if (resolved) setHex(resolved);
  }, [cssVar]);

  // Re-resolve when theme changes (dark ↔ light)
  useEffect(() => {
    if (!ref.current || !cssVar.startsWith("var(")) return;
    const obs = new MutationObserver(() => {
      const varName = cssVar.slice(4, -1);
      const resolved = getComputedStyle(ref.current!).getPropertyValue(varName).trim();
      if (resolved) setHex(resolved);
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, [cssVar]);

  return { ref, hex };
}

// SVG coordinate space
const W = 1000;
const H = 400;
const PAD_L = 60;
const PAD_R = 10;
const PAD_T = 10;
const PAD_B = 30;
const CHART_W = W - PAD_L - PAD_R;
const CHART_H = H - PAD_T - PAD_B;

export function AreaChart({
  data,
  color = "var(--color-primary)",
  label,
  format = "decimal",
}: AreaChartProps) {
  const { ref: containerRef, hex: resolvedColor } = useResolvedColor(color);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const fmt = useCallback((v: number) => fmtVal(v, format), [format]);

  const { points, linePath, areaPath, yTicks, xTicks, yMin, yMax } = useMemo(() => {
    if (!data.length)
      return { points: [], linePath: "", areaPath: "", yTicks: [], xTicks: [], yMin: 0, yMax: 0 };

    const vals = data.map((d) => d[1]);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const pad = (max - min) * 0.1 || 1;
    const adjMin = min - pad;
    const adjMax = max + pad;

    const pts = data.map((d, i) => ({
      x: PAD_L + (i / Math.max(data.length - 1, 1)) * CHART_W,
      y: PAD_T + CHART_H - ((d[1] - adjMin) / (adjMax - adjMin)) * CHART_H,
      date: d[0],
      value: d[1],
    }));

    const lineD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join("");
    const areaD = `${lineD}L${pts[pts.length - 1].x.toFixed(1)},${PAD_T + CHART_H}L${pts[0].x.toFixed(1)},${PAD_T + CHART_H}Z`;

    const ySteps = 5;
    const yTs = Array.from({ length: ySteps + 1 }, (_, i) => {
      const v = adjMin + ((adjMax - adjMin) * i) / ySteps;
      return { y: PAD_T + CHART_H - (i / ySteps) * CHART_H, label: fmt(v) };
    });

    // Smart X ticks: ~5-6 evenly spaced
    const xCount = Math.min(6, data.length);
    const xTs = Array.from({ length: xCount }, (_, i) => {
      const idx = Math.round((i / (xCount - 1)) * (data.length - 1));
      return { x: pts[idx].x, label: formatDate(data[idx][0]) };
    });

    return { points: pts, linePath: lineD, areaPath: areaD, yTicks: yTs, xTicks: xTs, yMin: adjMin, yMax: adjMax };
  }, [data, fmt]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current || !points.length) return;
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * W;
      // Find closest point
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
    [points]
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
    [points]
  );

  if (!data.length) {
    return (
      <div
        ref={containerRef}
        className="flex items-center justify-center rounded-xl border text-sm"
        style={{
          aspectRatio: "5/2",
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

  return (
    <div
      ref={containerRef}
      className="rounded-xl border overflow-hidden relative"
      style={{
        background: "var(--color-card)",
        borderColor: "var(--color-border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Header */}
      {label && (
        <div className="px-4 pt-3 pb-1 flex items-baseline justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
            {label}
          </span>
          <span className="text-sm font-bold tabular-nums" style={{ color: resolvedColor }}>
            {hoveredPt ? fmt(hoveredPt.value) : fmt(last.value)}
          </span>
        </div>
      )}

      {/* SVG Chart */}
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
        {/* Grid lines */}
        {yTicks.map((yt, i) => (
          <line key={i} x1={PAD_L} y1={yt.y} x2={W - PAD_R} y2={yt.y} stroke="var(--color-border)" strokeWidth="1" strokeDasharray="4,4" />
        ))}

        {/* Y axis labels */}
        {yTicks.map((yt, i) => (
          <text key={`y${i}`} x={PAD_L - 8} y={yt.y + 4} fontSize="11" textAnchor="end" fill="var(--color-text-muted)" fontFamily="var(--font-sans, system-ui)">
            {yt.label}
          </text>
        ))}

        {/* X axis labels */}
        {xTicks.map((xt, i) => (
          <text key={`x${i}`} x={xt.x} y={H - 4} fontSize="11" textAnchor="middle" fill="var(--color-text-muted)" fontFamily="var(--font-sans, system-ui)">
            {xt.label}
          </text>
        ))}

        {/* Gradient */}
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={resolvedColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={resolvedColor} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <motion.path
          d={areaPath}
          fill={`url(#${gradId})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />

        {/* Line */}
        <motion.path
          d={linePath}
          fill="none"
          stroke={resolvedColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />

        {/* Hover crosshair + dot */}
        {hoveredPt && (
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
            <circle cx={hoveredPt.x} cy={hoveredPt.y} r="5" fill={resolvedColor} stroke="var(--color-card)" strokeWidth="2" />
          </>
        )}
      </svg>

      {/* Tooltip */}
      {hoveredPt && (
        <div
          className="absolute pointer-events-none px-3 py-2 rounded-lg text-xs"
          style={{
            left: `${(hoveredPt.x / W) * 100}%`,
            top: "50%",
            transform: hoveredPt.x > W / 2 ? "translate(-110%, -50%)" : "translate(10%, -50%)",
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-md)",
            color: "var(--color-text)",
            zIndex: 10,
          }}
        >
          <div className="font-semibold" style={{ color: resolvedColor }}>
            {fmt(hoveredPt.value)}
          </div>
          <div style={{ color: "var(--color-text-muted)" }}>
            {formatDate(hoveredPt.date)}
          </div>
          {hoveredPrev && (
            <div style={{ color: "var(--color-text-muted)", marginTop: 2 }}>
              vs ant: {((hoveredPt.value - hoveredPrev.value) >= 0 ? "+" : "")}{fmt(hoveredPt.value - hoveredPrev.value)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
