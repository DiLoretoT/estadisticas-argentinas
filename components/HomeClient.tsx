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
    euro: [string, number][];
    ripte: [string, number][];
    salarioReal: [string, number][];
    emae: [string, number][];
    pbi: [string, number][];
    desocupacion: [string, number][];
    empleo: [string, number][];
    pobreza: [string, number][];
    indigencia: [string, number][];
  };
}

// ---------- formatters ----------

function pctValue(v: unknown, multiplier: 1 | 100): string {
  if (v == null) return "—";
  const n = Number(v);
  if (isNaN(n)) return "—";
  return (n * multiplier).toLocaleString("es-AR", { maximumFractionDigits: 1 }) + "%";
}

const pctFromPercent = (v: unknown) => pctValue(v, 1);
const pctFromRatio = (v: unknown) => pctValue(v, 100);

function peso(v: unknown): string {
  if (v == null) return "—";
  return `$${Number(v).toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
}

function decimal1(v: unknown): string {
  if (v == null) return "—";
  const n = Number(v);
  if (isNaN(n)) return "—";
  return n.toLocaleString("es-AR", { maximumFractionDigits: 1 });
}

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

function formatDeltaPP(v: unknown): string | undefined {
  if (v == null) return undefined;
  const n = Number(v);
  if (isNaN(n)) return undefined;
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toLocaleString("es-AR", { maximumFractionDigits: 1 })} pp`;
}

function formatDeltaPct(v: unknown): string | undefined {
  if (v == null) return undefined;
  const n = Number(v);
  if (isNaN(n)) return undefined;
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toLocaleString("es-AR", { maximumFractionDigits: 1 })}%`;
}

function direction(v: unknown): "up" | "down" | "neutral" {
  if (v == null) return "neutral";
  const n = Number(v);
  if (isNaN(n) || n === 0) return "neutral";
  return n > 0 ? "up" : "down";
}

function deltaPP(series: [string, number][]): number | null {
  if (series.length < 2) return null;
  return (series[series.length - 1][1] - series[series.length - 2][1]) * 100;
}

function deltaPctSeries(series: [string, number][]): number | null {
  if (series.length < 2) return null;
  const last = series[series.length - 1][1];
  const prev = series[series.length - 2][1];
  if (prev === 0) return null;
  return ((last - prev) / prev) * 100;
}

function computeBrechaActual(
  oficial: [string, number][],
  blue: [string, number][],
): { value: number; period: string } | null {
  if (!oficial.length || !blue.length) return null;
  const oficialMap = new Map(oficial);
  // find latest date present in both
  const blueRev = [...blue].reverse();
  for (const [date, blueValue] of blueRev) {
    const oficialValue = oficialMap.get(date);
    if (oficialValue && oficialValue !== 0) {
      return {
        value: (blueValue / oficialValue - 1) * 100,
        period: date,
      };
    }
  }
  return null;
}

// ---------- component ----------

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
  const te = (empl.tasa_empleo as Record<string, unknown>) || {};
  const tp = (pobr.tasa_pobreza as Record<string, unknown>) || {};
  const linea = (pobr.linea_indigencia as Record<string, unknown>) || {};

  // Computed values
  const euroLast = series.euro[series.euro.length - 1];
  const euroPrev = series.euro[series.euro.length - 2];
  const euroDeltaPct =
    euroLast && euroPrev && euroPrev[1] !== 0
      ? ((euroLast[1] - euroPrev[1]) / euroPrev[1]) * 100
      : null;

  const brecha = computeBrechaActual(series.dolarOficial, series.dolarBlue);
  const brechaPrev = (() => {
    if (series.dolarOficial.length < 2 || series.dolarBlue.length < 2) return null;
    const oM = new Map(series.dolarOficial);
    const blueRev = [...series.dolarBlue].reverse();
    let found: { value: number; date: string } | null = null;
    let prev: { value: number; date: string } | null = null;
    for (const [d, b] of blueRev) {
      const o = oM.get(d);
      if (o && o !== 0) {
        const val = (b / o - 1) * 100;
        if (!found) found = { value: val, date: d };
        else {
          prev = { value: val, date: d };
          break;
        }
      }
    }
    if (found && prev) return found.value - prev.value;
    return null;
  })();

  const emaeLast = series.emae[series.emae.length - 1];
  const emaeDeltaPct = deltaPctSeries(series.emae);

  const pbiLast = series.pbi[series.pbi.length - 1];
  const pbiDeltaPct = deltaPctSeries(series.pbi);

  const desempleoDelta = deltaPP(series.desocupacion);
  const empleoDelta = deltaPP(series.empleo);
  const pobrezaDelta = deltaPP(series.pobreza);

  const salarioRealLast = series.salarioReal[series.salarioReal.length - 1];
  const salarioRealDeltaPct = deltaPctSeries(series.salarioReal);

  const indigenciaLast = series.indigencia[series.indigencia.length - 1];
  const indigenciaDeltaPct = deltaPctSeries(series.indigencia);

  return (
    <>
      <Hero lastUpdated={lastUpdated} />

      {/* ════════════════════════════ MONEDAS ════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-5 scroll-mt-20" id="monedas">
        <SectionHeader
          eyebrow="Tipo de cambio"
          title="Monedas"
          subtitle="Cotizaciones del dólar oficial, blue, euro y brecha cambiaria."
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <KpiCard
            label="Dólar oficial"
            value={peso(dolOf.value)}
            period={formatPeriod(dolOf.period)}
            change={formatDeltaPct(dolOf.monthly_change)}
            changeDirection={direction(dolOf.monthly_change)}
            goodDirection="down"
            accentColor="var(--chart-6)"
            delay={0}
            sparkData={series.dolarOficial.slice(-12).map((d) => d[1])}
          />
          <KpiCard
            label="Dólar blue"
            value={peso(dolBl.value)}
            period={formatPeriod(dolBl.period)}
            change={formatDeltaPct(dolBl.monthly_change)}
            changeDirection={direction(dolBl.monthly_change)}
            goodDirection="down"
            accentColor="var(--chart-3)"
            delay={0.05}
            sparkData={series.dolarBlue.slice(-12).map((d) => d[1])}
          />
          <KpiCard
            label="Euro"
            value={euroLast ? peso(euroLast[1]) : "—"}
            period={euroLast ? formatPeriod(euroLast[0]) : undefined}
            change={formatDeltaPct(euroDeltaPct)}
            changeDirection={direction(euroDeltaPct)}
            goodDirection="down"
            accentColor="var(--chart-8)"
            delay={0.1}
            sparkData={series.euro.slice(-12).map((d) => d[1])}
          />
          <KpiCard
            label="Brecha cambiaria"
            value={brecha ? decimal1(brecha.value) + "%" : "—"}
            period={brecha ? formatPeriod(brecha.period) : undefined}
            change={formatDeltaPP(brechaPrev)}
            changeDirection={direction(brechaPrev)}
            goodDirection="down"
            accentColor="var(--chart-7)"
            delay={0.15}
          />
        </div>
        <div className="grid md:grid-cols-2 gap-5">
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
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6">
          <LinkCard
            href="/detalle/dolar"
            icon="💵"
            title="Dólar"
            description="Oficial, blue y brecha — series diarias e históricas"
            delay={0}
          />
          <LinkCard
            href="/detalle/euro"
            icon="💶"
            title="Euro"
            description="Cotización del BCRA en peso argentino"
            delay={0.05}
          />
        </div>
      </section>

      {/* ════════════════════════════ PRECIOS ════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-5 mt-20 scroll-mt-20" id="precios">
        <SectionHeader
          eyebrow="Inflación"
          title="Precios"
          subtitle="Variaciones del Índice de Precios al Consumidor (IPC) y acumulados."
        />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
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
            label="Acumulada (YTD)"
            value={pctFromPercent(inflYtd?.value)}
            period={formatPeriod(inflYtd?.period)}
            accentColor="var(--chart-1)"
            delay={0.05}
          />
          <KpiCard
            label="Interanual"
            value={pctFromPercent(inflMonthly?.vs_prev_year)}
            period={formatPeriod(inflMonthly?.period)}
            accentColor="var(--chart-1)"
            delay={0.1}
          />
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <AreaChart
            data={series.inflacion}
            label="IPC — variación mensual (%)"
            color="var(--chart-1)"
            format="percent"
          />
          <AreaChart
            data={series.ripte}
            label="RIPTE — variación mensual (%)"
            color="var(--chart-8)"
            format="percent"
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6">
          <LinkCard
            href="/detalle/inflacion"
            icon="📈"
            title="Inflación"
            description="IPC INDEC con eventos macro anotados"
            delay={0}
          />
          <LinkCard
            href="/calculadora"
            icon="🧮"
            title="Calculadora"
            description="Convertí pesos entre fechas usando el IPC"
            delay={0.05}
          />
        </div>
      </section>

      {/* ════════════════════════════ ACTIVIDAD ════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-5 mt-20 scroll-mt-20" id="actividad">
        <SectionHeader
          eyebrow="Producción"
          title="Actividad económica"
          subtitle="Estimadores mensuales y trimestrales de la actividad productiva."
        />
        <div className="grid grid-cols-2 gap-4 mb-8">
          <KpiCard
            label="EMAE (índice)"
            value={emaeLast ? decimal1(emaeLast[1]) : "—"}
            period={emaeLast ? formatPeriod(emaeLast[0]) : undefined}
            change={formatDeltaPct(emaeDeltaPct)}
            changeDirection={direction(emaeDeltaPct)}
            goodDirection="up"
            accentColor="var(--chart-2)"
            delay={0}
            sparkData={series.emae.slice(-12).map((d) => d[1])}
          />
          <KpiCard
            label="PBI trimestral"
            value={pbiLast ? Math.round(pbiLast[1]).toLocaleString("es-AR") : "—"}
            period={pbiLast ? formatPeriod(pbiLast[0]) : undefined}
            change={formatDeltaPct(pbiDeltaPct)}
            changeDirection={direction(pbiDeltaPct)}
            goodDirection="up"
            accentColor="var(--chart-6)"
            delay={0.05}
            sparkData={series.pbi.slice(-12).map((d) => d[1])}
          />
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <AreaChart
            data={series.emae}
            label="EMAE — índice mensual base 2004=100"
            color="var(--chart-2)"
            format="decimal"
          />
          <AreaChart
            data={series.pbi}
            label="PBI trimestral (mill. $ constantes)"
            color="var(--chart-6)"
            format="index"
          />
        </div>
        <div className="mt-6">
          <LinkCard
            href="/detalle/actividad"
            icon="🏭"
            title="Actividad"
            description="EMAE y PBI con eventos macro"
            delay={0}
          />
        </div>
      </section>

      {/* ════════════════════════════ EMPLEO ════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-5 mt-20 scroll-mt-20" id="empleo">
        <SectionHeader
          eyebrow="Mercado laboral"
          title="Empleo e ingresos"
          subtitle="Tasas de desocupación, empleo y salario real deflactado por inflación."
        />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <KpiCard
            label="Desocupación"
            value={pctFromRatio(td.value)}
            period={formatPeriod(td.period)}
            change={formatDeltaPP(desempleoDelta)}
            changeDirection={direction(desempleoDelta)}
            goodDirection="down"
            accentColor="var(--chart-4)"
            delay={0}
            sparkData={series.desocupacion.slice(-8).map((d) => d[1])}
          />
          <KpiCard
            label="Tasa de empleo"
            value={pctFromRatio(te.value)}
            period={formatPeriod(te.period)}
            change={formatDeltaPP(empleoDelta)}
            changeDirection={direction(empleoDelta)}
            goodDirection="up"
            accentColor="var(--chart-2)"
            delay={0.05}
            sparkData={series.empleo.slice(-8).map((d) => d[1])}
          />
          <KpiCard
            label="Salario real (índice)"
            value={salarioRealLast ? decimal1(salarioRealLast[1]) : "—"}
            period={salarioRealLast ? formatPeriod(salarioRealLast[0]) : undefined}
            change={formatDeltaPct(salarioRealDeltaPct)}
            changeDirection={direction(salarioRealDeltaPct)}
            goodDirection="up"
            accentColor="var(--chart-8)"
            delay={0.1}
            sparkData={series.salarioReal.slice(-12).map((d) => d[1])}
          />
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <AreaChart
            data={series.desocupacion}
            label="Tasa de desocupación (%)"
            color="var(--chart-4)"
            format="percent"
          />
          <AreaChart
            data={series.salarioReal}
            label="Salario real (RIPTE / IPC, base 100)"
            color="var(--chart-2)"
            format="decimal"
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6">
          <LinkCard
            href="/detalle/empleo"
            icon="👷"
            title="Empleo"
            description="Desocupación y empleo trimestral"
            delay={0}
          />
          <LinkCard
            href="/detalle/salarios"
            icon="💰"
            title="Salarios"
            description="RIPTE nominal y real deflactado"
            delay={0.05}
          />
        </div>
      </section>

      {/* ════════════════════════════ SOCIAL ════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-5 mt-20 scroll-mt-20" id="social">
        <SectionHeader
          eyebrow="Social"
          title="Pobreza e indigencia"
          subtitle="Tasa de pobreza semestral y línea de indigencia mensual (CBA por adulto)."
        />
        <div className="grid grid-cols-2 gap-4 mb-8">
          <KpiCard
            label="Pobreza"
            value={pctFromRatio(tp.value)}
            period={formatPeriod(tp.period)}
            change={formatDeltaPP(pobrezaDelta)}
            changeDirection={direction(pobrezaDelta)}
            goodDirection="down"
            accentColor="var(--chart-7)"
            delay={0}
            sparkData={series.pobreza.slice(-6).map((d) => d[1])}
          />
          <KpiCard
            label="Línea de indigencia"
            value={linea.value ? peso(linea.value) : indigenciaLast ? peso(indigenciaLast[1]) : "—"}
            period={
              linea.period
                ? formatPeriod(linea.period)
                : indigenciaLast
                ? formatPeriod(indigenciaLast[0])
                : undefined
            }
            change={formatDeltaPct(indigenciaDeltaPct)}
            changeDirection={direction(indigenciaDeltaPct)}
            goodDirection="down"
            accentColor="var(--chart-3)"
            delay={0.05}
            sparkData={series.indigencia.slice(-12).map((d) => d[1])}
          />
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <AreaChart
            data={series.pobreza}
            label="Tasa de pobreza (%)"
            color="var(--chart-7)"
            format="percent"
          />
          <AreaChart
            data={series.indigencia}
            label="Línea de indigencia ($ por adulto/mes)"
            color="var(--chart-3)"
            format="peso"
          />
        </div>
        <div className="mt-6">
          <LinkCard
            href="/detalle/pobreza"
            icon="📋"
            title="Pobreza e indigencia"
            description="Serie histórica completa de pobreza y CBA"
            delay={0}
          />
        </div>
      </section>

      <Footer />
    </>
  );
}
