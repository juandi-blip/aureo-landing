"use client";
import { motion, useReducedMotion } from "motion/react";
import { DashboardMock } from "@/components/ui/DashboardMock";
import { fadeUp, staggerContainer, reducedTransition } from "@/lib/motion";

const BENEFITS = [
  "14 días gratis, sin tarjeta",
  "Control de inventario en tiempo real",
  "Precio de fundador asegurado desde el día uno",
];

export function AuthSplitPanel() {
  const reduce = useReducedMotion();

  return (
    <div className="relative hidden flex-col justify-center overflow-hidden bg-[var(--bg-navy)] px-10 py-16 lg:flex lg:w-1/2">
      <motion.div
        className="mx-auto w-full max-w-md"
        variants={staggerContainer}
        initial={reduce ? false : "hidden"}
        animate="visible"
      >
        <motion.h2
          variants={fadeUp}
          className="font-display text-2xl font-bold text-[var(--text-cream)]"
        >
          Todo tu inventario, bajo control.
        </motion.h2>
        <motion.ul variants={fadeUp} className="mt-6 space-y-3">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-center gap-2 text-sm text-[var(--text-cream)]/80">
              <svg className="h-4 w-4 flex-shrink-0 text-[var(--emerald)]" viewBox="0 0 16 16" fill="none">
                <path d="M3 8L6.5 11.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {b}
            </li>
          ))}
        </motion.ul>
        <motion.div
          variants={fadeUp}
          initial={reduce ? false : { opacity: 0, y: 12 }}
          transition={reducedTransition(reduce, 0.2, 0.6)}
          className="mt-8"
        >
          <DashboardMock className="w-full" />
        </motion.div>
      </motion.div>
    </div>
  );
}
