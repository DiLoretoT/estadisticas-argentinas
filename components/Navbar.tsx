"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { SiteMark } from "@/components/SiteMark";

interface NavItem {
  href: string;
  label: string;
  description?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Indicadores",
    items: [
      { href: "/#monedas", label: "Dólar", description: "7 cotizaciones + brecha cambiaria" },
      { href: "/#latam", label: "Más monedas", description: "BRL, CLP, UYU, PEN, COP, PYG, MXN, EUR" },
      { href: "/#precios", label: "Precios", description: "IPC mensual, YTD, interanual" },
      { href: "/#actividad", label: "Actividad", description: "EMAE y PBI" },
      { href: "/#mercado", label: "Mercado financiero", description: "Riesgo país, Merval, ADRs" },
      { href: "/#monetario", label: "Política monetaria", description: "TPM, Reservas, BADLAR, M2, REM" },
      { href: "/#comercio", label: "Sector externo", description: "Exportaciones, importaciones, balanza" },
      { href: "/#deuda", label: "Deuda pública", description: "Stock total 1992-2025" },
      { href: "/#empleo", label: "Empleo e ingresos", description: "Desocupación, empleo, salario real" },
      { href: "/#social", label: "Social", description: "Pobreza e indigencia" },
    ],
  },
  {
    label: "Análisis",
    items: [
      { href: "/explorar", label: "Explorar series", description: "Multi-serie + doble eje + filtros de período" },
      { href: "/analisis", label: "Análisis cruzado", description: "Scatter de 2 series + correlación" },
      { href: "/comparativa", label: "Comparativa LATAM", description: "Argentina vs 9 países" },
      { href: "/mapa", label: "Mapa por provincia", description: "Choropleth de las 24 jurisdicciones" },
    ],
  },
  {
    label: "Herramientas",
    items: [
      { href: "/calculadora", label: "Calculadora de inflación", description: "Convertir pesos entre fechas" },
      { href: "/calendario", label: "Calendario INDEC", description: "Próximas publicaciones de datos" },
    ],
  },
  {
    label: "Sobre",
    items: [
      { href: "/metodologia", label: "Metodología", description: "Fuentes y reproducibilidad" },
      { href: "/status", label: "Estado del pipeline", description: "Semáforos del ETL" },
      { href: "/api/v1/openapi.json", label: "API pública", description: "OpenAPI 3.1 spec — 42 series, CORS abierto" },
    ],
  },
];

function NavDropdown({
  group,
  isActive,
}: {
  group: NavGroup;
  isActive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [open]);

  // Estado visual: abierto > activo > default
  const showHighlight = open || isActive;

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="px-3 py-1.5 text-sm rounded-lg transition-colors duration-200 inline-flex items-center gap-1 relative"
        style={{
          color: showHighlight
            ? "var(--color-primary)"
            : "var(--color-text-muted)",
          background: open ? "var(--color-primary-soft)" : "transparent",
          fontWeight: isActive ? 600 : 400,
        }}
        aria-expanded={open}
      >
        {group.label}
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="currentColor"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.15s",
          }}
        >
          <path d="M2 4l4 4 4-4z" />
        </svg>
        {isActive && !open && (
          <span
            className="absolute -bottom-0.5 left-3 right-3 h-0.5 rounded-full"
            style={{ background: "var(--color-primary)" }}
          />
        )}
      </button>

      {open && (
        <div
          className="absolute left-0 top-full pt-2 z-50"
          style={{ minWidth: 280 }}
        >
          <div
            className="rounded-xl border overflow-hidden py-1"
            style={{
              background: "var(--color-card)",
              borderColor: "var(--color-border)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2 transition-colors duration-150"
                style={{ color: "var(--color-text)" }}
                onClick={() => setOpen(false)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--color-primary-soft)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <div className="text-sm font-medium">{item.label}</div>
                {item.description && (
                  <div
                    className="text-xs mt-0.5"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {item.description}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MobileMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-x-0 top-[var(--navbar-h)] bottom-0 z-40 overflow-y-auto"
      style={{
        background: "var(--color-bg)",
        borderTop: "1px solid var(--color-border)",
      }}
    >
      <div className="px-5 py-4 space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: "var(--color-text-muted)" }}
            >
              {group.label}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="block px-3 py-2 rounded-lg"
                  style={{ color: "var(--color-text)" }}
                >
                  <div className="text-sm font-medium">{item.label}</div>
                  {item.description && (
                    <div
                      className="text-xs mt-0.5"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {item.description}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Determina qué grupo está "activo" según el pathname o el #anchor visible. */
function useActiveGroup(): string | null {
  const pathname = usePathname();
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null);

  // Scrollspy: detecta qué sección con id está visible en la home
  useEffect(() => {
    if (pathname !== "/") {
      setActiveAnchor(null);
      return;
    }
    const sectionIds = NAV_GROUPS[0].items
      .filter((i) => i.href.startsWith("/#"))
      .map((i) => i.href.replace("/#", ""));

    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Tomamos la sección que está más arriba pero todavía intersectada
        const intersecting = entries.filter((e) => e.isIntersecting);
        if (intersecting.length > 0) {
          // La de más arriba (menor y top)
          intersecting.sort(
            (a, b) =>
              a.target.getBoundingClientRect().top -
              b.target.getBoundingClientRect().top,
          );
          setActiveAnchor(intersecting[0].target.id);
        }
      },
      {
        rootMargin: "-80px 0px -60% 0px", // dispara cuando la sección entra al tercio superior
        threshold: 0,
      },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [pathname]);

  // Determinar qué grupo contiene el path/anchor actual
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (item.href.startsWith("/#")) {
        if (
          pathname === "/" &&
          activeAnchor &&
          item.href === `/#${activeAnchor}`
        ) {
          return group.label;
        }
      } else if (item.href === pathname) {
        return group.label;
      }
    }
  }
  return null;
}

export function Navbar() {
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeGroup = useActiveGroup();

  return (
    <nav
      className="glass fixed top-0 inset-x-0 z-50 border-b"
      style={{
        height: "var(--navbar-h)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="mx-auto max-w-6xl h-full flex items-center justify-between px-5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
          <span
            className="inline-flex items-center justify-center"
            style={{ color: "var(--mark-color)" }}
          >
            <SiteMark size={20} />
          </span>
          <span
            className="text-lg font-bold tracking-tight"
            style={{ color: "var(--color-text)" }}
          >
            estadísticas
          </span>
          <span
            className="text-lg font-light hidden sm:inline"
            style={{ color: "var(--color-text-muted)" }}
          >
            argentinas
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_GROUPS.map((group) => (
            <NavDropdown
              key={group.label}
              group={group}
              isActive={activeGroup === group.label}
            />
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggle}
            className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors duration-200"
            style={{ color: "var(--color-text-muted)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-primary-soft)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
            aria-label="Cambiar tema"
          >
            {theme === "dark" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg"
            style={{ color: "var(--color-text-muted)" }}
            aria-label="Menú"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </nav>
  );
}
