import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div
      className="mx-auto max-w-md px-5 py-32 text-center"
      style={{ color: "var(--color-text)" }}
    >
      <p
        className="text-sm font-mono mb-2"
        style={{ color: "var(--color-primary)" }}
      >
        404
      </p>
      <h1 className="text-2xl font-bold mb-3">Página no encontrada</h1>
      <p className="text-sm mb-8" style={{ color: "var(--color-text-muted)" }}>
        La dirección no existe o cambió. Los indicadores están agrupados en el
        tablero principal y en las secciones de detalle.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
          style={{ background: "var(--color-primary)", color: "#fff" }}
        >
          Ir al tablero
        </Link>
        <Link
          href="/explorar"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
        >
          Explorar series
        </Link>
      </div>
    </div>
  );
}
