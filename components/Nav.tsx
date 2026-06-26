"use client";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { site } from "@/content/site";
import { staggerContainer, fadeUp } from "@/lib/motion";

const LINKS = [
  { href: "#producto", label: "Producto" },
  { href: "#como", label: "Cómo funciona" },
  { href: "#precios", label: "Precios" },
  { href: "#faq", label: "Preguntas" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-md transition-all duration-300 ${
        scrolled
          ? "border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/90 shadow-sm"
          : "bg-[var(--bg-base)]/85"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <motion.span
          className="font-display text-2xl font-extrabold text-[var(--primary)]"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          {site.marca}
        </motion.span>

        <motion.div
          className="hidden gap-7 text-sm font-semibold text-[var(--text-secondary)] md:flex"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {LINKS.map((link) => (
            <motion.a
              key={link.href}
              href={link.href}
              variants={fadeUp}
              className="rounded transition-colors hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            >
              {link.label}
            </motion.a>
          ))}
        </motion.div>

        <motion.a
          href="#waitlist"
          className="shimmer-btn relative overflow-hidden rounded-[var(--radius-md)] bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          Unirme
        </motion.a>
      </nav>
    </header>
  );
}
