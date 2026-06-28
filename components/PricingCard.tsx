// components/PricingCard.tsx
"use client";
import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import type { Plan } from "@/content/site";
import { VIEWPORT } from "@/lib/motion";

export function PricingCard({ plan, index = 0 }: { plan: Plan; index?: number }) {
  const hl = plan.destacado;
  const ref = useRef<HTMLDivElement>(null);
  const rX = useSpring(useMotionValue(0), { stiffness: 180, damping: 28 });
  const rY = useSpring(useMotionValue(0), { stiffness: 180, damping: 28 });

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    rX.set(-((e.clientY - rect.top) / rect.height - 0.5) * 6);
    rY.set(((e.clientX - rect.left) / rect.width - 0.5) * 6);
  }
  function onMouseLeave() { rX.set(0); rY.set(0); }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ rotateX: rX, rotateY: rY, transformPerspective: 900 }}
      className={`relative overflow-hidden rounded-[var(--radius-lg)] border p-8 ${
        hl
          ? "border-[var(--bronze)]/40 bg-[var(--bg-navy)] shadow-xl"
          : "border-[var(--border-subtle)] bg-[var(--bg-surface)]"
      }`}
      initial={{
        opacity: 0,
        x: hl ? 0 : index === 0 ? -60 : 60,
        y: hl ? -40 : 0,
      }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={VIEWPORT}
      animate={hl ? {
        boxShadow: [
          "0 0 18px rgba(168,116,43,0.12), 0 20px 40px rgba(0,0,0,0.25)",
          "0 0 38px rgba(168,116,43,0.28), 0 20px 40px rgba(0,0,0,0.25)",
          "0 0 18px rgba(168,116,43,0.12), 0 20px 40px rgba(0,0,0,0.25)",
        ],
      } : {}}
      transition={hl ? {
        boxShadow: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
        opacity: { type: "spring", damping: 25, stiffness: 100, delay: 0.15 },
        x: { type: "spring", damping: 25, stiffness: 100, delay: 0.15 },
        y: { type: "spring", damping: 25, stiffness: 100, delay: 0.15 },
      } : {
        type: "spring", damping: 25, stiffness: 100,
      }}
    >
      {hl && (
        <motion.span
          className="shimmer-btn relative mb-3 inline-block overflow-hidden rounded-full bg-[var(--bronze)] px-3 py-1 text-xs font-semibold text-white"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={VIEWPORT}
          transition={{ delay: 0.35 }}
        >
          Más popular
        </motion.span>
      )}

      <h3
        className={`font-display text-2xl font-bold ${
          hl ? "text-[var(--text-cream)]" : "text-[var(--text-primary)]"
        }`}
      >
        {plan.nombre}
      </h3>
      <p
        className={`mt-1 text-sm ${
          hl ? "text-[var(--text-cream)]/70" : "text-[var(--text-secondary)]"
        }`}
      >
        {plan.resumen}
      </p>
      <p className="mt-4">
        <span
          className={`font-display text-3xl font-extrabold ${
            hl ? "text-[var(--bronze)]" : "text-[var(--primary)]"
          }`}
        >
          {plan.precio}
        </span>
        <span
          className={
            hl ? "text-[var(--text-cream)]/60" : "text-[var(--text-secondary)]"
          }
        >
          {plan.periodo}
        </span>
      </p>

      <ul className="mt-6 space-y-3 text-sm">
        {plan.features.map((f, i) => (
          <motion.li
            key={f}
            className={`flex items-center gap-2 ${
              hl ? "text-[var(--text-cream)]/80" : "text-[var(--text-secondary)]"
            }`}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={VIEWPORT}
            transition={{ delay: 0.15 + i * 0.06 }}
          >
            <svg
              className="h-4 w-4 flex-shrink-0 text-[var(--emerald)]"
              viewBox="0 0 16 16"
              fill="none"
            >
              <motion.path
                d="M3 8L6.5 11.5L13 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={VIEWPORT}
                transition={{ delay: 0.3 + i * 0.06, duration: 0.3 }}
              />
            </svg>
            {f}
          </motion.li>
        ))}
      </ul>

      <motion.a
        href="#waitlist"
        className={`relative mt-8 block overflow-hidden rounded-[var(--radius-md)] py-3 text-center font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
          hl
            ? "glow-btn bg-[var(--bronze)] text-white hover:bg-[var(--bronze)]/90 focus-visible:ring-[var(--bronze)]"
            : "bg-[var(--primary)] text-white hover:bg-[var(--primary-strong)] focus-visible:ring-[var(--primary)]"
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 350, damping: 20 }}
      >
        {hl && (
          <motion.span
            className="pointer-events-none absolute inset-0"
            initial={{ x: "-100%" }}
            whileHover={{ x: "200%" }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            style={{ background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.2) 50%, transparent 65%)" }}
            aria-hidden
          />
        )}
        {plan.cta}
      </motion.a>
    </motion.div>
  );
}
