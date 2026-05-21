"use client";

import { Hero } from "@/components/Hero";
import { KpiCard } from "@/components/KpiCard";
import { AreaChart } from "@/components/AreaChart";
import { SectionHeader } from "@/components/SectionHeader";
import { LinkCard } from "@/components/LinkCard";
import { Footer } from "@/components/Footer";

interface Props {
  inflacion: Record<string, unknown>;
  dolarOficial: Record<string, unknown>;
  dolarBlue: Record<string, unknown>;
  empleo: Record<string, unknown>;
  pobreza: Record<string, unknown>;
  lastUpdated?: string;
  series: {
    inflacion: [string, number][];
    dolarOficial: [string, number][];
    dolarBlue: [string, number][];
    ripte: [string, number][];
    emae: [string, number][];
    pbi: [string, number][];
    desocupacion: [string, number][];
    pobreza: [string, number][];
  };
}

function pctValue(v: unknown, multiplier: 1 | 100): string {
  if (v == null) return "—";
  const n = Number(v);
  if (isNaN(n)) return "—";
  return (n * multiplier).toLocaleString("es-AR", { maximumFractionDigits: 1 }) + "%";
}

// Inflación viene del ETL ya en %: 2.62 → "2,6%"
const pctFromPercent = (v: unknown) => pctValue(v, 1);

// Tasas (desocupación, pobreza, empleo) vienen en ratio decimal: 0.07 → "7,0%"
const pctFromRatio = (v: unknown) => pctValue(v, 100);

function peso(v: unknown): string {
  if (v == null) return "—";
  return `$${Number(v).toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
}

/** "2026-02" o "2026-02-01" → "Feb 2026" */
function formatPeriod(iso: unknown): string | undefined {
  if (!iso || typeof iso !== "string") return undefined;
  const meses = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
  ];
  const parts = iso.split("-");
  if (parts.length < 2) return iso;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  return `${meses[monthIdx] ?? parts[1]} ${year}`;
}

/** Format a delta value already in percentage points: 0.4 → "+0,4 pp", -0.15 → "-0,2 pp" */
function formatDeltaPP(v: unknown): string | undefined {
  if (v == null) return undefined;
  const n = Number(v);
  if (isNaN(n)) return undefined;
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toLocaleString("es-AR", { maximumFractionDigits: 1 })} pp`;
}

/** Format a peso change with sign */
function formatDeltaPeso(v: unknown): string | undefined {
  if (v == null) return undefined;
  const n = Number(v);
  if (isNaN(n)) return undefined;
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toLocaleString("es-AR", { maximumFractionDigits: 1 })}%`;
}

/** Direction: up if positive, down if negative, neutral if 0/null */
function direction(v: unknown): "up" | "down" | "neutral" {
  if (v == null) return "neutral";
  const n = Number(v);
  if (isNaN(n) || n === 0) return "neutral";
  return n > 0 ? "up" : "down";
}

/** Compute change between last two values in a ratio series, return in percentage points */
function deltaPP(series: [string, number][]): number | null {
  if (series.length < 2) return null;
  const last = series[series.length - 1][1];
  const prev = series[series.length - 2][1];
  return (last - prev) * 100;
}

export function HomeClient({
  inflacion,
  dolarOficial,
  dolarBlue,
  empleo,
  pobreza,
  lastUpdated,
  series,
}: Props) {
  const infl = inflacion as Record<string, unknown>;
  const dolOf = dolarOficial as Record<string, unknown>;
  const dolBl = dolarBlue as Record<string, unknown>;
  const empl = empleo as Record<string, unknown>;
  const pobr = pobreza as Record<string, unknown>;

  const inflMonthly = infl.monthly as Record<string, unknown> | undefined;
  const inflYtd = infl.ytd as Record<string, unknown> | undefined;
  const td = (empl.tasa_desocupacion as Record<string, unknown>) || {};
  const tp = (pobr.tasa_pobreza as Record<string, unknown>) || {};

  // Computed deltas (used when summary doesn't carry vs_prev)
  const desempleoDelta = deltaPP(series.desocupacion);
  const pobrezaDelta = deltaPP(series.pobreza);

  return (
    <>
      <Hero lastUpdated={lastUpdated} />

      {/* ── KPI Row ── */}
      <section className="mx-auto max-w-6xl px-5 scroll-mt-20" id="indicadores">
        <SectionHeader
          eyebrow="Resumen"
          title="Indicadores clave"
          subtitle="Vista rápida de los principales datos macroeconómicos actualizados."
        />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <KpiCard
            label="Inflación mensual"
            value={pctFromPercent(inflMonthly?.value)}
            period={formatPeriod(inflMonthly?.period)}
            change={formatDeltaPP(inflMonthly?.vs_prev_month)}
            changeDirection={direction(inflMonthly?.vs_prev_month)}
            goodDirection="down"
            accentColor="var(--chart-1)"
            delay={0}
            sparkData={series.inflacion.slice(-12).map((d) => d[1])}
          />
          <KpiCard
            label="Dólar oficial"
            value={peso(dolOf.value)}
            period={formatPeriod(dolOf.period)}
            change={formatDeltaPeso(dolOf.monthly_change)}
            changeDirection={direction(dolOf.monthly_change)}
            goodDirection="down"
            accentColor="var(--chart-6)"
            delay={0.05}
            sparkData={series.dolarOficial.slice(-12).map((d) => d[1])}
          />
          <KpiCard
            label="Dólar blue"
            value={peso(dolBl.value)}
            period={formatPeriod(dolBl.period)}
            change={formatDeltaPeso(dolBl.monthly_change)}
            changeDirection={direction(dolBl.monthly_change)}
            goodDirection="down"
            accentColor="var(--chart-3)"
            delay={0.1}
            sparkData={series.dolarBlue.slice(-12).map((d) => d[1])}
          />
          <KpiCard
            label="Desocupación"
            value={pctFromRatio(td.value)}
            period={formatPeriod(td.period)}
            change={formatDeltaPP(desempleoDelta)}
            changeDirection={direction(desempleoDelta)}
            goodDirection="down"
            accentColor="var(--chart-4)"
            delay={0.15}
            sparkData={series.desocupacion.slice(-8).map((d) => d[1])}
          />
          <KpiCard
            label="Pobreza"
            value={pctFromRatio(tp.value)}
            period={formatPeriod(tp.period)}
            change={formatDeltaPP(pobrezaDelta)}
            changeDirection={direction(pobrezaDelta)}
            goodDirection="down"
            accentColor="var(--chart-7)"
            delay={0.2}
            sparkData={series.pobreza.slice(-6).map((d) => d[1])}
          />
        </div>
      </section>

      {/* ── Precios Section ── */}
      <section className="mx-auto max-w-6xl px-5 mt-20 scroll-mt-20" id="precios">
        <SectionHeader
          eyebrow="Precios"
          title="Inflación y tipo de cambio"
          subtitle="Evolución de precios al consumidor y cotizaciones del dólar y euro."
        />
        <div className="grid md:grid-cols-2 gap-5">
          <AreaChart
            data={series.inflacion}
            label="Inflación mensual (% IPC)"
            color="var(--chart-1)"
            format="percent"
          />
          <AreaChart
            data={series.dolarOficial}
            label="Dólar oficial (cierre mensual)"
            color="var(--chart-6)"
            format="peso"
          />
          <AreaChart
            data={series.dolarBlue}
            label="Dólar blue (cierre mensual)"
            color="var(--chart-3)"
            format="peso"
          />
          <AreaChart
            data={series.ripte}
            label="RIPTE — variación mensual (%)"
            color="var(--chart-8)"
            format="percent"
          />
        </div>

        {/* Navigation links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <LinkCard
            href="/detalle/inflacion"
            icon="📈"
            title="Inflación"
            description="IPC mensual, acumulado e interanual"
            delay={0}
          />
          <LinkCard
            href="/detalle/dolar"
            icon="💵"
            title="Dólar"
            description="Oficial, blue y brecha"
            delay={0.05}
          />
          <LinkCard
            href="/detalle/euro"
            icon="💶"
            title="Euro"
            description="Cotización diaria y mensual"
            delay={0.1}
          />
          <LinkCard
            href="/detalle/salarios"
            icon="💰"
            title="Salarios"
            description="RIPTE e índice de salarios"
            delay={0.15}
          />
        </div>
      </section>

      {/* ── Actividad Section ── */}
      <section className="mx-auto max-w-6xl px-5 mt-20 scroll-mt-20" id="actividad">
        <SectionHeader
          eyebrow="Actividad"
          title="Producción y actividad económica"
          subtitle="Estimadores mensuales y trimestrales de la actividad productiva."
        />
        <div className="grid md:grid-cols-2 gap-5">
          <AreaChart
            data={series.emae}
            label="EMAE — índice mensual base 2004=100"
            color="var(--chart-2)"
            format="decimal"
          />
          <AreaChart
            data={series.pbi}
            label="PBI trimestral"
            color="var(--chart-6)"
            format="index"
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-8">
          <LinkCard
            href="/detalle/actividad"
            icon="🏭"
            title="Actividad"
            description="EMAE y PBI trimestral"
            delay={0}
          />
          <LinkCard
            href="/detalle/salarios"
            icon="📊"
            title="Salarios"
            description="RIPTE e índice salarial"
            delay={0.05}
          />
        </div>
      </section>

      {/* ── Social Section ── */}
      <section className="mx-auto max-w-6xl px-5 mt-20 scroll-mt-20" id="social">
        <SectionHeader
          eyebrow="Social"
          title="Empleo, pobreza e ingresos"
          subtitle="Indicadores del mercado laboral y condiciones sociales."
        />
        <div className="grid md:grid-cols-2 gap-5">
          <AreaChart
            data={series.desocupacion}
            label="Tasa de desocupación (%)"
            color="var(--chart-4)"
            format="percent"
          />
          <AreaChart
            data={series.pobreza}
            label="Tasa de pobreza (%)"
            color="var(--chart-7)"
            format="percent"
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-8">
          <LinkCard
            href="/detalle/empleo"
            icon="👷"
            title="Empleo"
            description="Desocupación y tasa de empleo"
            delay={0}
          />
          <LinkCard
            href="/detalle/pobreza"
            icon="📋"
            title="Pobreza"
            description="Pobreza e indigencia"
            delay={0.05}
          />
        </div>
      </section>

      <Footer />
    </>
  );
}
