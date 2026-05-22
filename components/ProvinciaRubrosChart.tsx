"use client";

interface Props {
  pp: number;
  moa: number;
  moi: number;
  cye: number;
}

const COLORS = {
  pp: "var(--chart-3)",
  moa: "var(--chart-2)",
  moi: "var(--chart-6)",
  cye: "var(--chart-1)",
};

const LABELS = {
  pp: "Productos primarios",
  moa: "MOA — agroindustrial",
  moi: "MOI — industrial",
  cye: "Combustibles y energía",
};

const EXPLAIN = {
  pp: "Soja sin procesar, trigo, cereales, frutas, minerales.",
  moa: "Harinas, aceites, vinos, carnes procesadas, lácteos.",
  moi: "Vehículos, autopartes, químicos, biotecnología, litio procesado.",
  cye: "Petróleo, gas natural, electricidad, biocombustibles.",
};

export function ProvinciaRubrosChart({ pp, moa, moi, cye }: Props) {
  const total = pp + moa + moi + cye;
  if (total <= 0) return null;

  const rubros: { key: "pp" | "moa" | "moi" | "cye"; value: number }[] = [
    { key: "pp", value: pp },
    { key: "moa", value: moa },
    { key: "moi", value: moi },
    { key: "cye", value: cye },
  ];

  return (
    <div
      className="rounded-xl border p-5"
      style={{
        background: "var(--color-card)",
        borderColor: "var(--color-border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <h3
        className="text-sm font-semibold mb-3"
        style={{ color: "var(--color-text)" }}
      >
        Composición de exportaciones por gran rubro
      </h3>

      {/* Stacked bar */}
      <div className="flex h-6 rounded-lg overflow-hidden mb-4">
        {rubros.map((r) => {
          const pct = (r.value / total) * 100;
          if (pct < 0.5) return null;
          return (
            <div
              key={r.key}
              style={{
                width: `${pct}%`,
                background: COLORS[r.key],
              }}
              title={`${LABELS[r.key]}: ${pct.toFixed(1)}%`}
            />
          );
        })}
      </div>

      {/* Detail list */}
      <ul className="space-y-2 text-sm">
        {rubros
          .sort((a, b) => b.value - a.value)
          .map((r) => {
            const pct = (r.value / total) * 100;
            return (
              <li key={r.key} className="flex items-center gap-3">
                <span
                  className="inline-block w-3 h-3 rounded shrink-0"
                  style={{ background: COLORS[r.key] }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className="font-semibold text-sm"
                      style={{ color: "var(--color-text)" }}
                    >
                      {LABELS[r.key]}
                    </span>
                    <span
                      className="tabular-nums font-bold text-sm"
                      style={{ color: COLORS[r.key] }}
                    >
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div
                    className="text-[11px] mt-0.5"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {EXPLAIN[r.key]} · USD{" "}
                    {r.value.toLocaleString("es-AR", { maximumFractionDigits: 0 })} M
                  </div>
                </div>
              </li>
            );
          })}
      </ul>
    </div>
  );
}
