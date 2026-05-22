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
            <a
              href="https://datalogia.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 text-sm font-medium hover:underline"
              style={{ color: "var(--color-primary)" }}
            >
              Conocer Datalogía →
            </a>
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
                  href="/api/indicadores"
                  className="hover:underline"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  API pública
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
