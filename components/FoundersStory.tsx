// components/FoundersStory.tsx
"use client";
import { motion, useReducedMotion } from "motion/react";
import { site } from "@/content/site";
import { fadeUp, staggerContainer, VIEWPORT } from "@/lib/motion";
import { SectionHeading } from "@/components/ui/SectionHeading";

const NAME_CHARS = Array.from("Juan & Leif");

export function FoundersStory() {
  const reduce = useReducedMotion();
  return (
    <section className="grain-texture relative overflow-hidden bg-[var(--bg-base)] py-24">
      <div className="relative z-10 mx-auto max-w-3xl px-5 text-center">
        {/* Rotating ring avatars */}
        <div className="mb-10 flex justify-center gap-6">
          {["J", "L"].map((initial) => (
            <div key={initial} className="relative h-16 w-16">
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-[var(--bronze)]"
                animate={reduce ? undefined : { rotate: 360 }}
                transition={reduce ? undefined : { duration: 8, repeat: Infinity, ease: "linear" }}
              />
              <div className="absolute inset-1 flex items-center justify-center rounded-full bg-[var(--bg-subtle)]">
                <span className="font-display text-xl font-bold text-[var(--primary)]">
                  {initial}
                </span>
              </div>
            </div>
          ))}
        </div>

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

        {/* Letter stagger name */}
        <motion.div
          className="mt-8 flex justify-center"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {NAME_CHARS.map((char, i) => (
            <motion.span
              key={i}
              variants={fadeUp}
              className="font-display text-xl font-bold text-[var(--bronze)]"
            >
              {char === " " ? " " : char}
            </motion.span>
          ))}
        </motion.div>

        <motion.p
          className="mt-6 text-sm uppercase tracking-widest text-[var(--text-muted)]"
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
