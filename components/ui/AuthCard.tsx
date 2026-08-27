"use client";
import { motion, useReducedMotion } from "motion/react";
import { reducedTransition } from "@/lib/motion";

// Shared entrance shell for the login/signup pages: soft bronze-tinted card,
// fade+slide on mount. Deliberately static (no pulsing glow) — this screen
// wants the user filling a form, not a lit-up hero moment.
export function AuthCard({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reducedTransition(reduce, 0, 0.55)}
      className="w-full rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-6 py-8 shadow-[0_0_40px_-12px_var(--bronze-glow)] sm:px-8"
    >
      {children}
    </motion.div>
  );
}
