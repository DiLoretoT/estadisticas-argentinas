"use client";

import { motion } from "framer-motion";

export function Hero() {
  return (
    <section
      className="relative flex flex-col items-center justify-center text-center px-5 overflow-hidden"
      style={{
        paddingTop: "calc(var(--navbar-h) + 4rem)",
        paddingBottom: "5rem",
      }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, var(--color-primary-soft) 0%, transparent 70%)",
        }}
      />

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-xs font-semibold uppercase tracking-[0.25em] mb-4 relative"
        style={{ color: "var(--color-primary)" }}
      >
        Datos abiertos
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight max-w-3xl relative"
        style={{ color: "var(--color-text)" }}
      >
        La economia argentina{" "}
        <span style={{ color: "var(--color-primary)" }}>en tiempo real</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-5 text-base md:text-lg max-w-xl relative"
        style={{ color: "var(--color-text-muted)" }}
      >
        Indicadores macroeconomicos y sociales actualizados con fuentes
        oficiales. Inflacion, tipo de cambio, actividad, empleo y mas.
      </motion.p>

      <motion.a
        href="#indicadores"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35 }}
        className="mt-8 inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative"
        style={{
          background: "var(--color-primary)",
          color: "#fff",
        }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        Ver indicadores
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </motion.a>
    </section>
  );
}
