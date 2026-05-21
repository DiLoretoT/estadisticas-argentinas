import Link from "next/link";
import { Footer } from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Metodología",
  description:
    "Cómo se construye Estadísticas Argentinas: fuentes oficiales, transformaciones aplicadas, frecuencia de actualización.",
};

interface IndicadorRow {
  nombre: string;
  fuente: string;
  api: string;
  frecuencia: string;
  unidad: string;
  notas: string;
}

const indicadores: IndicadorRow[] = [
  {
    nombre: "Inflación (IPC)",
    fuente: "INDEC — IPC Nacional base diciembre 2016",
    api: "datos.gob.ar — serie 101.1_I2NG_2016_M_22",
    frecuencia: "Mensual",
    unidad: "% variación mensual",
    notas: "Sin transformaciones. Variación mes contra mes inmediato anterior.",
  },
  {
    nombre: "Dólar oficial",
    fuente: "BCRA — Tipo de cambio minorista de referencia",
    api: "BCRA estadísticas cambiarias + datos.gob.ar",
    frecuencia: "Diaria · agregado mensual (cierre)",
    unidad: "$ ARS por USD",
    notas: "Mensual = valor del último día hábil del mes.",
  },
  {
    nombre: "Dólar blue",
    fuente: "argentinadatos.com (recopilación de fuentes no oficiales)",
    api: "api.argentinadatos.com/v1/cotizaciones/dolares/blue",
    frecuencia: "Diaria · agregado mensual",
    unidad: "$ ARS por USD",
    notas: "Fuentes secundarias del mercado paralelo. No es dato oficial.",
  },
  {
    nombre: "Brecha cambiaria",
    fuente: "Cálculo propio",
    api: "—",
    frecuencia: "Mensual",
    unidad: "% (blue / oficial − 1)",
    notas: "Calculada en el cliente al cargar la página de detalle del dólar.",
  },
  {
    nombre: "Euro",
    fuente: "BCRA",
    api: "BCRA estadísticas cambiarias",
    frecuencia: "Diaria · agregado mensual",
    unidad: "$ ARS por EUR",
    notas: "Cotización de referencia del BCRA.",
  },
  {
    nombre: "EMAE",
    fuente: "INDEC — Estimador Mensual de Actividad Económica, base 2004=100",
    api: "datos.gob.ar — serie 143.3_NO_PR_2004_A_21",
    frecuencia: "Mensual",
    unidad: "Índice base 2004=100",
    notas: "Serie original, no desestacionalizada.",
  },
  {
    nombre: "PBI trimestral",
    fuente: "INDEC — Producto Bruto Interno a precios constantes",
    api: "datos.gob.ar — serie 4.2_OGP_2004_T_17",
    frecuencia: "Trimestral",
    unidad: "Millones de pesos constantes (base 2004)",
    notas: "Datos a precios constantes para aislar el efecto inflación.",
  },
  {
    nombre: "RIPTE (salarios)",
    fuente: "INDEC / SSPM — Remuneración Imponible Promedio de Trabajadores Estables",
    api: "datos.gob.ar — series 158.1_REPTE_0_0_5 y 149.1_TL_INDIIOS_OCTU_0_21",
    frecuencia: "Mensual",
    unidad: "% variación mensual y nivel índice",
    notas: "Trabajadores formales en relación de dependencia.",
  },
  {
    nombre: "Salario real",
    fuente: "Cálculo propio (RIPTE / IPC)",
    api: "—",
    frecuencia: "Mensual",
    unidad: "Índice base 100",
    notas: "RIPTE nominal deflactado por IPC acumulado desde primer mes común.",
  },
  {
    nombre: "Desocupación",
    fuente: "INDEC — Encuesta Permanente de Hogares (EPH)",
    api: "datos.gob.ar — serie 42.3_EPH_PUNTUATAL_0_M_30",
    frecuencia: "Trimestral",
    unidad: "% de la población económicamente activa",
    notas: "Cobertura: 31 aglomerados urbanos.",
  },
  {
    nombre: "Tasa de empleo",
    fuente: "INDEC — EPH",
    api: "datos.gob.ar — serie 44.2_ECTET_0_T_30",
    frecuencia: "Trimestral",
    unidad: "% (ocupados / población total)",
    notas: "—",
  },
  {
    nombre: "Pobreza",
    fuente: "INDEC — EPH (línea de pobreza por CBT)",
    api: "datos.gob.ar — serie 64.2_POBLACION_NUA_0_0_34_74",
    frecuencia: "Semestral",
    unidad: "% personas bajo Canasta Básica Total",
    notas: "Datos publicados con desfase típico de 3-6 meses.",
  },
  {
    nombre: "Línea de indigencia",
    fuente: "INDEC — Canasta Básica Alimentaria",
    api: "datos.gob.ar — serie 150.1_LA_INDICIA_0_D_16",
    frecuencia: "Mensual",
    unidad: "$ ARS por adulto equivalente/mes",
    notas: "Valor monetario de la CBA. La tasa de indigencia como % de personas no está disponible como serie continua en datos.gob.ar.",
  },
];

export default function MetodologiaPage() {
  return (
    <>
      <div
        className="mx-auto max-w-5xl px-5"
        style={{
          paddingTop: "calc(var(--navbar-h) + 3rem)",
          paddingBottom: "4rem",
        }}
      >
        <Link
          href="/argentina"
          className="inline-flex items-center gap-1.5 text-xs font-medium mb-6 transition-colors duration-200"
          style={{ color: "var(--color-text-muted)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Volver
        </Link>

        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-2" style={{ color: "var(--color-primary)" }}>
            Documentación
          </p>
          <h1 className="text-3xl md:text-4xl font-bold" style={{ color: "var(--color-text)" }}>
            Metodología y fuentes
          </h1>
          <p className="mt-3 text-base max-w-2xl" style={{ color: "var(--color-text-muted)" }}>
            Detalle por indicador: fuente oficial, endpoint público de origen,
            frecuencia, unidad y transformaciones aplicadas (si las hay).
          </p>
        </div>

        {/* Pipeline */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-text)" }}>
            ¿Cómo se construye?
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                title: "1. Ingesta",
                body: "Un ETL en Python consume APIs públicas (datos.gob.ar, BCRA, argentinadatos) con reintentos exponenciales, validación de fechas y valores, y logging estructurado.",
              },
              {
                title: "2. Persistencia",
                body: "Los datos se almacenan en PostgreSQL 16 (series, observations, refresh_runs) para auditoría histórica y trazabilidad de cada corrida.",
              },
              {
                title: "3. Publicación",
                body: "Cada corrida exporta JSON a data/ que el frontend Next.js lee server-side. El deploy en Vercel no requiere Postgres: lee del filesystem.",
              },
            ].map((step) => (
              <div
                key={step.title}
                className="rounded-xl border p-5"
                style={{
                  background: "var(--color-card)",
                  borderColor: "var(--color-border)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--color-primary)" }}>
                  {step.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Tabla de indicadores */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-text)" }}>
            Indicadores
          </h2>
          <div
            className="rounded-xl border overflow-hidden"
            style={{
              background: "var(--color-card)",
              borderColor: "var(--color-border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead style={{ background: "var(--color-bg-alt)" }}>
                  <tr>
                    {["Indicador", "Fuente", "Frecuencia", "Unidad", "Notas"].map((th) => (
                      <th
                        key={th}
                        className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {th}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {indicadores.map((row, i) => (
                    <tr
                      key={row.nombre}
                      style={{
                        borderBottom: i < indicadores.length - 1 ? "1px solid var(--color-border)" : undefined,
                      }}
                    >
                      <td className="px-3 py-3 font-semibold align-top" style={{ color: "var(--color-text)" }}>
                        {row.nombre}
                      </td>
                      <td className="px-3 py-3 align-top" style={{ color: "var(--color-text)" }}>
                        <div>{row.fuente}</div>
                        <div className="text-[10px] mt-1 opacity-70 font-mono">{row.api}</div>
                      </td>
                      <td className="px-3 py-3 align-top" style={{ color: "var(--color-text-muted)" }}>
                        {row.frecuencia}
                      </td>
                      <td className="px-3 py-3 align-top" style={{ color: "var(--color-text-muted)" }}>
                        {row.unidad}
                      </td>
                      <td className="px-3 py-3 align-top leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                        {row.notas}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Eventos */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-text)" }}>
            Anotaciones de eventos macro
          </h2>
          <div
            className="rounded-xl border p-5"
            style={{
              background: "var(--color-card)",
              borderColor: "var(--color-border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
              Los gráficos del sitio incluyen marcadores verticales sobre eventos económicos
              relevantes de Argentina (corralito 2001, fin de la convertibilidad, default 2014,
              salida del cepo 2015, crisis 2018, PASO 2019, COVID, PASO 2023, devaluación
              Milei dic-2023, entre otros). Pasale el mouse al marcador en cualquier gráfico
              para ver fecha y descripción. El catálogo completo está en{" "}
              <a
                href="https://github.com/DiLoretoT/estadisticas-argentinas/blob/main/data/events.json"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
                style={{ color: "var(--color-primary)" }}
              >
                data/events.json
              </a>{" "}
              del repo y se puede extender enviando un PR.
            </p>
          </div>
        </section>

        {/* Reproducibilidad */}
        <section>
          <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-text)" }}>
            Reproducibilidad
          </h2>
          <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--color-text-muted)" }}>
            Todo el código (ETL Python + frontend Next.js + schema PostgreSQL) está disponible
            bajo licencia MIT en{" "}
            <a
              href="https://github.com/DiLoretoT/estadisticas-argentinas"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{ color: "var(--color-primary)" }}
            >
              GitHub
            </a>
            . Para regenerar los datos localmente: <code className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: "var(--color-bg-alt)", color: "var(--color-primary)" }}>make bootstrap</code>.
          </p>
        </section>
      </div>

      <Footer />
    </>
  );
}
