"use client";

import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";
import { motion } from "framer-motion";

const navLinks = [
  { href: "/#indicadores", label: "Indicadores" },
  { href: "/#precios", label: "Precios" },
  { href: "/#actividad", label: "Actividad" },
  { href: "/#social", label: "Social" },
];

export function Navbar() {
  const { theme, toggle } = useTheme();

  return (
    <motion.nav
      initial={{ y: -56 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="glass fixed top-0 inset-x-0 z-50 border-b"
      style={{
        height: "var(--navbar-h)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="mx-auto max-w-6xl h-full flex items-center justify-between px-5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span
            className="text-lg font-bold tracking-tight"
            style={{ color: "var(--color-primary)" }}
          >
            estadisticas
          </span>
          <span
            className="text-lg font-light"
            style={{ color: "var(--color-text-muted)" }}
          >
            argentinas
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 text-sm rounded-lg transition-colors duration-200"
              style={{ color: "var(--color-text-muted)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--color-primary)";
                e.currentTarget.style.background = "var(--color-primary-soft)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--color-text-muted)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Theme toggle */}
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
      </div>
    </motion.nav>
  );
}
