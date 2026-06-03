"use client";

interface KpiCardProps {
  label: string;
  value: string;
  /** Período del último dato (ej. "Feb 2026", "2026-03-27") */
  period?: string;
  /** Cambio vs período anterior. Si es porcentaje, pasalo como string ya formateado: "+1,2 pp" o "-0,3%". */
  change?: string;
  /** Direction del change. up = subió, down = bajó. */
  changeDirection?: "up" | "down" | "neutral";
  /** Sufijo aclaratorio del change. Default "m/m" (mes contra mes). Puede ser "a/a" (año contra año), "d/d", etc. */
  changeLabel?: string;
  /** En qué dirección "subir" es bueno. Si "down" (ej. desocupación), un up se pinta como danger. */
  goodDirection?: "up" | "down";
  accentColor?: string;
  delay?: number;
  sparkData?: number[];
}

export function KpiCard({
  label,
  value,
  period,
  change,
  changeDirection,
  goodDirection = "down",
  accentColor = "var(--color-primary)",
  changeLabel = "m/m",
  delay = 0,
  sparkData,
}: KpiCardProps) {
  void delay;
  // Determine semantic color of the change based on goodDirection
  let changeColor = "var(--color-text-muted)";
  if (changeDirection === "up") {
    changeColor =
      goodDirection === "up"
        ? "var(--color-success)"
        : "var(--color-danger)";
  } else if (changeDirection === "down") {
    changeColor =
      goodDirection === "up"
        ? "var(--color-danger)"
        : "var(--color-success)";
  }

  const arrow =
    changeDirection === "up" ? "↑" : changeDirection === "down" ? "↓" : "";

  return (
    <div
      className="rounded-xl p-4 border card-hover transition-transform duration-200 hover:-translate-y-0.5"
      style={{
        background: "var(--color-card)",
        borderColor: "var(--color-border)",
        boxShadow: "var(--shadow-sm)",
        borderTop: `3px solid ${accentColor}`,
      }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-wider mb-2"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </p>
      <div className="flex items-end justify-between gap-2">
        <div className="flex-1 min-w-0">
          <span
            className="block text-2xl font-bold tabular-nums leading-none"
            style={{ color: "var(--color-text)" }}
          >
            {value}
          </span>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {change && (
              <span
                className="inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums"
                style={{ color: changeColor }}
                title={
                  changeLabel === "a/a"
                    ? "Variación interanual (vs mismo período del año anterior)"
                    : changeLabel === "m/m"
                      ? "Variación mensual (vs período anterior)"
                      : "Variación respecto al período anterior"
                }
              >
                {arrow && <span>{arrow}</span>}
                {change}
                <span
                  className="font-normal ml-0.5 text-[10px] opacity-75"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {changeLabel}
                </span>
              </span>
            )}
            {period && (
              <span
                className="text-[10px] tabular-nums"
                style={{ color: "var(--color-text-muted)" }}
              >
                · {period}
              </span>
            )}
          </div>
        </div>

        {/* Sparkline */}
        {sparkData && sparkData.length > 1 && (
          <Sparkline data={sparkData} color={accentColor} />
        )}
      </div>
    </div>
  );
}

export function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 64;
  const h = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return { x, y };
    });

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join("");

  const areaD = `${pathD}L${points[points.length - 1].x.toFixed(1)},${h}L${points[0].x.toFixed(1)},${h}Z`;

  return (
    <svg
      width={w}
      height={h}
      className="flex-shrink-0"
      style={{ overflow: "visible" }}
    >
      <path d={areaD} fill={color} opacity={0.12} />
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.9}
      />
      {/* Last point marker */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={2}
        fill={color}
      />
    </svg>
  );
}
