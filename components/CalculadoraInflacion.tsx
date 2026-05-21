"use client";

import { useMemo, useState } from "react";

interface Props {
  /** IPC mensual como ratio decimal: [['2016-05-01', 0.041], ...] */
  ipcSeries: [string, number][];
}

const MESES = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

/** Build cumulative IPC index from monthly variations, starting at 100. */
function buildIPCIndex(series: [string, number][]): Map<string, number> {
  const sorted = [...series].sort((a, b) => a[0].localeCompare(b[0]));
  const map = new Map<string, number>();
  let level = 100;
  if (sorted.length === 0) return map;
  map.set(sorted[0][0].slice(0, 7), level);
  for (let i = 1; i < sorted.length; i++) {
    const prevRate = sorted[i - 1][1];
    level = level * (1 + prevRate);
    map.set(sorted[i][0].slice(0, 7), level);
  }
  return map;
}

function formatPeso(v: number): string {
  return v.toLocaleString("es-AR", { maximumFractionDigits: 0 });
}

export function CalculadoraInflacion({ ipcSeries }: Props) {
  const ipcIndex = useMemo(() => buildIPCIndex(ipcSeries), [ipcSeries]);
  const availableMonths = useMemo(() => Array.from(ipcIndex.keys()).sort(), [ipcIndex]);

  const earliestMonth = availableMonths[0] || "2016-05";
  const latestMonth = availableMonths[availableMonths.length - 1] || "2026-02";

  const [amount, setAmount] = useState<string>("10000");
  const [fromMonth, setFromMonth] = useState<string>("2020-01");
  const [toMonth, setToMonth] = useState<string>(latestMonth);

  const result = useMemo(() => {
    const amt = parseFloat(amount.replace(/[^\d.,]/g, "").replace(",", "."));
    if (isNaN(amt) || amt <= 0) return null;

    const fromIdx = ipcIndex.get(fromMonth);
    const toIdx = ipcIndex.get(toMonth);
    if (!fromIdx || !toIdx) return null;

    const factor = toIdx / fromIdx;
    const adjusted = amt * factor;
    const inflationPct = (factor - 1) * 100;

    return { adjusted, factor, inflationPct };
  }, [amount, fromMonth, toMonth, ipcIndex]);

  const monthOptions = availableMonths.map((m) => {
    const [y, mo] = m.split("-");
    const label = `${MESES[parseInt(mo, 10) - 1]} ${y}`;
    return { value: m, label };
  });

  return (
    <div
      className="rounded-2xl border p-6 md:p-8"
      style={{
        background: "var(--color-card)",
        borderColor: "var(--color-border)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="grid md:grid-cols-3 gap-4">
        {/* Monto */}
        <div>
          <label
            htmlFor="amount"
            className="block text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: "var(--color-text-muted)" }}
          >
            Monto
          </label>
          <div className="relative">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              $
            </span>
            <input
              id="amount"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-7 pr-3 py-2.5 rounded-lg border text-base tabular-nums"
              style={{
                background: "var(--color-bg)",
                borderColor: "var(--color-border)",
                color: "var(--color-text)",
              }}
              aria-label="Monto en pesos"
            />
          </div>
        </div>

        {/* From */}
        <div>
          <label
            htmlFor="from"
            className="block text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: "var(--color-text-muted)" }}
          >
            Desde
          </label>
          <select
            id="from"
            value={fromMonth}
            onChange={(e) => setFromMonth(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border text-sm"
            style={{
              background: "var(--color-bg)",
              borderColor: "var(--color-border)",
              color: "var(--color-text)",
            }}
            aria-label="Mes de origen"
          >
            {monthOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* To */}
        <div>
          <label
            htmlFor="to"
            className="block text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: "var(--color-text-muted)" }}
          >
            Hasta
          </label>
          <select
            id="to"
            value={toMonth}
            onChange={(e) => setToMonth(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border text-sm"
            style={{
              background: "var(--color-bg)",
              borderColor: "var(--color-border)",
              color: "var(--color-text)",
            }}
            aria-label="Mes de destino"
          >
            {monthOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Result */}
      <div
        className="mt-8 pt-6 border-t"
        style={{ borderColor: "var(--color-border)" }}
      >
        {result ? (
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: "var(--color-text-muted)" }}
              >
                Valor equivalente
              </p>
              <p
                className="text-3xl md:text-4xl font-bold tabular-nums"
                style={{ color: "var(--color-primary)" }}
              >
                ${formatPeso(result.adjusted)}
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--color-text-muted)" }}
              >
                de {monthOptions.find((m) => m.value === toMonth)?.label}
              </p>
            </div>
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: "var(--color-text-muted)" }}
              >
                Inflación acumulada
              </p>
              <p
                className="text-3xl md:text-4xl font-bold tabular-nums"
                style={{ color: "var(--chart-1)" }}
              >
                {result.inflationPct.toLocaleString("es-AR", {
                  maximumFractionDigits: 1,
                })}
                %
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--color-text-muted)" }}
              >
                en el período
              </p>
            </div>
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: "var(--color-text-muted)" }}
              >
                Factor de ajuste
              </p>
              <p
                className="text-3xl md:text-4xl font-bold tabular-nums"
                style={{ color: "var(--color-text)" }}
              >
                ×{result.factor.toLocaleString("es-AR", {
                  maximumFractionDigits: 2,
                })}
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--color-text-muted)" }}
              >
                multiplicador
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Ingresá un monto y un rango de meses válido para ver el resultado.
          </p>
        )}
      </div>

      <p
        className="mt-6 text-xs"
        style={{ color: "var(--color-text-muted)" }}
      >
        Calculado con IPC INDEC desde {monthOptions[0]?.label ?? "—"} hasta{" "}
        {monthOptions[monthOptions.length - 1]?.label ?? "—"}. El cálculo
        construye un índice acumulado desde las variaciones mensuales y divide.
      </p>
    </div>
  );
}
