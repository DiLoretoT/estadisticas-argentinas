"use client";

import { useState } from "react";
import Link from "next/link";
import { AreaChart, type ChartEvent } from "@/components/AreaChart";
import { DataTable } from "@/components/DataTable";
import { SpanSelector, filterBySpan } from "@/components/SpanSelector";
import { JsonLd } from "@/components/JsonLd";
import { DETALLE_SEO, detalleJsonLd, type DatasetRange } from "@/lib/detalleSeo";
import type { FormatType } from "@/lib/formatters";

interface ChartConfig {
  data: [string, number][];
  label: string;
  color: string;
  format?: FormatType;
  events?: ChartEvent[];
  csvFilename?: string;
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
  /** Slug de `/detalle/<slug>`: si está, inyecta JSON-LD + intro + FAQ. */
  slug?: string;
  /** Rango temporal de la serie principal, para el temporalCoverage del Dataset. */
  datasetRange?: DatasetRange;
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
  slug,
  datasetRange,
}: DetailPageProps) {
  const [span, setSpan] = useState("5A");
  const heading = (slug && DETALLE_SEO[slug]?.h1) || title;

  return (
    <>
      {slug && <JsonLd data={detalleJsonLd(slug, datasetRange)} />}
      <div
        className="mx-auto max-w-5xl px-5"
        style={{ paddingTop: "calc(var(--navbar-h) + 2.5rem)", paddingBottom: "4rem" }}
      >
      <div>
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
      </div>

      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-2" style={{ color: "var(--color-primary)" }}>
          {eyebrow}
        </p>
        <h1 className="text-3xl md:text-4xl font-bold" style={{ color: "var(--color-text)" }}>
          {heading}
        </h1>
        <p className="mt-2 text-sm max-w-xl" style={{ color: "var(--color-text-muted)" }}>
          {subtitle}
        </p>
        {slug && DETALLE_SEO[slug]?.intro && (
          <p
            className="mt-4 text-base max-w-2xl leading-relaxed"
            style={{ color: "var(--color-text-muted)" }}
          >
            {DETALLE_SEO[slug].intro}
          </p>
        )}
      </div>

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
            events={chart.events}
            csvFilename={chart.csvFilename}
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
      <div
        className="rounded-xl border p-6"
        style={{ background: "var(--color-card)", borderColor: "var(--color-border)", boxShadow: "var(--shadow-sm)" }}
      >
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--color-text)" }}>
          Notas metodológicas
        </h3>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>{notes}</p>
        <div className="mt-4 flex gap-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
          <span>Fuente: {source}</span>
          <span>Frecuencia: {frequency}</span>
        </div>
      </div>

      {slug && DETALLE_SEO[slug]?.faqs?.length ? (
        <section className="mt-10">
          <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-text)" }}>
            Preguntas frecuentes
          </h2>
          <div className="space-y-3">
            {DETALLE_SEO[slug].faqs.map((f) => (
              <details
                key={f.q}
                className="rounded-xl border p-4"
                style={{ background: "var(--color-card)", borderColor: "var(--color-border)" }}
              >
                <summary
                  className="text-sm font-semibold cursor-pointer"
                  style={{ color: "var(--color-text)" }}
                >
                  {f.q}
                </summary>
                <p
                  className="mt-2 text-sm leading-relaxed"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </section>
      ) : null}
      </div>
    </>
  );
}
