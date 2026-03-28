"use client";

import { motion } from "framer-motion";

interface KpiCardProps {
  label: string;
  value: string;
  detail?: string;
  trend?: "up" | "down" | "neutral";
  accentColor?: string;
  delay?: number;
}

export function KpiCard({
  label,
  value,
  detail,
  trend,
  accentColor = "var(--color-primary)",
  delay = 0,
}: KpiCardProps) {
  const trendIcon =
    trend === "up" ? "↑" : trend === "down" ? "↓" : "";
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
      className="rounded-xl p-5 border cursor-default"
      style={{
        background: "var(--color-card)",
        borderColor: "var(--color-border)",
        boxShadow: "var(--shadow-sm)",
        borderTop: `3px solid ${accentColor}`,
      }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-wider mb-2"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <span
          className="text-2xl font-bold tabular-nums"
          style={{ color: accentColor }}
        >
          {value}
        </span>
        {trendIcon && (
          <span className="text-sm font-semibold" style={{ color: trendColor }}>
            {trendIcon}
          </span>
        )}
      </div>
      {detail && (
        <p
          className="text-xs mt-1.5"
          style={{ color: "var(--color-text-muted)" }}
        >
          {detail}
        </p>
      )}
    </motion.div>
  );
}
