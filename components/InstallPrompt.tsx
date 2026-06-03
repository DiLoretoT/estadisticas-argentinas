"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SiteMark } from "@/components/SiteMark";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "ea-install-dismissed";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !/crios|fxios/i.test(navigator.userAgent) // sólo Safari soporta A2HS en iOS
  );
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      /* localStorage no disponible */
    }
    if (dismissed) return;

    // Android / desktop Chrome
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    const onInstalled = () => setVisible(false);
    window.addEventListener("appinstalled", onInstalled);

    // iOS Safari: no hay beforeinstallprompt → mostramos instrucción tras un delay.
    let iosTimer: ReturnType<typeof setTimeout> | undefined;
    if (isIos()) {
      iosTimer = setTimeout(() => {
        setIosHint(true);
        setVisible(true);
      }, 2500);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* noop */
    }
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
        >
          <div
            role="dialog"
            aria-label="Instalar la aplicación"
            className="w-full max-w-md rounded-2xl border p-4 flex items-start gap-3"
            style={{
              background: "var(--color-card)",
              borderColor: "var(--color-border)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <span
              className="flex-shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: "var(--color-primary-soft)", color: "var(--mark-color)" }}
            >
              <SiteMark size={22} />
            </span>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                Instalá Estadísticas Argentinas
              </p>
              {iosHint ? (
                <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                  Tocá{" "}
                  <span aria-hidden style={{ color: "var(--color-primary)" }}>
                    Compartir ⬆️
                  </span>{" "}
                  y elegí <strong>Agregar a inicio</strong> para tenerla como app.
                </p>
              ) : (
                <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                  Agregala a tu pantalla de inicio: abre a pantalla completa y se
                  actualiza sola.
                </p>
              )}

              <div className="mt-3 flex items-center gap-2">
                {!iosHint && (
                  <button
                    type="button"
                    onClick={install}
                    className="px-4 py-1.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
                    style={{ background: "var(--color-primary)", color: "#fff" }}
                  >
                    Instalar
                  </button>
                )}
                <button
                  type="button"
                  onClick={dismiss}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {iosHint ? "Entendido" : "Ahora no"}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={dismiss}
              aria-label="Cerrar"
              className="flex-shrink-0 -mr-1 -mt-1 p-1 rounded-lg transition-colors"
              style={{ color: "var(--color-text-muted)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
