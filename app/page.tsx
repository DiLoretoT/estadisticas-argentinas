import { promises as fs } from "fs";
import path from "path";
import Link from "next/link";
import { Footer } from "@/components/Footer";

interface Country {
  code: string;
  name: string;
  flag: string;
  status: "active" | "coming_soon";
  description: string;
  indicators_count: number;
  sources: string[];
}

async function readCountries(): Promise<Country[]> {
  try {
    const filePath = path.join(process.cwd(), "data", "countries.json");
    const content = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(content) as { countries: Country[] };
    return parsed.countries;
  } catch (error) {
    console.error("[Landing] No pude leer countries.json:", error);
    return [];
  }
}

export default async function Landing() {
  const countries = await readCountries();
  const active = countries.filter((c) => c.status === "active");
  const upcoming = countries.filter((c) => c.status === "coming_soon");

  return (
    <>
      <section
        className="mx-auto max-w-5xl px-5 text-center"
        style={{
          paddingTop: "calc(var(--navbar-h) + 4rem)",
          paddingBottom: "3rem",
        }}
      >
        <div
          className="absolute inset-x-0 top-0 -z-10 pointer-events-none"
          style={{
            height: 600,
            background:
              "radial-gradient(ellipse 60% 50% at 50% 0%, var(--color-primary-soft) 0%, transparent 70%)",
          }}
        />
        <p
          className="text-xs font-semibold uppercase tracking-[0.25em] mb-4"
          style={{ color: "var(--color-primary)" }}
        >
          Datalogía · Estadísticas
        </p>
        <h1
          className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight max-w-3xl mx-auto"
          style={{ color: "var(--color-text)" }}
        >
          Indicadores económicos de{" "}
          <span style={{ color: "var(--color-primary)" }}>LATAM</span>,
          en datos abiertos.
        </h1>
        <p
          className="mt-5 text-base md:text-lg max-w-2xl mx-auto"
          style={{ color: "var(--color-text-muted)" }}
        >
          Dashboard público con indicadores macroeconómicos y sociales por país,
          obtenidos de fuentes oficiales y actualizados automáticamente.
          Empezamos por Argentina; más países en camino.
        </p>
      </section>

      {/* Países activos */}
      <section className="mx-auto max-w-5xl px-5 mt-6">
        <div className="grid md:grid-cols-2 gap-5">
          {active.map((country) => (
            <Link
              key={country.code}
              href={`/${country.code}`}
              className="rounded-2xl border p-7 card-hover block"
              style={{
                background: "var(--color-card)",
                borderColor: "var(--color-border)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div className="flex items-start gap-4">
                <span className="text-5xl">{country.flag}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h2
                      className="text-2xl font-bold"
                      style={{ color: "var(--color-text)" }}
                    >
                      {country.name}
                    </h2>
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{
                        color: "var(--color-success)",
                        background: "var(--color-success-soft)",
                      }}
                    >
                      Activo
                    </span>
                  </div>
                  <p
                    className="text-sm"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {country.description}
                  </p>
                  <div
                    className="mt-4 flex items-center gap-3 text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    <span className="tabular-nums">
                      {country.indicators_count} indicadores
                    </span>
                    <span>·</span>
                    <span>{country.sources.join(" · ")}</span>
                  </div>
                </div>
              </div>
              <div
                className="mt-6 flex items-center justify-between text-sm font-medium pt-4 border-t"
                style={{ borderColor: "var(--color-border)" }}
              >
                <span style={{ color: "var(--color-primary)" }}>
                  Explorar →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Próximamente */}
      {upcoming.length > 0 && (
        <section className="mx-auto max-w-5xl px-5 mt-12">
          <h3
            className="text-xs font-semibold uppercase tracking-wider mb-4"
            style={{ color: "var(--color-text-muted)" }}
          >
            Próximamente
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcoming.map((country) => (
              <div
                key={country.code}
                className="rounded-xl border p-5"
                style={{
                  background: "var(--color-bg-alt)",
                  borderColor: "var(--color-border)",
                  opacity: 0.75,
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl grayscale">{country.flag}</span>
                  <span
                    className="font-semibold"
                    style={{ color: "var(--color-text)" }}
                  >
                    {country.name}
                  </span>
                </div>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {country.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Acerca del proyecto */}
      <section className="mx-auto max-w-3xl px-5 mt-20">
        <div
          className="rounded-2xl border p-8"
          style={{
            background: "var(--color-card)",
            borderColor: "var(--color-border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <h2
            className="text-xl font-bold mb-3"
            style={{ color: "var(--color-text)" }}
          >
            ¿Qué es esto?
          </h2>
          <p
            className="text-sm leading-relaxed mb-3"
            style={{ color: "var(--color-text-muted)" }}
          >
            Un dashboard público de indicadores económicos y sociales por país,
            con datos extraídos automáticamente de fuentes oficiales (institutos
            de estadística, bancos centrales). Open source, sin paywall, sin
            registro, sin tracking invasivo.
          </p>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--color-text-muted)" }}
          >
            Forma parte del ecosistema{" "}
            <a
              href="https://datalogia.app"
              className="underline"
              style={{ color: "var(--color-primary)" }}
            >
              Datalogía
            </a>
            . Código fuente:{" "}
            <a
              href="https://github.com/DiLoretoT/estadisticas-argentinas"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{ color: "var(--color-primary)" }}
            >
              GitHub
            </a>
            .
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
}
