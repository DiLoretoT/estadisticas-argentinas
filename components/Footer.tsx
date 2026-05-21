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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand + descripción */}
          <div className="md:col-span-2">
            <a
              href="https://datalogia.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mb-3"
            >
              <img
                src="/branding/datalogia-isotipo.png"
                alt="Datalogía"
                width={24}
                height={24}
                className="rounded"
              />
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
              Indicadores macroeconómicos y sociales de Argentina con datos
              oficiales, actualizados automáticamente desde APIs públicas.
              Proyecto open source.
            </p>
          </div>

          {/* Proyecto */}
          <div>
            <h4
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: "var(--color-text)" }}
            >
              Proyecto
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://github.com/DiLoretoT/estadisticas-argentinas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Repositorio en GitHub
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
              <li>
                <a
                  href="https://github.com/DiLoretoT/estadisticas-argentinas/blob/main/docs/PLAN.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Roadmap
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/DiLoretoT/estadisticas-argentinas/blob/main/LICENSE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Licencia MIT
                </a>
              </li>
            </ul>
          </div>

          {/* Autor */}
          <div>
            <h4
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: "var(--color-text)" }}
            >
              Autor
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://github.com/DiLoretoT"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/in/tomas-di-loreto"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href="https://datalogia.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  datalogia.app
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
            © {new Date().getFullYear()} Tomás Di Loreto. Datos abiertos sin
            garantía. No es asesoramiento financiero.
          </p>
        </div>
      </div>
    </footer>
  );
}
