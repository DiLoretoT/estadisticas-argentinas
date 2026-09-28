"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="mx-auto max-w-md px-5 py-32 text-center"
      style={{ color: "var(--color-text)" }}
    >
      <h1 className="text-2xl font-bold mb-3">No pudimos cargar esta sección</h1>
      <p className="text-sm mb-8" style={{ color: "var(--color-text-muted)" }}>
        Falló la lectura de los datos. Suele ser algo momentáneo de la fuente;
        probá de nuevo en unos segundos.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
          style={{ background: "var(--color-primary)", color: "#fff" }}
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
        >
          Ir al tablero
        </Link>
      </div>
      {error.digest && (
        <p className="text-xs font-mono mt-8" style={{ color: "var(--color-text-muted)" }}>
          Referencia: {error.digest}
        </p>
      )}
    </div>
  );
}
