"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { formatValue as fmtVal, type FormatType } from "@/lib/formatters";

interface AreaChartProps {
  data: [string, number][];
  color?: string;
  height?: number;
  showGrid?: boolean;
  label?: string;
  format?: FormatType;
}

export function AreaChart({
  data,
  color = "var(--color-primary)",
  height = 200,
  showGrid = true,
  label,
  format = "decimal",
}: AreaChartProps) {
  const fmt = (v: number) => fmtVal(v, format);

  const { path, areaPath, points, yLabels, xLabels } = useMemo(() => {
    if (!data.length)
      return { path: "", areaPath: "", points: [] as { x: number; y: number; value: number }[], yLabels: [] as { y: number; label: string }[], xLabels: [] as { x: number; label: string }[] };

    const vals = data.map((d) => d[1]);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const pad = (max - min) * 0.1 || 1;
    const yMin = min - pad;
    const yMax = max + pad;

    const w = 100;
    const h = 100;

    const pts = data.map((d, i) => ({
      x: (i / (data.length - 1)) * w,
      y: h - ((d[1] - yMin) / (yMax - yMin)) * h,
      value: d[1],
    }));

    const pathD = pts
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
      .join(" ");
    const areaD = `${pathD} L${pts[pts.length - 1].x},${h} L${pts[0].x},${h} Z`;

    const ySteps = 4;
    const yLbls = Array.from({ length: ySteps + 1 }, (_, i) => {
      const v = yMin + ((yMax - yMin) * i) / ySteps;
      return { y: h - (i / ySteps) * h, label: fmt(v) };
    });

    const xIdxs = [0, Math.floor(data.length / 2), data.length - 1];
    const xLbls = xIdxs.map((idx) => ({
      x: pts[idx].x,
      label: data[idx][0].slice(0, 7),
    }));

    return { path: pathD, areaPath: areaD, points: pts, yLabels: yLbls, xLabels: xLbls };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, format]);

  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border"
        style={{
          height,
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
  const gradId = `grad-${(label || "chart").replace(/\s/g, "-")}`;

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        background: "var(--color-card)",
        borderColor: "var(--color-border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {label && (
        <div className="px-4 pt-4 pb-1 flex items-baseline justify-between">
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-text-muted)" }}
          >
            {label}
          </span>
          <span className="text-sm font-bold tabular-nums" style={{ color }}>
            {fmt(last.value)}
          </span>
        </div>
      )}
      <svg
        viewBox="-8 -4 116 118"
        preserveAspectRatio="none"
        style={{ width: "100%", height, display: "block" }}
      >
        {showGrid &&
          yLabels.map((yl, i) => (
            <line
              key={i}
              x1="0"
              y1={yl.y}
              x2="100"
              y2={yl.y}
              stroke="var(--color-border)"
              strokeWidth="0.3"
              strokeDasharray="2,2"
            />
          ))}

        {yLabels.map((yl, i) => (
          <text
            key={`y${i}`}
            x="-2"
            y={yl.y + 1}
            fontSize="3"
            textAnchor="end"
            fill="var(--color-text-muted)"
          >
            {yl.label}
          </text>
        ))}

        {xLabels.map((xl, i) => (
          <text
            key={`x${i}`}
            x={xl.x}
            y="108"
            fontSize="3"
            textAnchor="middle"
            fill="var(--color-text-muted)"
          >
            {xl.label}
          </text>
        ))}

        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        <motion.path
          d={areaPath}
          fill={`url(#${gradId})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        />

        <motion.path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />

        <motion.circle
          cx={last.x}
          cy={last.y}
          r="1.8"
          fill={color}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1.5, type: "spring" }}
        />
      </svg>
    </div>
  );
}
