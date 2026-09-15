// components/FinalCTA.tsx
"use client";
import { motion, useReducedMotion } from "motion/react";
import { site } from "@/content/site";
import { FloatingParticles } from "@/components/ui/FloatingParticles";
import { fadeUp, VIEWPORT } from "@/lib/motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GrainOverlay } from "@/components/ui/GrainOverlay";
import { SpotlightGlow, useSpotlight } from "@/components/ui/Spotlight";

export function FinalCTA() {
  const reduce = useReducedMotion();
  const spotlight = useSpotlight();

  return (
    <section
      className="relative overflow-hidden bg-[var(--bg-navy)] py-32"
      onMouseMove={spotlight.onMouseMove}
      onMouseLeave={spotlight.onMouseLeave}
    >
      <GrainOverlay />
      <SpotlightGlow mouseX={spotlight.mouseX} mouseY={spotlight.mouseY} />
      <div className="pointer-events-none absolute inset-0 z-0">
        <FloatingParticles count={18} className="z-0" />
      </div>

      {/* Breathing radial gradient */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div
          className={`h-full w-full${reduce ? "" : " animate-breathe"}`}
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(168,116,43,0.08) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-5 text-center">
        <SectionHeading light>{site.finalCta.titulo}</SectionHeading>

        <motion.p
          className="mt-4 text-lg text-[var(--bronze)]"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {site.finalCta.texto}
        </motion.p>

        <motion.div
          className="mt-10 flex justify-center"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          <motion.a
            href="/registro"
            className="glow-btn relative inline-block overflow-hidden rounded-[var(--radius-md)] bg-[var(--bronze)] px-8 py-3.5 text-center font-semibold text-white transition-colors hover:bg-[var(--bronze)]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bronze)] focus-visible:ring-offset-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 350, damping: 20 }}
          >
            {site.finalCta.cta}
          </motion.a>
        </motion.div>

        <motion.p
          className="mx-auto mt-6 max-w-md text-sm text-[var(--text-cream)]/60"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {site.finalCta.referido}
        </motion.p>
      </div>
    </section>
  );
}
