"use client";

interface SnapshotRow {
  iso3: string;
  country: string;
  year: string | null;
  value: number | null;
}

interface Indicator {
  key: string;
  display_name: string;
  unit: string;
  higher_is_better: boolean;
  snapshot: SnapshotRow[];
}

interface Props {
  indicator: Indicator;
}

const FLAGS: Record<string, string> = {
  ARG: "🇦🇷",
  BRA: "🇧🇷",
  CHL: "🇨🇱",
  URY: "🇺🇾",
  COL: "🇨🇴",
  MEX: "🇲🇽",
  PER: "🇵🇪",
  BOL: "🇧🇴",
  PRY: "🇵🇾",
  ECU: "🇪🇨",
};

function fmtValue(v: number, unit: string): string {
  if (unit === "USD" || unit === "USD M") {
    if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(1)} mil M`;
    if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(0)} M`;
    if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(1)} K`;
    return v.toFixed(0);
  }
  if (unit === "%") return `${v.toFixed(1)}%`;
  return v.toLocaleString("es-AR", { maximumFractionDigits: 1 });
}

export function LatamRanking({ indicator }: Props) {
  const ranked = [...indicator.snapshot]
    .filter((r) => r.value !== null)
    .sort((a, b) => {
      const av = a.value!;
      const bv = b.value!;
      return indicator.higher_is_better ? bv - av : av - bv;
    });

  if (ranked.length === 0) {
    return (
      <div
        className="rounded-xl border p-5 text-sm"
        style={{
          background: "var(--color-card)",
          borderColor: "var(--color-border)",
          color: "var(--color-text-muted)",
        }}
      >
        Sin datos disponibles para {indicator.display_name}.
      </div>
    );
  }

  // Calcular el valor máximo (en abs) para escalar las barras.
  // Si Argentina (u otro) es un outlier extremo (>3x el segundo), usamos
  // el segundo valor como referencia para no aplastar todo el resto.
  const sortedDesc = [...ranked].sort(
    (a, b) => Math.abs(b.value!) - Math.abs(a.value!),
  );
  const topAbs = Math.abs(sortedDesc[0]?.value ?? 0);
  const secondAbs = Math.abs(sortedDesc[1]?.value ?? 0);
  const isOutlierTop = topAbs > 0 && secondAbs > 0 && topAbs / secondAbs > 3;
  const scaleMax = isOutlierTop ? secondAbs * 1.15 : topAbs;
  const lastYear = ranked[0].year;

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        background: "var(--color-card)",
        borderColor: "var(--color-border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-3 border-b flex items-baseline justify-between gap-2"
        style={{ borderColor: "var(--color-border)" }}
      >
        <h3
          className="text-sm font-semibold"
          style={{ color: "var(--color-text)" }}
        >
          {indicator.display_name}
        </h3>
        <span
          className="text-[10px] uppercase tracking-wider"
          style={{ color: "var(--color-text-muted)" }}
        >
          {lastYear}
        </span>
      </div>

      {/* Ranking con barras */}
      <div className="px-3 py-2">
        {ranked.map((row, i) => {
          const isArg = row.iso3 === "ARG";
          // Si la barra "real" exceda 100% (caso outlier), mostramos hasta 100%
          // pero agregamos una marca visual (raya en el borde derecho).
          const rawPct = (Math.abs(row.value!) / scaleMax) * 100;
          const widthPct = Math.min(rawPct, 100);
          const isClipped = rawPct > 100;
          const barColor = isArg ? "var(--color-primary)" : "var(--chart-6)";
          const textColor = isArg ? "var(--color-primary)" : "var(--color-text)";
          return (
            <div
              key={row.iso3}
              className="flex items-center gap-2 py-1.5"
              style={{
                background: isArg ? "var(--color-primary-soft)" : "transparent",
                borderRadius: "0.375rem",
                paddingLeft: "0.5rem",
                paddingRight: "0.5rem",
              }}
            >
              <span
                className="text-[10px] tabular-nums w-4 text-right"
                style={{ color: "var(--color-text-muted)" }}
              >
                {i + 1}
              </span>
              <span className="text-base flex-shrink-0">
                {FLAGS[row.iso3] || "🏳️"}
              </span>
              <span
                className="text-xs font-medium w-20 flex-shrink-0"
                style={{
                  color: textColor,
                  fontWeight: isArg ? 700 : 500,
                }}
              >
                {row.country}
              </span>
              <div className="flex-1 relative h-5">
                <div
                  className="absolute inset-y-0 left-0 rounded transition-all"
                  style={{
                    width: `${widthPct}%`,
                    background: barColor,
                    opacity: isArg ? 1 : 0.55,
                  }}
                />
                {isClipped && (
                  <div
                    className="absolute inset-y-0 right-0 w-1"
                    style={{
                      background: barColor,
                      borderTopRightRadius: 999,
                      borderBottomRightRadius: 999,
                      opacity: 1,
                    }}
                    title={`Valor real ${rawPct.toFixed(0)}% del 2do — escala recortada para legibilidad`}
                  />
                )}
              </div>
              <span
                className="text-xs font-semibold tabular-nums w-24 text-right flex-shrink-0"
                style={{ color: textColor }}
              >
                {fmtValue(row.value!, indicator.unit)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
