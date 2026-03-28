"use client";

import { motion } from "framer-motion";

interface KpiCardProps {
  label: string;
  value: string;
  detail?: string;
  trend?: "up" | "down" | "neutral";
  accentColor?: string;
  delay?: number;
  sparkData?: number[];
}

export function KpiCard({
  label,
  value,
  detail,
  trend,
  accentColor = "var(--color-primary)",
  delay = 0,
  sparkData,
}: KpiCardProps) {
  const trendIcon = trend === "up" ? "↑" : trend === "down" ? "↓" : "";
  const trendColor =
    trend === "up"
      ? "var(--color-danger)"
      : trend === "down"
        ? "var(--color-success)"
        : "var(--color-text-muted)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -2, boxShadow: "var(--shadow-md)" }}
      className="rounded-xl p-4 border cursor-default"
      style={{
        background: "var(--color-card)",
        borderColor: "var(--color-border)",
        boxShadow: "var(--shadow-sm)",
        borderTop: `3px solid ${accentColor}`,
      }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-wider mb-1.5"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </p>
      <div className="flex items-end justify-between gap-2">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-xl font-bold tabular-nums leading-none"
              style={{ color: accentColor }}
            >
              {value}
            </span>
            {trendIcon && (
              <span className="text-xs font-semibold" style={{ color: trendColor }}>
                {trendIcon}
              </span>
            )}
          </div>
          {detail && (
            <p
              className="text-[10px] mt-1"
              style={{ color: "var(--color-text-muted)" }}
            >
              {detail}
            </p>
          )}
        </div>

        {/* Sparkline */}
        {sparkData && sparkData.length > 1 && <Sparkline data={sparkData} color={accentColor} />}
      </div>
    </motion.div>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 60;
  const h = 24;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} className="flex-shrink-0 opacity-60">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
