// components/MelyorSection.tsx
"use client";
import { motion } from "motion/react";
import { ShoppingBag, Bell, Users, FileText, MessageCircle, Zap } from "lucide-react";
import { site } from "@/content/site";
import { staggerContainer, fadeUp, VIEWPORT } from "@/lib/motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GrainOverlay } from "@/components/ui/GrainOverlay";
import { SpotlightGlow, useSpotlight } from "@/components/ui/Spotlight";

const CAPABILITY_ICONS = [ShoppingBag, Bell, Users, FileText, MessageCircle, Zap];

function MelyorBadge() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7"
      aria-hidden
    >
      <path d="M12 2 L20 7 L20 17 L12 22 L4 17 L4 7 Z" />
      <path d="M7.5 15.5 L7.5 8.5 L12 13 L16.5 8.5 L16.5 15.5" />
    </svg>
  );
}

export function MelyorSection() {
  const spotlight = useSpotlight();

  return (
    <section
      className="relative overflow-hidden bg-[var(--bg-navy)] py-24 border-t border-white/10"
      onMouseMove={spotlight.onMouseMove}
      onMouseLeave={spotlight.onMouseLeave}
    >
      <GrainOverlay />
      <SpotlightGlow mouseX={spotlight.mouseX} mouseY={spotlight.mouseY} />
      <div className="relative z-10 mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <motion.span
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--bronze)]/40 bg-[var(--bronze)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--bronze)]"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--emerald)]" aria-hidden />
            {site.melyor.eyebrow}
          </motion.span>

          <motion.div
            className="mx-auto mt-5 flex h-14 w-14 items-center justify-center rounded-[var(--radius-md)] bg-[var(--bronze)]/15 text-[var(--bronze)]"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
          >
            <MelyorBadge />
          </motion.div>

          <motion.div
            className="mt-5 flex items-center justify-center gap-2"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
          >
            <span className="font-display text-2xl font-bold text-[var(--text-cream)]">
              {site.melyor.nombre}
            </span>
            <span className="rounded-md border border-[var(--bronze)]/40 bg-[var(--bronze)]/15 px-2 py-0.5 font-mono text-sm font-semibold text-[var(--bronze)]">
              {site.melyor.version}
            </span>
          </motion.div>

          <div className="mt-3">
            <SectionHeading light>{site.melyor.titulo}</SectionHeading>
          </div>

          <motion.p
            className="mx-auto mt-4 text-[var(--text-cream)]/70"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
          >
            {site.melyor.texto}
          </motion.p>
        </div>

        <motion.div
          className="mt-14 grid gap-5 sm:grid-cols-2"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {site.melyor.capacidades.map((cap, i) => {
            const Icon = CAPABILITY_ICONS[i] ?? MessageCircle;
            return (
              <motion.div
                key={cap.titulo}
                variants={fadeUp}
                className="flex gap-4 rounded-[var(--radius-lg)] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--bronze)]/15">
                  <Icon aria-hidden className="h-5 w-5 text-[var(--bronze)]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--text-cream)]">{cap.titulo}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--text-cream)]/65">
                    {cap.texto}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.p
          className="mt-10 text-center text-sm text-[var(--text-cream)]/50"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {site.melyor.nota}
        </motion.p>
      </div>
    </section>
  );
}
