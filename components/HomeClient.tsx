"use client";

import { Hero } from "@/components/Hero";
import { KpiCard } from "@/components/KpiCard";
import { AreaChart } from "@/components/AreaChart";
import { SectionHeader } from "@/components/SectionHeader";
import { LinkCard } from "@/components/LinkCard";
import { Footer } from "@/components/Footer";
import { MultiCurrencyChart, type CurrencySeries } from "@/components/MultiCurrencyChart";

type Indicator = Record<string, unknown>;

interface DolaresMap {
  oficial: Indicator;
  mayorista: Indicator;
  mep: Indicator;
  blue: Indicator;
  ccl: Indicator;
  cripto: Indicator;
  tarjeta: Indicator;
}

interface MonedasLatamMap {
  brl: Indicator;
  clp: Indicator;
  uyu: Indicator;
  pen: Indicator;
  cop: Indicator;
  pyg: Indicator;
  mxn: Indicator;
}

interface Props {
  inflacion: Indicator;
  dolares: DolaresMap;
  monedasLatam: MonedasLatamMap;
  empleo: Indicator;
  pobreza: Indicator;
  lastUpdated?: string;
  series: {
    inflacion: [string, number][];
    dolarOficial: [string, number][];
    dolarBlue: [string, number][];
    dolarMep: [string, number][];
    dolarCcl: [string, number][];
    dolarMayorista: [string, number][];
    dolarCripto: [string, number][];
    dolarTarjeta: [string, number][];
    euro: [string, number][];
    ripte: [string, number][];
    salarioReal: [string, number][];
    emae: [string, number][];
    pbi: [string, number][];
    desocupacion: [string, number][];
    empleo: [string, number][];
    pobreza: [string, number][];
    indigencia: [string, number][];
    comparativaMonedas: {
      ars: [string, number][];
      brl: [string, number][];
      clp: [string, number][];
      uyu: [string, number][];
      pen: [string, number][];
      cop: [string, number][];
      pyg: [string, number][];
      mxn: [string, number][];
    };
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

function decimal2(v: unknown): string {
  if (v == null) return "—";
  const n = Number(v);
  if (isNaN(n)) return "—";
  return n.toLocaleString("es-AR", { maximumFractionDigits: 2 });
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

function computeBrecha(
  oficialValue: unknown,
  altValue: unknown,
): number | null {
  const o = Number(oficialValue);
  const a = Number(altValue);
  if (!isFinite(o) || !isFinite(a) || o === 0) return null;
  return (a / o - 1) * 100;
}

function val(obj: unknown, key: string): unknown {
  if (obj && typeof obj === "object" && key in obj)
    return (obj as Record<string, unknown>)[key];
  return undefined;
}

// ---------- component ----------

export function HomeClient({
  inflacion,
  dolares,
  monedasLatam,
  empleo,
  pobreza,
  lastUpdated,
  series,
}: Props) {
  const infl = inflacion as Record<string, unknown>;
  const empl = empleo as Record<string, unknown>;
  const pobr = pobreza as Record<string, unknown>;

  const inflMonthly = infl.monthly as Record<string, unknown> | undefined;
  const inflYtd = infl.ytd as Record<string, unknown> | undefined;
  const td = (empl.tasa_desocupacion as Record<string, unknown>) || {};
  const te = (empl.tasa_empleo as Record<string, unknown>) || {};
  const tp = (pobr.tasa_pobreza as Record<string, unknown>) || {};
  const linea = (pobr.linea_indigencia as Record<string, unknown>) || {};

  // Brechas vs oficial
  const oficialValue = val(dolares.oficial, "value");
  const brechaBlue = computeBrecha(oficialValue, val(dolares.blue, "value"));
  const brechaMep = computeBrecha(oficialValue, val(dolares.mep, "value"));
  const brechaCcl = computeBrecha(oficialValue, val(dolares.ccl, "value"));
  const brechaCripto = computeBrecha(oficialValue, val(dolares.cripto, "value"));

  // Computed values for other sections
  const euroLast = series.euro[series.euro.length - 1];
  const euroDeltaPct =
    series.euro.length >= 2
      ? deltaPctSeries(series.euro)
      : null;

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

  // ----- KPI dólares ARS (7 cards) -----
  const dolaresArs: Array<{
    label: string;
    value: unknown;
    period: unknown;
    change: unknown;
    sparkData: number[];
    color: string;
    badge?: string;
  }> = [
    {
      label: "Oficial",
      value: val(dolares.oficial, "value"),
      period: val(dolares.oficial, "period"),
      change: val(dolares.oficial, "monthly_change"),
      sparkData: series.dolarOficial.slice(-12).map((d) => d[1]),
      color: "var(--chart-6)",
      badge: "BCRA",
    },
    {
      label: "Mayorista",
      value: val(dolares.mayorista, "value"),
      period: val(dolares.mayorista, "period"),
      change: val(dolares.mayorista, "monthly_change"),
      sparkData: series.dolarMayorista.slice(-12).map((d) => d[1]),
      color: "var(--chart-6)",
    },
    {
      label: "MEP",
      value: val(dolares.mep, "value"),
      period: val(dolares.mep, "period"),
      change: val(dolares.mep, "monthly_change"),
      sparkData: series.dolarMep.slice(-12).map((d) => d[1]),
      color: "var(--chart-3)",
    },
    {
      label: "CCL",
      value: val(dolares.ccl, "value"),
      period: val(dolares.ccl, "period"),
      change: val(dolares.ccl, "monthly_change"),
      sparkData: series.dolarCcl.slice(-12).map((d) => d[1]),
      color: "var(--chart-3)",
    },
    {
      label: "Blue",
      value: val(dolares.blue, "value"),
      period: val(dolares.blue, "period"),
      change: val(dolares.blue, "monthly_change"),
      sparkData: series.dolarBlue.slice(-12).map((d) => d[1]),
      color: "var(--chart-3)",
    },
    {
      label: "Cripto",
      value: val(dolares.cripto, "value"),
      period: val(dolares.cripto, "period"),
      change: val(dolares.cripto, "monthly_change"),
      sparkData: series.dolarCripto.slice(-12).map((d) => d[1]),
      color: "var(--chart-8)",
    },
    {
      label: "Tarjeta",
      value: val(dolares.tarjeta, "value"),
      period: val(dolares.tarjeta, "period"),
      change: val(dolares.tarjeta, "monthly_change"),
      sparkData: series.dolarTarjeta.slice(-12).map((d) => d[1]),
      color: "var(--chart-7)",
    },
  ];

  // ----- KPI monedas LATAM -----
  const monedasLatamCards: Array<{
    flag: string;
    label: string;
    code: string;
    indicator: Indicator;
  }> = [
    { flag: "🇧🇷", label: "Real brasileño", code: "BRL", indicator: monedasLatam.brl },
    { flag: "🇨🇱", label: "Peso chileno", code: "CLP", indicator: monedasLatam.clp },
    { flag: "🇺🇾", label: "Peso uruguayo", code: "UYU", indicator: monedasLatam.uyu },
    { flag: "🇵🇪", label: "Sol peruano", code: "PEN", indicator: monedasLatam.pen },
    { flag: "🇨🇴", label: "Peso colombiano", code: "COP", indicator: monedasLatam.cop },
    { flag: "🇵🇾", label: "Guaraní paraguayo", code: "PYG", indicator: monedasLatam.pyg },
    { flag: "🇲🇽", label: "Peso mexicano", code: "MXN", indicator: monedasLatam.mxn },
  ];

  // ----- MultiCurrencyChart series -----
  const comparativeSeries: CurrencySeries[] = [
    {
      key: "ars",
      label: "🇦🇷 ARS",
      color: "var(--chart-1)",
      data: series.comparativaMonedas.ars,
      pinned: true,
    },
    {
      key: "brl",
      label: "🇧🇷 BRL",
      color: "var(--chart-2)",
      data: series.comparativaMonedas.brl,
    },
    {
      key: "clp",
      label: "🇨🇱 CLP",
      color: "var(--chart-6)",
      data: series.comparativaMonedas.clp,
    },
    {
      key: "uyu",
      label: "🇺🇾 UYU",
      color: "var(--chart-3)",
      data: series.comparativaMonedas.uyu,
    },
    {
      key: "pen",
      label: "🇵🇪 PEN",
      color: "var(--chart-7)",
      data: series.comparativaMonedas.pen,
    },
    {
      key: "cop",
      label: "🇨🇴 COP",
      color: "var(--chart-8)",
      data: series.comparativaMonedas.cop,
    },
    {
      key: "pyg",
      label: "🇵🇾 PYG",
      color: "var(--chart-4)",
      data: series.comparativaMonedas.pyg,
    },
    {
      key: "mxn",
      label: "🇲🇽 MXN",
      color: "var(--chart-5)",
      data: series.comparativaMonedas.mxn,
    },
  ].filter((s) => s.data && s.data.length > 0);

  return (
    <>
      <Hero lastUpdated={lastUpdated} />

      {/* ════════════════════════════ DÓLAR ════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-5 scroll-mt-20" id="monedas">
        <SectionHeader
          eyebrow="Tipo de cambio"
          title="Dólar en Argentina"
          subtitle="Todas las cotizaciones del peso argentino vs el dólar estadounidense."
        />

        {/* 7 KPI cards de dólares ARS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {dolaresArs.map((d, i) => (
            <KpiCard
              key={d.label}
              label={d.label}
              value={peso(d.value)}
              period={formatPeriod(d.period)}
              change={formatDeltaPct(d.change)}
              changeDirection={direction(d.change)}
              goodDirection="down"
              accentColor={d.color}
              delay={i * 0.04}
              sparkData={d.sparkData}
            />
          ))}
        </div>

        {/* Brecha cambiaria — card destacado */}
        <div
          className="rounded-2xl border p-5 md:p-6 mb-8"
          style={{
            background:
              "linear-gradient(135deg, var(--color-primary-soft) 0%, transparent 80%)",
            borderColor: "var(--color-primary)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
            <h3
              className="text-base font-bold"
              style={{ color: "var(--color-text)" }}
            >
              Brecha cambiaria · {formatPeriod(val(dolares.oficial, "period"))}
            </h3>
            <span
              className="text-[10px] uppercase tracking-wider"
              style={{ color: "var(--color-text-muted)" }}
            >
              vs Oficial
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Blue", value: brechaBlue, color: "var(--chart-3)" },
              { label: "MEP", value: brechaMep, color: "var(--chart-3)" },
              { label: "CCL", value: brechaCcl, color: "var(--chart-3)" },
              { label: "Cripto", value: brechaCripto, color: "var(--chart-8)" },
            ].map((b) => (
              <div key={b.label}>
                <p
                  className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {b.label}
                </p>
                <p
                  className="text-2xl md:text-3xl font-bold tabular-nums"
                  style={{ color: b.color }}
                >
                  {b.value !== null ? `${b.value > 0 ? "+" : ""}${decimal1(b.value)}%` : "—"}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Charts dólar */}
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
            title="Dólar — detalle"
            description="Series diarias, brecha, anotaciones macro"
            delay={0}
          />
          <LinkCard
            href="/calculadora"
            icon="🧮"
            title="Calculadora"
            description="Convertí pesos entre fechas con IPC"
            delay={0.05}
          />
        </div>
      </section>

      {/* ════════════════════════════ MÁS MONEDAS ════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-5 mt-20 scroll-mt-20" id="latam">
        <SectionHeader
          eyebrow="Otras monedas"
          title="Más monedas — América Latina"
          subtitle="Cotizaciones de las principales monedas latinoamericanas expresadas como unidades locales por dólar (BCRA)."
        />

        {/* Cards LATAM */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {monedasLatamCards.map((m, i) => {
            const value = val(m.indicator, "value");
            const period = val(m.indicator, "period");
            const change = val(m.indicator, "monthly_change");
            return (
              <KpiCard
                key={m.code}
                label={`${m.flag} ${m.code}`}
                value={value != null ? decimal2(value) : "—"}
                period={formatPeriod(period)}
                change={formatDeltaPct(change)}
                changeDirection={direction(change)}
                goodDirection="down"
                accentColor="var(--chart-2)"
                delay={i * 0.04}
              />
            );
          })}
          {/* Euro como referencia complementaria */}
          <KpiCard
            label="🇪🇺 EUR"
            value={euroLast ? peso(euroLast[1]) : "—"}
            period={euroLast ? formatPeriod(euroLast[0]) : undefined}
            change={formatDeltaPct(euroDeltaPct)}
            changeDirection={direction(euroDeltaPct)}
            goodDirection="down"
            accentColor="var(--chart-8)"
            delay={monedasLatamCards.length * 0.04}
          />
        </div>

        {/* Comparativa normalizada */}
        <MultiCurrencyChart
          label="Devaluación comparada vs USD — base 100 en fecha elegida"
          series={comparativeSeries}
        />

        <p
          className="mt-4 text-xs leading-relaxed"
          style={{ color: "var(--color-text-muted)" }}
        >
          <strong>Cómo leer este gráfico:</strong> cada línea es la moneda local
          dividida por el USD, normalizada a 100 en la fecha base. Si Argentina
          sube más rápido que Brasil, significa que el peso argentino se devaluó
          más que el real. Una línea plana indica estabilidad cambiaria. Probá
          anclar a "Pre-Milei" para ver el comportamiento desde diciembre 2023.
        </p>
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
            value={
              linea.value
                ? peso(linea.value)
                : indigenciaLast
                  ? peso(indigenciaLast[1])
                  : "—"
            }
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
