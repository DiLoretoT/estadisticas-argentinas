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

/** Format a percentage that might be pre-multiplied (2.62) or raw decimal (0.07). */
function pct(v: unknown): string {
  if (v == null) return "—";
  const n = Number(v);
  if (isNaN(n)) return "—";
  // Values < 1 are raw decimals (0.07 = 7%), values >= 1 are already % (2.62 = 2.62%)
  const display = Math.abs(n) < 1 ? n * 100 : n;
  return display.toLocaleString("es-AR", { maximumFractionDigits: 1 }) + "%";
}

function peso(v: unknown): string {
  if (v == null) return "—";
  return `$${Number(v).toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
}

function val(obj: unknown, key: string): unknown {
  if (obj && typeof obj === "object" && key in obj) return (obj as Record<string, unknown>)[key];
  return undefined;
}

export function HomeClient({
  inflacion,
  dolarOficial,
  dolarBlue,
  empleo,
  pobreza,
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

  return (
    <>
      <Hero />

      {/* ── KPI Row ── */}
      <section className="mx-auto max-w-6xl px-5 scroll-mt-20" id="indicadores">
        <SectionHeader
          eyebrow="Resumen"
          title="Indicadores clave"
          subtitle="Vista rapida de los principales datos macroeconomicos actualizados."
        />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <KpiCard
            label="Inflacion mensual"
            value={pct(inflMonthly?.value)}
            detail={`Acumulado: ${pct(inflYtd?.value)}`}
            trend="up"
            accentColor="var(--color-danger)"
            delay={0}
            sparkData={series.inflacion.slice(-12).map(d => d[1])}
          />
          <KpiCard
            label="Dolar oficial"
            value={peso(dolOf.value)}
            detail={dolOf.period ? `Al ${dolOf.period}` : undefined}
            accentColor="var(--color-accent)"
            delay={0.05}
            sparkData={series.dolarOficial.slice(-12).map(d => d[1])}
          />
          <KpiCard
            label="Dolar blue"
            value={peso(dolBl.value)}
            detail={dolBl.period ? `Al ${dolBl.period}` : undefined}
            accentColor="var(--color-primary)"
            delay={0.1}
            sparkData={series.dolarBlue.slice(-12).map(d => d[1])}
          />
          <KpiCard
            label="Desocupacion"
            value={pct(td.value)}
            detail={td.period ? `${td.period}` : undefined}
            trend="down"
            accentColor="var(--color-warning)"
            delay={0.15}
            sparkData={series.desocupacion.slice(-8).map(d => d[1])}
          />
          <KpiCard
            label="Pobreza"
            value={pct(tp.value)}
            detail={tp.period ? `S2 ${tp.period}` : undefined}
            trend="up"
            accentColor="var(--color-danger)"
            delay={0.2}
            sparkData={series.pobreza.slice(-6).map(d => d[1])}
          />
        </div>
      </section>

      {/* ── Precios Section ── */}
      <section className="mx-auto max-w-6xl px-5 mt-20 scroll-mt-20" id="precios">
        <SectionHeader
          eyebrow="Precios"
          title="Inflacion y tipo de cambio"
          subtitle="Evolucion de precios al consumidor y cotizaciones del dolar y euro."
        />
        <div className="grid md:grid-cols-2 gap-5">
          <AreaChart
            data={series.inflacion}
            label="Inflacion mensual (% IPC)"
            color="var(--color-danger)"

            format="percent"
          />
          <AreaChart
            data={series.dolarOficial}
            label="Dolar oficial (cierre mensual)"
            color="var(--color-accent)"

            format="peso"
          />
          <AreaChart
            data={series.dolarBlue}
            label="Dolar blue (cierre mensual)"
            color="var(--color-primary)"

            format="peso"
          />
          <AreaChart
            data={series.ripte}
            label="RIPTE (var. mensual %)"
            color="#8b5cf6"

            format="percent"
          />
        </div>

        {/* Navigation links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <LinkCard
            href="/detalle/inflacion"
            icon="📈"
            title="Inflacion"
            description="IPC mensual, acumulado e interanual"
            delay={0}
          />
          <LinkCard
            href="/detalle/dolar"
            icon="💵"
            title="Dolar"
            description="Oficial, blue y brecha"
            delay={0.05}
          />
          <LinkCard
            href="/detalle/euro"
            icon="💶"
            title="Euro"
            description="Cotizacion diaria y mensual"
            delay={0.1}
          />
          <LinkCard
            href="/detalle/salarios"
            icon="💰"
            title="Salarios"
            description="RIPTE e indice de salarios"
            delay={0.15}
          />
        </div>
      </section>

      {/* ── Actividad Section ── */}
      <section className="mx-auto max-w-6xl px-5 mt-20 scroll-mt-20" id="actividad">
        <SectionHeader
          eyebrow="Actividad"
          title="Produccion y actividad economica"
          subtitle="Estimadores mensuales y trimestrales de la actividad productiva."
        />
        <div className="grid md:grid-cols-2 gap-5">
          <AreaChart
            data={series.emae}
            label="EMAE (indice mensual)"
            color="var(--color-success)"

            format="decimal"
          />
          <AreaChart
            data={series.pbi}
            label="PBI trimestral"
            color="var(--color-accent)"

            format="index"
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-8">
          <LinkCard
            href="/detalle/actividad"
            icon="🏭"
            title="Actividad"
            description="EMAE y PBI"
            delay={0}
          />
          <LinkCard
            href="/detalle/salarios"
            icon="📊"
            title="Salarios"
            description="RIPTE e indice salarial"
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
            label="Tasa de desocupacion (%)"
            color="var(--color-warning)"

            format="percent"
          />
          <AreaChart
            data={series.pobreza}
            label="Tasa de pobreza (%)"
            color="var(--color-danger)"

            format="percent"
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-8">
          <LinkCard
            href="/detalle/empleo"
            icon="👷"
            title="Empleo"
            description="Desocupacion y tasa de empleo"
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
