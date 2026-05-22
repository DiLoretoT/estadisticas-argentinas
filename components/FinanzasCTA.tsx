/**
 * CTA reutilizable hacia Datalogía Finanzas. Diseñado para ser sutil pero
 * presente en momentos donde el user está pensando en su propia plata.
 */

const VARIANTS = {
  hero: {
    icon: "💸",
    title: "Hacé esto con tu plata, no solo con la del país",
    description:
      "Trackeá tus ingresos y gastos contra estos mismos indicadores en Datalogía Finanzas. Conocé tu inflación personal, tu sueldo en USD blue, tu poder de compra real.",
    cta: "Probar Finanzas",
  },
  inline: {
    icon: "📊",
    title: "Y vos, ¿cómo te afectan estos números?",
    description:
      "En Datalogía Finanzas vas a ver cómo se mueven tus gastos vs el IPC oficial, tu sueldo deflactado por inflación, y cuántos USD valés mes a mes.",
    cta: "Conocer Finanzas",
  },
  calculadora: {
    icon: "🧮",
    title: "Calculá esto automáticamente con tu plata",
    description:
      "Cargá tus ingresos y gastos en Datalogía Finanzas y la app convierte todo a pesos constantes vs IPC, USD blue o USD MEP automáticamente.",
    cta: "Ir a Finanzas",
  },
  provincia: {
    icon: "🏠",
    title: "Trackeá tu plata acá",
    description:
      "Si vivís en esta provincia, conocé tu inflación personal por categoría (alimentos, transporte, ocio) vs el IPC nacional. En Datalogía Finanzas.",
    cta: "Probar Finanzas",
  },
} as const;

export type CTAVariant = keyof typeof VARIANTS;

interface Props {
  variant?: CTAVariant;
  /** Custom UTM para tracking. Default basado en variant. */
  utm?: string;
}

export function FinanzasCTA({ variant = "inline", utm }: Props) {
  const v = VARIANTS[variant];
  const utmSource = utm || `estadisticas-${variant}`;
  const href = `https://finanzas.datalogia.app/?utm_source=${encodeURIComponent(utmSource)}&utm_medium=cross-app&utm_campaign=ecosystem`;

  return (
    <div
      className="rounded-xl border p-5 my-6"
      style={{
        background: "var(--color-primary-soft)",
        borderColor: "var(--color-primary)",
        borderWidth: "1px",
      }}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0">{v.icon}</span>
        <div className="flex-1 min-w-0">
          <h3
            className="text-base font-bold mb-1"
            style={{ color: "var(--color-primary)" }}
          >
            {v.title}
          </h3>
          <p
            className="text-sm leading-relaxed mb-3"
            style={{ color: "var(--color-text)" }}
          >
            {v.description}
          </p>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
            style={{
              background: "var(--color-primary)",
              color: "#fff",
            }}
          >
            {v.cta}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
      <p
        className="text-[10px] mt-3 ml-9"
        style={{ color: "var(--color-text-muted)" }}
      >
        Datalogía Finanzas — otra app del ecosistema. Misma data macro,
        aplicada a tu plata personal.
      </p>
    </div>
  );
}
