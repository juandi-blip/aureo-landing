// components/FoundersStory.tsx
"use client";
import { motion } from "motion/react";
import { site } from "@/content/site";
import { fadeUp, VIEWPORT } from "@/lib/motion";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function FoundersStory() {
  return (
    <section className="grain-texture relative overflow-hidden bg-[var(--bg-base)] py-24">
      <div className="relative z-10 mx-auto max-w-3xl px-5 text-center">
        <SectionHeading>{site.fundadores.titulo}</SectionHeading>

        <motion.p
          className="mt-5 text-lg leading-relaxed text-[var(--text-secondary)]"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {site.fundadores.texto}
        </motion.p>

        <motion.p
          className="mt-5 text-sm font-semibold text-[var(--text-primary)]"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {site.fundadores.nombres}
        </motion.p>

        <motion.p
          className="mt-6 text-xs uppercase tracking-widest text-[var(--text-muted)]"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {site.fundadores.socialProofPlaceholder}
        </motion.p>
      </div>
    </section>
  );
}
