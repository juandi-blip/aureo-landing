// components/Footer.tsx
"use client";
import { motion } from "motion/react";
import { site } from "@/content/site";
import { fadeUp, VIEWPORT } from "@/lib/motion";

const NAV_LINKS = [
  { label: "Producto", href: "#producto" },
  { label: "Cómo funciona", href: "#como" },
  { label: "Precios", href: "#precios" },
  { label: "Preguntas", href: "#faq" },
];

export function Footer() {
  return (
    <motion.footer
      className="border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)] py-12"
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 text-center">
        <span className="font-display text-xl font-extrabold text-[var(--primary)]">
          {site.marca}
        </span>
        <p className="text-sm text-[var(--text-secondary)]">{site.footer.tagline}</p>
        <nav className="flex flex-wrap justify-center gap-6 text-sm text-[var(--text-muted)]">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="link-underline transition-colors hover:text-[var(--primary)]"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <p className="text-xs text-[var(--text-muted)]">{site.footer.derechos}</p>
      </div>
    </motion.footer>
  );
}
