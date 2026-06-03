import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sin conexión",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div
      className="mx-auto max-w-md px-5 py-32 text-center"
      style={{ color: "var(--color-text)" }}
    >
      <h1 className="text-2xl font-bold mb-3">Sin conexión</h1>
      <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
        No pudimos cargar los datos porque no hay conexión a internet. Las
        cotizaciones e indicadores se actualizan en vivo, así que necesitás estar
        online. Volvé a intentar cuando recuperes la señal.
      </p>
    </div>
  );
}
