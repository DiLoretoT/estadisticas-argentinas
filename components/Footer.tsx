import { SiteMark } from "@/components/SiteMark";

export function Footer() {
  return (
    <footer
      className="border-t mt-16"
      style={{
        borderColor: "var(--color-border)",
        background: "var(--color-bg-alt)",
      }}
    >
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand + descripción */}
          <div className="md:col-span-2">
            <a
              href="https://datalogia.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mb-3"
            >
              <span
                className="inline-flex items-center justify-center"
                style={{ color: "var(--mark-color)" }}
              >
                <SiteMark size={20} />
              </span>
              <span
                className="font-semibold text-sm"
                style={{ color: "var(--color-text)" }}
              >
                Datalogía
              </span>
            </a>
            <p
              className="text-sm leading-relaxed max-w-md"
              style={{ color: "var(--color-text-muted)" }}
            >
              Estadísticas Argentinas es un producto de datos abiertos del
              ecosistema Datalogía. Indicadores macroeconómicos y sociales con
              fuentes oficiales.
            </p>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 items-center">
              <a
                href="https://datalogia.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm font-medium hover:underline"
                style={{ color: "var(--color-primary)" }}
              >
                Conocer Datalogía →
              </a>
              <span style={{ color: "var(--color-text-muted)" }}>·</span>
              <a
                href="https://finanzas.datalogia.app/?utm_source=estadisticas-footer&utm_medium=cross-app&utm_campaign=ecosystem"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm font-medium hover:underline"
                style={{ color: "var(--color-primary)" }}
              >
                Probar Datalogía Finanzas 💸 →
              </a>
            </div>
          </div>

          {/* Navegación */}
          <div>
            <h4
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: "var(--color-text)" }}
            >
              Explorar
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="/calculadora"
                  className="hover:underline"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Calculadora de inflación
                </a>
              </li>
              <li>
                <a
                  href="/metodologia"
                  className="hover:underline"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Metodología y fuentes
                </a>
              </li>
              <li>
                <a
                  href="/status"
                  className="hover:underline"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Estado del pipeline
                </a>
              </li>
              <li>
                <a
                  href="/api/v1/openapi.json"
                  className="hover:underline"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  API pública (OpenAPI)
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="mt-8 pt-6 border-t flex flex-col md:flex-row justify-between items-center gap-3"
          style={{ borderColor: "var(--color-border)" }}
        >
          <p
            className="text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            Fuentes: INDEC · BCRA · datos.gob.ar · argentinadatos.com
          </p>
          <p
            className="text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            © {new Date().getFullYear()} Datalogía. Datos abiertos sin garantía.
            No es asesoramiento financiero.
          </p>
        </div>
      </div>
    </footer>
  );
}
