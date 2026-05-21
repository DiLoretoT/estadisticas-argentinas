"use client";

import { motion } from "framer-motion";

interface HeroProps {
  lastUpdated?: string;
}

export function Hero({ lastUpdated }: HeroProps) {
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
        Datos oficiales · INDEC · BCRA
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight max-w-3xl relative"
        style={{ color: "var(--color-text)" }}
      >
        La economía argentina,{" "}
        <span style={{ color: "var(--color-primary)" }}>en datos</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-5 text-base md:text-lg max-w-xl relative"
        style={{ color: "var(--color-text-muted)" }}
      >
        Indicadores macroeconómicos y sociales con fuentes oficiales,
        actualizados automáticamente. Inflación, dólar, actividad, empleo y más.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35 }}
        className="mt-8 flex flex-wrap items-center justify-center gap-3 relative"
      >
        <a
          href="#indicadores"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
          style={{
            background: "var(--color-primary)",
            color: "#fff",
          }}
        >
          Explorar indicadores
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </a>
        <a
          href="https://github.com/DiLoretoT/estadisticas-argentinas"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border"
          style={{
            borderColor: "var(--color-border)",
            color: "var(--color-text)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          Ver en GitHub
        </a>
      </motion.div>

      {lastUpdated && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-6 text-xs relative tabular-nums"
          style={{ color: "var(--color-text-muted)" }}
        >
          Última actualización: {lastUpdated}
        </motion.p>
      )}
    </section>
  );
}
