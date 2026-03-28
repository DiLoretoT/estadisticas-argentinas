"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface LinkCardProps {
  href: string;
  icon: string;
  title: string;
  description: string;
  delay?: number;
}

export function LinkCard({ href, icon, title, description, delay = 0 }: LinkCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -3, boxShadow: "var(--shadow-md)" }}
    >
      <Link
        href={href}
        className="block rounded-xl border p-5 transition-colors duration-200 group"
        style={{
          background: "var(--color-card)",
          borderColor: "var(--color-border)",
          boxShadow: "var(--shadow-sm)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--color-primary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--color-border)";
        }}
      >
        <span className="text-2xl block mb-3">{icon}</span>
        <h3
          className="text-sm font-semibold mb-1 transition-colors duration-200 group-hover:text-[var(--color-primary)]"
          style={{ color: "var(--color-text)" }}
        >
          {title}
        </h3>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {description}
        </p>
      </Link>
    </motion.div>
  );
}
