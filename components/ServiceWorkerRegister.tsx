"use client";

import { useEffect } from "react";

/**
 * Registra el service worker (/sw.js) en producción. Sin UI.
 * En desarrollo no se registra para no interferir con el HMR de Next.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Silencioso: el SW es progressive enhancement.
      });
    };

    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
