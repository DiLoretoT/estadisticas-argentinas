"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { AreaChart } from "@/components/AreaChart";
import { DataTable } from "@/components/DataTable";
import { SpanSelector, filterBySpan } from "@/components/SpanSelector";
import type { FormatType } from "@/lib/formatters";

interface ChartConfig {
  data: [string, number][];
  label: string;
  color: string;
  format?: FormatType;
}

interface TableConfig {
  title: string;
  data: [string, number][];
  valueLabel: string;
  format?: FormatType;
}

interface DetailPageProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  charts: ChartConfig[];
  tables: TableConfig[];
  notes: string;
  source: string;
  frequency: string;
}

export function DetailPage({
  eyebrow,
  title,
  subtitle,
  charts,
  tables,
  notes,
  source,
  frequency,
}: DetailPageProps) {
  const [span, setSpan] = useState("5A");

  return (
    <div
      className="mx-auto max-w-5xl px-5"
      style={{ paddingTop: "calc(var(--navbar-h) + 2.5rem)", paddingBottom: "4rem" }}
    >
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium mb-6 transition-colors duration-200"
          style={{ color: "var(--color-text-muted)" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-primary)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-muted)"; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Volver
        </Link>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-2" style={{ color: "var(--color-primary)" }}>
          {eyebrow}
        </p>
        <h1 className="text-3xl md:text-4xl font-bold" style={{ color: "var(--color-text)" }}>
          {title}
        </h1>
        <p className="mt-2 text-sm max-w-xl" style={{ color: "var(--color-text-muted)" }}>
          {subtitle}
        </p>
      </motion.div>

      {/* Span selector */}
      <div className="mb-4">
        <SpanSelector active={span} onChange={setSpan} />
      </div>

      {/* Charts */}
      <div className={`grid gap-5 mb-10 ${charts.length > 1 ? "md:grid-cols-2" : ""}`}>
        {charts.map((chart) => (
          <AreaChart
            key={chart.label}
            data={filterBySpan(chart.data, span)}
            label={chart.label}
            color={chart.color}
            format={chart.format}
          />
        ))}
      </div>

      {/* Tables */}
      <div className={`grid gap-5 mb-10 ${tables.length > 1 ? "md:grid-cols-2" : ""}`}>
        {tables.map((table) => (
          <DataTable
            key={table.title}
            title={table.title}
            data={table.data}
            valueLabel={table.valueLabel}
            format={table.format}
          />
        ))}
      </div>

      {/* Notes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="rounded-xl border p-6"
        style={{ background: "var(--color-card)", borderColor: "var(--color-border)", boxShadow: "var(--shadow-sm)" }}
      >
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--color-text)" }}>
          Notas metodologicas
        </h3>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{notes}</p>
        <div className="mt-4 flex gap-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
          <span>Fuente: {source}</span>
          <span>Frecuencia: {frequency}</span>
        </div>
      </motion.div>
    </div>
  );
}
