"use client";

import { motion } from "framer-motion";

interface SectionHeaderProps {
  id?: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
}

export function SectionHeader({
  id,
  eyebrow,
  title,
  subtitle,
}: SectionHeaderProps) {
  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6 }}
      className="mb-8 scroll-mt-20"
    >
      {eyebrow && (
        <p
          className="text-xs font-semibold uppercase tracking-[0.2em] mb-2"
          style={{ color: "var(--color-primary)" }}
        >
          {eyebrow}
        </p>
      )}
      <h2
        className="text-2xl md:text-3xl font-bold"
        style={{ color: "var(--color-text)" }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className="mt-2 text-sm max-w-xl"
          style={{ color: "var(--color-text-muted)" }}
        >
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
