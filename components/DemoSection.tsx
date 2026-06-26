"use client";
import { motion } from "motion/react";
import { site } from "@/content/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { fadeUp, VIEWPORT } from "@/lib/motion";

export function DemoSection() {
  return (
    <section className="bg-[var(--bg-navy)] py-24">
      <div className="mx-auto max-w-6xl px-5 text-center">
        <SectionHeading light>{site.demo.titulo}</SectionHeading>

        <motion.p
          className="mx-auto mt-4 max-w-2xl text-[var(--text-cream)]/70"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {site.demo.texto}
        </motion.p>

        <motion.div
          className="mt-3 inline-flex items-center gap-2"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          <motion.span
            className="h-2 w-2 rounded-full bg-[var(--bronze)]"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-sm font-semibold text-[var(--bronze)]">
            Demo interactiva — próximamente
          </span>
        </motion.div>

        <motion.div
          className="shimmer-border mx-auto mt-10 flex aspect-video max-w-4xl items-center justify-center rounded-[var(--radius-lg)] bg-[var(--bg-navy)]"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          <span className="shimmer-text font-display text-xl font-bold">
            {site.demo.placeholder}
          </span>
        </motion.div>
      </div>
    </section>
  );
}
