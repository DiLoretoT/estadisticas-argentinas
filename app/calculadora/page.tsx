import Link from "next/link";
import { readSeries } from "@/lib/readData";
import { CalculadoraInflacion } from "@/components/CalculadoraInflacion";
import { Footer } from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calculadora de inflación",
  description:
    "Calculadora oficial de inflación argentina. Convertí pesos entre fechas usando el IPC INDEC.",
};

export default async function CalculadoraPage() {
  const ipcSeries = await readSeries("inflacion_mensual.json");

  return (
    <>
      <div
        className="mx-auto max-w-3xl px-5"
        style={{
          paddingTop: "calc(var(--navbar-h) + 3rem)",
          paddingBottom: "4rem",
        }}
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium mb-6 transition-colors duration-200"
          style={{ color: "var(--color-text-muted)" }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Volver
        </Link>

        <div className="mb-10">
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em] mb-2"
            style={{ color: "var(--color-primary)" }}
          >
            Herramienta
          </p>
          <h1
            className="text-3xl md:text-4xl font-bold"
            style={{ color: "var(--color-text)" }}
          >
            Calculadora de inflación
          </h1>
          <p
            className="mt-3 text-base max-w-xl"
            style={{ color: "var(--color-text-muted)" }}
          >
            Calculá cuánto equivalen pesos de una fecha en pesos de otra usando
            el IPC oficial del INDEC. Útil para ajustar valores históricos,
            comparar precios, o entender cuánto perdió un sueldo en términos
            reales.
          </p>
        </div>

        <CalculadoraInflacion ipcSeries={ipcSeries} />

        <div className="mt-12 grid md:grid-cols-2 gap-4">
          <div
            className="rounded-xl p-5 border"
            style={{
              background: "var(--color-bg-alt)",
              borderColor: "var(--color-border)",
            }}
          >
            <h3
              className="text-sm font-semibold mb-2"
              style={{ color: "var(--color-text)" }}
            >
              ¿Cómo funciona?
            </h3>
            <p
              className="text-xs leading-relaxed"
              style={{ color: "var(--color-text-muted)" }}
            >
              Construimos un índice acumulado de IPC desde mayo 2016
              (base 100). Para convertir un monto entre dos fechas, multiplicamos
              por el cociente entre el índice del mes destino y el mes origen.
            </p>
          </div>
          <div
            className="rounded-xl p-5 border"
            style={{
              background: "var(--color-bg-alt)",
              borderColor: "var(--color-border)",
            }}
          >
            <h3
              className="text-sm font-semibold mb-2"
              style={{ color: "var(--color-text)" }}
            >
              Limitación
            </h3>
            <p
              className="text-xs leading-relaxed"
              style={{ color: "var(--color-text-muted)" }}
            >
              Sólo cubre desde mayo 2016 (cuando arranca la serie del IPC
              Nacional). Para períodos anteriores haría falta empalmar con
              IPC GBA o IPC CABA, que tienen metodologías distintas. Próximamente.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
