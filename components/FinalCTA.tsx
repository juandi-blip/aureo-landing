// components/FinalCTA.tsx
"use client";
import { motion, useReducedMotion } from "motion/react";
import { site } from "@/content/site";
import { WaitlistForm } from "@/components/WaitlistForm";
import { FloatingParticles } from "@/components/ui/FloatingParticles";
import { fadeUp, VIEWPORT } from "@/lib/motion";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function FinalCTA() {
  const reduce = useReducedMotion();
  return (
    <section className="relative overflow-hidden bg-[var(--bg-navy)] py-32">
      <FloatingParticles count={35} className="z-0" />

      {/* Breathing radial gradient */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(168,116,43,0.08) 0%, transparent 70%)",
        }}
        animate={reduce ? undefined : { scale: [1, 1.1, 1] }}
        transition={reduce ? undefined : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

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
          <WaitlistForm origen="final" />
        </motion.div>
      </div>
    </section>
  );
}
