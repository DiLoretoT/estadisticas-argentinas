"use client";

import { useEffect, useState } from "react";

interface Props {
  /** Momento del último fetch exitoso (ms cliente). null = aún sin dato live. */
  fetchedAt: number | null;
}

function relativeLabel(fetchedAt: number, now: number): string {
  const mins = Math.floor((now - fetchedAt) / 60000);
  if (mins <= 0) return "recién";
  if (mins === 1) return "hace 1 min";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  return hours === 1 ? "hace 1 h" : `hace ${hours} h`;
}

/**
 * Indicador "En vivo · hace X min" para la sección de dólar. Tickea cada 30s
 * para mantener fresco el "hace X min" sin esperar al próximo poll.
 */
export function DolarLiveBadge({ fetchedAt }: Props) {
  // El badge solo se monta en cliente (fetchedAt arranca null en SSR), así que
  // inicializar con Date.now() no genera mismatch de hidratación.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  if (fetchedAt == null) return null;

  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium tabular-nums"
      style={{ color: "var(--color-text-muted)" }}
    >
      <span
        className="relative flex h-2 w-2"
        aria-hidden
      >
        <span
          className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
          style={{ background: "var(--color-positive, #16a34a)" }}
        />
        <span
          className="relative inline-flex h-2 w-2 rounded-full"
          style={{ background: "var(--color-positive, #16a34a)" }}
        />
      </span>
      En vivo · actualizado {relativeLabel(fetchedAt, now)}
    </span>
  );
}
