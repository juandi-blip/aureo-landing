// components/ProblemSection.tsx
"use client";
import { motion } from "motion/react";
import { site } from "@/content/site";
import { AlertTriangle, Search, Clock, Database } from "lucide-react";
import { fadeUp, staggerContainer, clipReveal, VIEWPORT } from "@/lib/motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GrainOverlay } from "@/components/ui/GrainOverlay";
import { SpotlightGlow, useSpotlight } from "@/components/ui/Spotlight";

const ICONS = [Search, AlertTriangle, Clock, Database];

export function ProblemSection() {
  const spotlight = useSpotlight();

  return (
    <section
      className="relative overflow-hidden bg-[var(--bg-navy)] py-24"
      onMouseMove={spotlight.onMouseMove}
      onMouseLeave={spotlight.onMouseLeave}
    >
      <GrainOverlay />
      <SpotlightGlow mouseX={spotlight.mouseX} mouseY={spotlight.mouseY} />
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden style={{ background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(168,116,43,0.06) 0%, transparent 70%)" }} />

      <div className="relative z-10 mx-auto max-w-6xl px-5">
        <motion.span
          className="mb-3 inline-block text-sm font-semibold uppercase tracking-widest text-[var(--bronze)]"
          variants={clipReveal}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          El problema
        </motion.span>

        <SectionHeading light className="max-w-2xl">
          {site.problema.titulo}
        </SectionHeading>

        <motion.p
          className="mt-4 max-w-2xl text-[var(--text-cream)]/70"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {site.problema.intro}
        </motion.p>

        <motion.div
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {site.problema.items.map((it, i) => {
            const Icon = ICONS[i];
            return (
              <motion.div
                key={it.titulo}
                variants={fadeUp}
                whileHover={{ scale: 1.03, borderColor: "var(--terracotta)" }}
                className="cursor-default rounded-[var(--radius-md)] border border-[var(--text-cream)]/10 bg-[var(--text-cream)]/5 p-6 transition-colors"
              >
                <motion.div
                  whileHover={{ rotate: -10 }}
                  transition={{ duration: 0.3 }}
                  className="mb-3 w-fit"
                >
                  <Icon className="h-6 w-6 text-[var(--terracotta)]" />
                </motion.div>
                <h3 className="font-semibold text-[var(--text-cream)]">
                  {it.titulo}
                </h3>
                <p className="mt-2 text-sm text-[var(--text-cream)]/60">
                  {it.texto}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
