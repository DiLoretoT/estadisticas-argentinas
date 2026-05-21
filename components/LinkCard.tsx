"use client";

import Link from "next/link";

interface LinkCardProps {
  href: string;
  icon: string;
  title: string;
  description: string;
  delay?: number;
}

export function LinkCard({ href, icon, title, description }: LinkCardProps) {
  return (
    <Link
      href={href}
      className="block rounded-xl border p-5 transition-all duration-200 group hover:-translate-y-0.5 hover:shadow-md"
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
  );
}
