"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { formatValue as fmtVal, formatDate, type FormatType } from "@/lib/formatters";

interface DataTableProps {
  title: string;
  data: [string, number][];
  valueLabel?: string;
  format?: FormatType;
  maxRows?: number;
}

export function DataTable({
  title,
  data,
  valueLabel = "Valor",
  format = "decimal",
  maxRows = 12,
}: DataTableProps) {
  const [showAll, setShowAll] = useState(false);
  const reversed = [...data].reverse();
  const rows = showAll ? reversed : reversed.slice(0, maxRows);
  const fmt = (v: number) => fmtVal(v, format);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5 }}
      className="rounded-xl border overflow-hidden"
      style={{
        background: "var(--color-card)",
        borderColor: "var(--color-border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="px-4 py-3 border-b" style={{ borderColor: "var(--color-border)" }}>
        <h3 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
          {title}
        </h3>
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: showAll ? "500px" : undefined }}>
        <table className="w-full text-sm">
          <thead className="sticky top-0" style={{ background: "var(--color-bg-alt)" }}>
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                Periodo
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                {valueLabel}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([date, value], i) => (
              <tr
                key={date}
                className="transition-colors duration-100"
                style={{
                  borderBottom: "1px solid var(--color-border)",
                  background: i % 2 === 1 ? "var(--color-bg-alt)" : "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--color-primary-soft)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = i % 2 === 1 ? "var(--color-bg-alt)" : "transparent";
                }}
              >
                <td className="px-4 py-2" style={{ color: "var(--color-text)" }}>
                  {formatDate(date)}
                </td>
                <td className="px-4 py-2 text-right font-medium tabular-nums" style={{ color: "var(--color-text)" }}>
                  {fmt(value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length > maxRows && (
        <div className="px-4 py-2.5 text-center border-t" style={{ borderColor: "var(--color-border)" }}>
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs font-medium px-3 py-1 rounded-md transition-colors duration-200"
            style={{ color: "var(--color-primary)", background: "var(--color-primary-soft)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-primary)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--color-primary-soft)";
              e.currentTarget.style.color = "var(--color-primary)";
            }}
          >
            {showAll ? "Ver menos" : `Ver todos (${data.length})`}
          </button>
        </div>
      )}
    </motion.div>
  );
}
