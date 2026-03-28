export function Footer() {
  return (
    <footer
      className="text-center py-6 text-xs border-t mt-16"
      style={{
        color: "var(--color-text-muted)",
        borderColor: "var(--color-border)",
      }}
    >
      <p>
        Fuentes: INDEC, BCRA, datos.gob.ar, argentinadatos.com — Datos
        actualizados automaticamente.
      </p>
    </footer>
  );
}
