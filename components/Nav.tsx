"use client";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { site } from "@/content/site";
import { HERO_TIMING, reducedTransition, staggerContainer, fadeUp } from "@/lib/motion";

const LINKS = [
  { href: "#producto", label: "Producto" },
  { href: "#como", label: "Cómo funciona" },
  { href: "#precios", label: "Precios" },
  { href: "#faq", label: "Preguntas" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <motion.header
      className={`sticky top-0 z-50 backdrop-blur-md transition-all duration-300 ${
        scrolled
          ? "border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/90 shadow-sm"
          : "bg-[var(--bg-base)]/85"
      }`}
      initial={{ y: reduce ? 0 : -24, opacity: reduce ? 1 : 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={
        reduce
          ? { duration: 0 }
          : { type: "spring", damping: 26, stiffness: 140, delay: HERO_TIMING.nav }
      }
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
        <motion.a
          href="#"
          aria-label="Aureo — inicio"
          className="flex items-center gap-2 text-[var(--primary)] no-underline"
          initial={{ opacity: 0, x: reduce ? 0 : -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={reducedTransition(reduce, 0.1, 0.45)}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-7 w-7 shrink-0"
            aria-hidden="true"
          >
            <circle cx="12" cy="11" r="5.1" />
            <ellipse cx="12" cy="11" rx="10.6" ry="3.5" transform="rotate(-24 12 11)" />
          </svg>
          <span className="font-display text-2xl font-extrabold">{site.marca}</span>
        </motion.a>

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
          initial={{ opacity: 0, x: reduce ? 0 : 16, scale: reduce ? 1 : 0.92 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={
            reduce
              ? { duration: 0 }
              : { type: "spring", damping: 18, stiffness: 200, delay: 0.35 }
          }
        >
          Unirme
        </motion.a>
      </nav>
    </motion.header>
  );
}
