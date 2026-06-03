"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Hero } from "@/components/Hero";
import { KpiCard } from "@/components/KpiCard";
import { DolarCard } from "@/components/DolarCard";
import { DolarIntradiaPanel, type IntradiaPoint } from "@/components/DolarIntradiaPanel";
import { AreaChart } from "@/components/AreaChart";
import { SectionHeader } from "@/components/SectionHeader";
import { LinkCard } from "@/components/LinkCard";
import { Footer } from "@/components/Footer";
import type { CurrencySeries } from "@/components/MultiCurrencyChart";
import { MultiCurrencyChartLazy } from "@/components/MultiCurrencyChartLazy";
import { AnalysisPanel } from "@/components/AnalysisPanel";
import { DolarLiveBadge } from "@/components/DolarLiveBadge";
import { useDolarLive } from "@/lib/useDolarLive";

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

interface MercadoMap {
  riesgoPais: Indicator;
  merval: Indicator;
  ggal: Indicator;
  ypf: Indicator;
  pam: Indicator;
  bma: Indicator;
  teo: Indicator;
}

interface MonetarioMap {
  baseMonetaria: Indicator;
  reservas: Indicator;
  tpm: Indicator;
  badlar: Indicator;
  plazoFijo30d: Indicator;
  m2PrivadoYoy: Indicator;
  remInflacion12m: Indicator;
}

interface DeudaMap {
  total: Indicator;
  titulos: Indicator;
  prestamos: Indicator;
  organismosIntl: Indicator;
  adelantosBcra: Indicator;
}

interface ComercioMap {
  exportTotal: Indicator;
  importTotal: Indicator;
  balanzaComercial: Indicator;
  exportPrimarios: Indicator;
  exportMoa: Indicator;
  exportMoi: Indicator;
  exportCombustibles: Indicator;
  importIntermedios: Indicator;
  importBkYPiezas: Indicator;
  importConsumo: Indicator;
  importCombustibles: Indicator;
  importVehiculos: Indicator;
}

interface DolarIntradia {
  date?: string;
  updatedAt?: string | null;
  casas?: Record<string, IntradiaPoint[]>;
}

interface Props {
  inflacion: Indicator;
  dolares: DolaresMap;
  monedasLatam: MonedasLatamMap;
  mercado: MercadoMap;
  monetario: MonetarioMap;
  comercio: ComercioMap;
  deuda: DeudaMap;
  empleo: Indicator;
  pobreza: Indicator;
  confianza: Indicator;
  dolarIntradia?: DolarIntradia;
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
    icc: [string, number][];
    icg: [string, number][];
    riesgoPais: [string, number][];
    merval: [string, number][];
    ggal: [string, number][];
    ypf: [string, number][];
    baseMonetaria: [string, number][];
    reservas: [string, number][];
    tpm: [string, number][];
    badlar: [string, number][];
    plazoFijo30d: [string, number][];
    m2PrivadoYoy: [string, number][];
    remInflacion12m: [string, number][];
    exportTotal: [string, number][];
    importTotal: [string, number][];
    balanzaComercial: [string, number][];
    deudaTotal: [string, number][];
    deudaOrganismosIntl: [string, number][];
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
  mercado,
  monetario,
  comercio,
  deuda,
  empleo,
  pobreza,
  confianza,
  dolarIntradia,
  lastUpdated,
  series,
}: Props) {
  // Cotizaciones intradía (polling client-side a /api/dolar). Mientras no haya
  // dato fresco, las cards muestran el valor estático server-rendered.
  const dolarLive = useDolarLive();

  // Card de dólar con el panel de detalle abierto (null = ninguna).
  const [expandedDolar, setExpandedDolar] = useState<string | null>(null);

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

  // ----- Confianza (UTDT): ICC consumidor + ICG gobierno -----
  const conf = confianza as Record<string, unknown>;
  const iccObj = (conf.icc as Record<string, unknown>) || {};
  const icgObj = (conf.icg as Record<string, unknown>) || {};
  const iccDeltaPct = deltaPctSeries(series.icc);
  const icgDeltaPct = deltaPctSeries(series.icg);

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

  // Día de hoy en hora de Buenos Aires (YYYY-MM-DD) para validar que el log
  // intradía server-rendered sea de hoy y no de una jornada anterior.
  const todayBA = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
  });
  const intradiaIsToday = dolarIntradia?.date === todayBA;

  // Overlay del dato intradía (compra/venta) sobre el valor estático. La
  // variación mensual queda con el dato oficial estático.
  const dolaresArsLive = dolaresArs.map((d) => {
    const detail = dolarLive.details[d.label];
    const liveVenta = dolarLive.values[d.label];
    const isLive = liveVenta != null;
    const venta = detail?.venta ?? (liveVenta ?? (d.value != null ? Number(d.value) : null));
    const compra = detail?.compra ?? null;
    return { ...d, venta, compra, live: isLive };
  });

  // Puntos del día para una casa: log server-rendered (sólo si es de hoy) +
  // el punto en vivo actual si todavía no quedó persistido por el cron.
  function intradiaPoints(label: string): IntradiaPoint[] {
    const base = intradiaIsToday ? (dolarIntradia?.casas?.[label] ?? []) : [];
    const points: IntradiaPoint[] = base.map((p) => ({ ...p }));
    const detail = dolarLive.details[label];
    if (detail && (detail.compra != null || detail.venta != null)) {
      const last = points[points.length - 1];
      if (!last || last.compra !== detail.compra || last.venta !== detail.venta) {
        points.push({
          t: detail.fechaActualizacion,
          compra: detail.compra,
          venta: detail.venta,
          live: true,
        });
      }
    }
    return points;
  }

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

        {dolarLive.fetchedAt != null && (
          <div className="-mt-3 mb-5 flex justify-center">
            <DolarLiveBadge fetchedAt={dolarLive.fetchedAt} />
          </div>
        )}

        {/* 7 cards de dólares ARS — click para ver la jornada */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
          {dolaresArsLive.map((d) => (
            <DolarCard
              key={d.label}
              label={d.label}
              venta={d.venta}
              compra={d.compra}
              period={d.live ? "Intradía" : formatPeriod(d.period)}
              change={formatDeltaPct(d.change)}
              changeDirection={direction(d.change)}
              accentColor={d.color}
              sparkData={d.sparkData}
              live={d.live}
              expanded={expandedDolar === d.label}
              onToggle={() =>
                setExpandedDolar((cur) => (cur === d.label ? null : d.label))
              }
            />
          ))}
        </div>

        {/* Panel de detalle de la jornada para la card abierta */}
        <AnimatePresence initial={false}>
          {expandedDolar && (
            <motion.div
              key={expandedDolar}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              style={{ overflow: "hidden" }}
              className="mb-6"
            >
              <DolarIntradiaPanel
                label={expandedDolar}
                accentColor={
                  dolaresArsLive.find((d) => d.label === expandedDolar)?.color ??
                  "var(--color-primary)"
                }
                points={intradiaPoints(expandedDolar)}
              />
            </motion.div>
          )}
        </AnimatePresence>

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
            description="Cotización oficial del USD informada por el BCRA, valor de cierre del último día hábil del mes."
            source="BCRA — Cotizaciones"
          />
          <AreaChart
            data={series.dolarBlue}
            label="Dólar blue (cierre mensual)"
            color="var(--chart-3)"
            format="peso"
            description="Cotización del dólar paralelo o 'blue' en el mercado informal de la Ciudad de Buenos Aires."
            source="ArgentinaDatos / Ámbito"
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
      
        <div className="mt-6">
          <AnalysisPanel
            data={series.dolarOficial}
            noun="el dólar oficial"
            format="currency_ars"
            goodDirection="neutral"
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

        {/* Comparativa normalizada — lazy load (no bloquea LCP) */}
        <MultiCurrencyChartLazy
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
          anclar a &ldquo;Pre-Milei&rdquo; para ver el comportamiento desde diciembre 2023.
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
            description="Variación del Índice de Precios al Consumidor respecto al mes anterior. Mide la inflación 'punta a punta' del mes."
            source="INDEC"
          />
          <AreaChart
            data={series.remInflacion12m}
            label="REM — expectativas inflación 12m (%)"
            color="var(--chart-7)"
            format="percent"
            description="Relevamiento de Expectativas de Mercado del BCRA. Inflación esperada por analistas para los próximos 12 meses. Buen termómetro de credibilidad anti-inflacionaria."
            source="BCRA — REM"
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
      
        <div className="mt-6">
          <AnalysisPanel
            data={series.inflacion}
            noun="la inflación mensual"
            format="percent"
            goodDirection="down"
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
            description="Estimador Mensual de Actividad Económica. Proxy mensual del PBI, captura la actividad de todos los sectores."
            source="INDEC"
          />
          <AreaChart
            data={series.pbi}
            label="PBI trimestral (mill. $ constantes)"
            color="var(--chart-6)"
            format="index"
            description="Producto Bruto Interno a precios constantes (volumen físico), sin efecto inflacionario."
            source="INDEC — Cuentas Nacionales"
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
      
        <div className="mt-6">
          <AnalysisPanel
            data={series.emae}
            noun="la actividad económica"
            format="index"
            goodDirection="up"
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
            data={series.ripte}
            label="RIPTE — variación mensual (%)"
            color="var(--chart-8)"
            format="percent"
            description="Remuneración Imponible Promedio de Trabajadores Estables. Variación nominal del salario promedio del trabajo registrado. Comparalo con la inflación mensual para ver si ganaste o perdiste poder de compra."
            source="MTEySS / SIPA"
          />
          <AreaChart
            data={series.salarioReal}
            label="Salario real (RIPTE / IPC, base 100)"
            color="var(--chart-2)"
            format="index"
            description="Poder adquisitivo del salario nominal después de descontar la inflación. Base 100 en el primer mes disponible — si está debajo de 100, el salario perdió poder de compra desde entonces."
            source="Cálculo propio sobre RIPTE (MTEySS) y IPC (INDEC)"
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
      
        <div className="mt-6">
          <AnalysisPanel
            data={series.desocupacion}
            noun="la tasa de desocupación"
            format="percent"
            goodDirection="down"
          />
        </div>
      </section>

      {/* ════════════════════════════ CONFIANZA ════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-5 mt-20 scroll-mt-20" id="confianza">
        <SectionHeader
          eyebrow="Expectativas"
          title="Confianza"
          subtitle="Índice de Confianza del Consumidor (ICC) y de Confianza en el Gobierno (ICG), relevados mensualmente por la UTDT. Valores más altos indican mayor optimismo."
        />
        <div className="grid grid-cols-2 gap-4 mb-8">
          <KpiCard
            label="Confianza del consumidor (ICC)"
            value={iccObj.value != null ? decimal1(iccObj.value) : "—"}
            period={formatPeriod(iccObj.period)}
            change={formatDeltaPct(iccDeltaPct)}
            changeDirection={direction(iccDeltaPct)}
            goodDirection="up"
            accentColor="var(--chart-3)"
            delay={0}
            sparkData={series.icc.slice(-12).map((d) => d[1])}
          />
          <KpiCard
            label="Confianza en el gobierno (ICG)"
            value={icgObj.value != null ? decimal2(icgObj.value) : "—"}
            period={formatPeriod(icgObj.period)}
            change={formatDeltaPct(icgDeltaPct)}
            changeDirection={direction(icgDeltaPct)}
            goodDirection="up"
            accentColor="var(--chart-6)"
            delay={0.05}
            sparkData={series.icg.slice(-12).map((d) => d[1])}
          />
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <AreaChart
            data={series.icc}
            label="Confianza del consumidor (ICC)"
            color="var(--chart-3)"
            format="index"
            description="Índice de Confianza del Consumidor de la UTDT. Surge de una encuesta mensual sobre la situación personal, la del país y la predisposición a comprar bienes durables. Sube cuando el optimismo de los hogares crece."
            source="UTDT (CIF) vía datos.gob.ar"
          />
          <AreaChart
            data={series.icg}
            label="Confianza en el gobierno (ICG)"
            color="var(--chart-6)"
            format="index"
            description="Índice de Confianza en el Gobierno de la UTDT, en una escala de 0 a 5. Mide la valoración de la gestión de gobierno a partir de una encuesta mensual."
            source="UTDT vía datos.gob.ar"
          />
        </div>
        <div className="mt-6">
          <AnalysisPanel
            data={series.icc}
            noun="la confianza del consumidor"
            format="index"
            goodDirection="up"
          />
        </div>
      </section>

      {/* ════════════════════════════ MERCADO FINANCIERO ════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-5 mt-20 scroll-mt-20" id="mercado">
        <SectionHeader
          eyebrow="Finanzas"
          title="Mercado financiero"
          subtitle="Riesgo país, S&P Merval y ADRs argentinos. Datos de cierre diario."
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <KpiCard
            label="Riesgo país (EMBI)"
            value={
              val(mercado.riesgoPais, "value") != null
                ? `${Math.round(Number(val(mercado.riesgoPais, "value")))} pb`
                : "—"
            }
            period={formatPeriod(val(mercado.riesgoPais, "period"))}
            change={formatDeltaPct(val(mercado.riesgoPais, "monthly_change"))}
            changeDirection={direction(val(mercado.riesgoPais, "monthly_change"))}
            goodDirection="down"
            accentColor="var(--chart-7)"
            sparkData={series.riesgoPais.slice(-12).map((d) => d[1])}
          />
          <KpiCard
            label="Merval"
            value={
              val(mercado.merval, "value") != null
                ? Math.round(Number(val(mercado.merval, "value"))).toLocaleString("es-AR")
                : "—"
            }
            period={formatPeriod(val(mercado.merval, "period"))}
            change={formatDeltaPct(val(mercado.merval, "monthly_change"))}
            changeDirection={direction(val(mercado.merval, "monthly_change"))}
            goodDirection="up"
            accentColor="var(--chart-2)"
            sparkData={series.merval.slice(-12).map((d) => d[1])}
          />
          <KpiCard
            label="GGAL ADR"
            value={
              val(mercado.ggal, "value") != null
                ? `US$ ${Number(val(mercado.ggal, "value")).toFixed(2)}`
                : "—"
            }
            period={formatPeriod(val(mercado.ggal, "period"))}
            change={formatDeltaPct(val(mercado.ggal, "monthly_change"))}
            changeDirection={direction(val(mercado.ggal, "monthly_change"))}
            goodDirection="up"
            accentColor="var(--chart-6)"
            sparkData={series.ggal.slice(-12).map((d) => d[1])}
          />
          <KpiCard
            label="YPF ADR"
            value={
              val(mercado.ypf, "value") != null
                ? `US$ ${Number(val(mercado.ypf, "value")).toFixed(2)}`
                : "—"
            }
            period={formatPeriod(val(mercado.ypf, "period"))}
            change={formatDeltaPct(val(mercado.ypf, "monthly_change"))}
            changeDirection={direction(val(mercado.ypf, "monthly_change"))}
            goodDirection="up"
            accentColor="var(--chart-8)"
            sparkData={series.ypf.slice(-12).map((d) => d[1])}
          />
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <AreaChart
            data={series.riesgoPais}
            label="Riesgo país EMBI (puntos básicos)"
            color="var(--chart-7)"
            format="index"
            description="Sobretasa que pagan los bonos soberanos argentinos por encima del Tesoro de EE.UU. Mide la percepción de riesgo de default."
            source="ArgentinaDatos / Ámbito"
          />
          <AreaChart
            data={series.merval}
            label="S&P Merval (ARS, cierre mensual)"
            color="var(--chart-2)"
            format="index"
            description="Índice principal de la Bolsa de Comercio de Buenos Aires. Captura las acciones argentinas más líquidas."
            source="Yahoo Finance"
          />
        </div>
      
        <div className="mt-6">
          <AnalysisPanel
            data={series.riesgoPais}
            noun="el riesgo país"
            format="basis_points"
            goodDirection="down"
          />
        </div>
      </section>

      {/* ════════════════════════════ POLÍTICA MONETARIA ════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-5 mt-20 scroll-mt-20" id="monetario">
        <SectionHeader
          eyebrow="BCRA"
          title="Política monetaria"
          subtitle="Tasa de política, reservas, agregados monetarios y expectativas de inflación."
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <KpiCard
            label="TPM"
            value={
              val(monetario.tpm, "value") != null
                ? `${Number(val(monetario.tpm, "value")).toFixed(1)}%`
                : "—"
            }
            period={formatPeriod(val(monetario.tpm, "period"))}
            accentColor="var(--chart-1)"
            sparkData={series.tpm.slice(-24).map((d) => d[1])}
          />
          <KpiCard
            label="Reservas BCRA"
            value={
              val(monetario.reservas, "value") != null
                ? `US$ ${Math.round(Number(val(monetario.reservas, "value")) / 1000)} mil M`
                : "—"
            }
            period={formatPeriod(val(monetario.reservas, "period"))}
            change={formatDeltaPct(val(monetario.reservas, "monthly_change"))}
            changeDirection={direction(val(monetario.reservas, "monthly_change"))}
            goodDirection="up"
            accentColor="var(--chart-6)"
            sparkData={series.reservas.slice(-24).map((d) => d[1])}
          />
          <KpiCard
            label="BADLAR"
            value={
              val(monetario.badlar, "value") != null
                ? `${Number(val(monetario.badlar, "value")).toFixed(1)}%`
                : "—"
            }
            period={formatPeriod(val(monetario.badlar, "period"))}
            accentColor="var(--chart-3)"
            sparkData={series.badlar.slice(-24).map((d) => d[1])}
          />
          <KpiCard
            label="Plazo fijo 30d"
            value={
              val(monetario.plazoFijo30d, "value") != null
                ? `${Number(val(monetario.plazoFijo30d, "value")).toFixed(1)}%`
                : "—"
            }
            period={formatPeriod(val(monetario.plazoFijo30d, "period"))}
            accentColor="var(--chart-3)"
            sparkData={series.plazoFijo30d.slice(-24).map((d) => d[1])}
          />
          <KpiCard
            label="REM inflación 12m"
            value={
              val(monetario.remInflacion12m, "value") != null
                ? `${Number(val(monetario.remInflacion12m, "value")).toFixed(1)}%`
                : "—"
            }
            period={formatPeriod(val(monetario.remInflacion12m, "period"))}
            accentColor="var(--chart-1)"
            sparkData={series.remInflacion12m.slice(-12).map((d) => d[1])}
          />
          <KpiCard
            label="Base monetaria"
            value={
              val(monetario.baseMonetaria, "value") != null
                ? `$${Math.round(Number(val(monetario.baseMonetaria, "value")) / 1000)} mil M`
                : "—"
            }
            period={formatPeriod(val(monetario.baseMonetaria, "period"))}
            change={formatDeltaPct(val(monetario.baseMonetaria, "monthly_change"))}
            changeDirection={direction(val(monetario.baseMonetaria, "monthly_change"))}
            goodDirection="down"
            accentColor="var(--chart-4)"
            sparkData={series.baseMonetaria.slice(-24).map((d) => d[1])}
          />
          <KpiCard
            label="M2 priv. (YoY)"
            value={
              val(monetario.m2PrivadoYoy, "value") != null
                ? `${Number(val(monetario.m2PrivadoYoy, "value")).toFixed(1)}%`
                : "—"
            }
            period={formatPeriod(val(monetario.m2PrivadoYoy, "period"))}
            accentColor="var(--chart-4)"
            sparkData={series.m2PrivadoYoy.slice(-12).map((d) => d[1])}
          />
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <AreaChart
            data={series.reservas}
            label="Reservas internacionales BCRA (USD millones)"
            color="var(--chart-6)"
            format="index"
            description="Stock de reservas internacionales del Banco Central. Incluye oro, divisas y DEGs del FMI."
            source="BCRA"
          />
          <AreaChart
            data={series.tpm}
            label="Tasa de política monetaria (% anual)"
            color="var(--chart-1)"
            format="decimal"
            description="Tasa de referencia que fija el BCRA en sus operaciones de mercado abierto. Define el costo del dinero en pesos."
            source="BCRA"
          />
        </div>
      
        <div className="mt-6">
          <AnalysisPanel
            data={series.reservas}
            noun="las reservas del BCRA"
            format="currency_usd"
            goodDirection="up"
          />
        </div>
      </section>

      {/* ════════════════════════════ SECTOR EXTERNO ════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-5 mt-20 scroll-mt-20" id="comercio">
        <SectionHeader
          eyebrow="Comercio exterior"
          title="Sector externo"
          subtitle="Exportaciones, importaciones y balanza comercial. Datos del ICA (INDEC), valor FOB para exports, CIF para imports."
        />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <KpiCard
            label="Exportaciones"
            value={
              val(comercio.exportTotal, "value") != null
                ? `US$ ${Math.round(Number(val(comercio.exportTotal, "value"))).toLocaleString("es-AR")} M`
                : "—"
            }
            period={formatPeriod(val(comercio.exportTotal, "period"))}
            change={formatDeltaPct(val(comercio.exportTotal, "yoy_change"))}
            changeDirection={direction(val(comercio.exportTotal, "yoy_change"))}
            changeLabel="a/a"
            goodDirection="up"
            accentColor="var(--chart-2)"
            sparkData={series.exportTotal.slice(-12).map((d) => d[1])}
          />
          <KpiCard
            label="Importaciones"
            value={
              val(comercio.importTotal, "value") != null
                ? `US$ ${Math.round(Number(val(comercio.importTotal, "value"))).toLocaleString("es-AR")} M`
                : "—"
            }
            period={formatPeriod(val(comercio.importTotal, "period"))}
            change={formatDeltaPct(val(comercio.importTotal, "yoy_change"))}
            changeDirection={direction(val(comercio.importTotal, "yoy_change"))}
            changeLabel="a/a"
            goodDirection="up"
            accentColor="var(--chart-6)"
            sparkData={series.importTotal.slice(-12).map((d) => d[1])}
          />
          <KpiCard
            label="Balanza comercial"
            value={
              val(comercio.balanzaComercial, "value") != null
                ? `US$ ${Number(val(comercio.balanzaComercial, "value")) >= 0 ? "+" : ""}${Math.round(Number(val(comercio.balanzaComercial, "value"))).toLocaleString("es-AR")} M`
                : "—"
            }
            period={formatPeriod(val(comercio.balanzaComercial, "period"))}
            change={formatDeltaPct(val(comercio.balanzaComercial, "yoy_change"))}
            changeDirection={direction(val(comercio.balanzaComercial, "yoy_change"))}
            changeLabel="a/a"
            goodDirection="up"
            accentColor={
              Number(val(comercio.balanzaComercial, "value")) >= 0
                ? "var(--chart-2)"
                : "var(--chart-7)"
            }
            sparkData={series.balanzaComercial.slice(-12).map((d) => d[1])}
          />
        </div>

        {/* Breakdown rubros export */}
        <h3
          className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ color: "var(--color-text-muted)" }}
        >
          Exportaciones por gran rubro
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            {
              label: "Productos primarios",
              ind: comercio.exportPrimarios,
              color: "var(--chart-3)",
            },
            { label: "MOA (Agropec.)", ind: comercio.exportMoa, color: "var(--chart-2)" },
            { label: "MOI (Industrial)", ind: comercio.exportMoi, color: "var(--chart-6)" },
            {
              label: "Combustibles y energía",
              ind: comercio.exportCombustibles,
              color: "var(--chart-1)",
            },
          ].map((row) => (
            <KpiCard
              key={row.label}
              label={row.label}
              value={
                val(row.ind, "value") != null
                  ? `US$ ${Math.round(Number(val(row.ind, "value"))).toLocaleString("es-AR")} M`
                  : "—"
              }
              period={formatPeriod(val(row.ind, "period"))}
              change={formatDeltaPct(val(row.ind, "yoy_change"))}
              changeDirection={direction(val(row.ind, "yoy_change"))}
            changeLabel="a/a"
              goodDirection="up"
              accentColor={row.color}
            />
          ))}
        </div>

        {/* Breakdown rubros import */}
        <h3
          className="text-xs font-semibold uppercase tracking-wider mb-3"
          style={{ color: "var(--color-text-muted)" }}
        >
          Importaciones por uso económico
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {[
            { label: "Intermedios", ind: comercio.importIntermedios, color: "var(--chart-4)" },
            { label: "BK + Piezas", ind: comercio.importBkYPiezas, color: "var(--chart-6)" },
            { label: "Consumo", ind: comercio.importConsumo, color: "var(--chart-7)" },
            { label: "Combustibles", ind: comercio.importCombustibles, color: "var(--chart-1)" },
            { label: "Vehículos", ind: comercio.importVehiculos, color: "var(--chart-8)" },
          ].map((row) => (
            <KpiCard
              key={row.label}
              label={row.label}
              value={
                val(row.ind, "value") != null
                  ? `US$ ${Math.round(Number(val(row.ind, "value"))).toLocaleString("es-AR")} M`
                  : "—"
              }
              period={formatPeriod(val(row.ind, "period"))}
              change={formatDeltaPct(val(row.ind, "yoy_change"))}
              changeDirection={direction(val(row.ind, "yoy_change"))}
            changeLabel="a/a"
              goodDirection="up"
              accentColor={row.color}
            />
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <AreaChart
            data={series.exportTotal}
            label="Exportaciones totales (USD millones, mensual)"
            color="var(--chart-2)"
            format="index"
            description="Valor FOB (Free On Board) de las exportaciones de bienes. Suma de productos primarios, MOA, MOI y combustibles."
            source="INDEC — ICA (Intercambio Comercial Argentino)"
          />
          <AreaChart
            data={series.balanzaComercial}
            label="Balanza comercial (USD millones)"
            color="var(--chart-6)"
            format="index"
            description="Diferencia entre exportaciones e importaciones de bienes. Positiva = superávit; negativa = déficit comercial."
            source="INDEC — ICA"
          />
        </div>
      
        <div className="mt-6">
          <AnalysisPanel
            data={series.balanzaComercial}
            noun="la balanza comercial"
            format="currency_usd"
            goodDirection="up"
          />
        </div>
      </section>

      {/* ════════════════════════════ DEUDA PÚBLICA ════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-5 mt-20 scroll-mt-20" id="deuda">
        <SectionHeader
          eyebrow="Sector fiscal"
          title="Deuda pública"
          subtitle="Stock de deuda del Sector Público Nacional por instrumento y acreedor. Datos MECON, serie histórica 1992-2025."
        />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {[
            {
              label: "Deuda total bruta",
              ind: deuda.total,
              color: "var(--chart-7)",
              spark: series.deudaTotal,
            },
            {
              label: "Títulos públicos",
              ind: deuda.titulos,
              color: "var(--chart-6)",
            },
            {
              label: "Préstamos",
              ind: deuda.prestamos,
              color: "var(--chart-3)",
            },
            {
              label: "FMI / Organismos intl.",
              ind: deuda.organismosIntl,
              color: "var(--chart-1)",
              spark: series.deudaOrganismosIntl,
            },
            {
              label: "Adelantos BCRA",
              ind: deuda.adelantosBcra,
              color: "var(--chart-4)",
            },
          ].map((row) => (
            <KpiCard
              key={row.label}
              label={row.label}
              value={
                val(row.ind, "value") != null
                  ? `US$ ${Math.round(Number(val(row.ind, "value")) / 1000)} mil M`
                  : "—"
              }
              period={
                val(row.ind, "period")
                  ? String(val(row.ind, "period")).slice(0, 4)
                  : undefined
              }
              change={formatDeltaPct(val(row.ind, "yoy_change"))}
              changeDirection={direction(val(row.ind, "yoy_change"))}
            changeLabel="a/a"
              goodDirection="down"
              accentColor={row.color}
              sparkData={
                row.spark ? row.spark.slice(-12).map((d) => d[1]) : undefined
              }
            />
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <AreaChart
            data={series.deudaTotal}
            label="Deuda Pública Bruta Total (USD millones, anual)"
            color="var(--chart-7)"
            format="index"
            description="Stock total de la Deuda Pública Bruta del Sector Público Nacional al cierre de cada año, expresada en dólares al tipo de cambio de cierre."
            source="MECON — Secretaría de Finanzas"
          />
          <AreaChart
            data={series.deudaOrganismosIntl}
            label="Deuda con Organismos Internacionales — FMI/BIRF/BID (USD M)"
            color="var(--chart-1)"
            format="index"
            description="Subcomponente de la deuda con multilaterales (FMI, Banco Mundial, BID). Los saltos en 2018 y 2025 corresponden a acuerdos con el FMI."
            source="MECON — Secretaría de Finanzas"
          />
        </div>
        <p
          className="mt-4 text-xs leading-relaxed"
          style={{ color: "var(--color-text-muted)" }}
        >
          <strong>Cómo leer:</strong> el stock total de la deuda incluye
          deuda pendiente de reestructuración y valores negociables. Los
          saltos grandes en 2002 (default) y 2018 (acuerdo FMI) muestran
          eventos clave. La deuda con organismos internacionales subió
          ~USD 21.000 M entre 2024 y 2025 por el desembolso del nuevo
          acuerdo con el FMI (abril 2025). Datos del Ministerio de
          Economía, hoja A.2.5 del Excel trimestral de deuda.
        </p>
      
        <div className="mt-6">
          <AnalysisPanel
            data={series.deudaTotal}
            noun="la deuda pública total"
            format="currency_usd"
            goodDirection="down"
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
            description="Porcentaje de personas bajo la línea de pobreza (ingresos < Canasta Básica Total). Medición semestral por aglomerado urbano."
            source="INDEC — EPH"
          />
          <AreaChart
            data={series.indigencia}
            label="Línea de indigencia ($ por adulto/mes)"
            color="var(--chart-3)"
            format="peso"
            description="Valor monetario de la Canasta Básica Alimentaria por adulto equivalente. Define el umbral de indigencia."
            source="INDEC — CBA/CBT"
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
      
        <div className="mt-6">
          <AnalysisPanel
            data={series.pobreza}
            noun="la tasa de pobreza"
            format="percent"
            goodDirection="down"
          />
        </div>
      </section>

      <Footer />
    </>
  );
}
