"use client";

import { useEffect, useState } from "react";

/**
 * Polling client-side de /api/dolar para cotizaciones intradía.
 *
 * - Refetch cada 5 min mientras la pestaña está visible.
 * - Refetch al volver el foco / visibilidad (el usuario que vuelve ve fresco).
 * - El número se actualiza sin recargar la página.
 *
 * Devuelve un mapa { [label]: value } indexado por el mismo label que usan
 * las KPI cards ("Oficial", "Blue", "MEP", ...), más el timestamp de la
 * fuente y el momento (cliente) del último fetch para mostrar "hace X min".
 */

const POLL_MS = 5 * 60 * 1000; // 5 min

interface DolarLiveItem {
  value: number;
  venta: number | null;
  compra: number | null;
  fechaActualizacion: string;
}

interface DolarApiResponse {
  dolares: Record<string, DolarLiveItem>;
  updatedAt?: string;
  stale?: boolean;
}

export interface DolarLiveState {
  /** { "Oficial": 1050, "Blue": 1430, ... } — solo labels con dato fresco. */
  values: Record<string, number>;
  /** Timestamp de la fuente (ISO) del dato más reciente. */
  updatedAt: string | null;
  /** Momento del último fetch exitoso (ms cliente), para "hace X min". */
  fetchedAt: number | null;
  loading: boolean;
}

export function useDolarLive(): DolarLiveState {
  const [state, setState] = useState<DolarLiveState>({
    values: {},
    updatedAt: null,
    fetchedAt: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/dolar", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as DolarApiResponse;
        if (cancelled || json.stale) return;
        const values: Record<string, number> = {};
        for (const [label, item] of Object.entries(json.dolares ?? {})) {
          if (typeof item?.value === "number") values[label] = item.value;
        }
        if (Object.keys(values).length === 0) return;
        setState({
          values,
          updatedAt: json.updatedAt ?? null,
          fetchedAt: Date.now(),
          loading: false,
        });
      } catch {
        // silencioso: el front mantiene el dato estático server-rendered
      }
    }

    function onVisible() {
      if (document.visibilityState === "visible") load();
    }

    load();
    const timer = setInterval(load, POLL_MS);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return state;
}
