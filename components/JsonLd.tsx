/**
 * Renderiza uno o varios bloques JSON-LD (schema.org) como <script>.
 *
 * Server-safe (sin "use client"): se puede usar tanto en Server Components
 * como dentro del árbol de un Client Component prerenderizado — en ambos casos
 * el <script> queda en el HTML que ven los crawlers.
 *
 * El `<` se escapa para evitar que un eventual "</script>" en los datos rompa
 * el bloque (defensa en profundidad; hoy los datos son todos estáticos).
 */
export function JsonLd({ data }: { data: object | object[] }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
