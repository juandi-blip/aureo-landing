// components/HowItWorks.tsx
"use client";
import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { site } from "@/content/site";
import { fadeUp, staggerContainer, VIEWPORT } from "@/lib/motion";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function HowItWorks() {
  const lineRef = useRef<HTMLDivElement>(null);
  const lineVisible = useInView(lineRef, VIEWPORT);

  return (
    <section id="como" className="py-24">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading className="text-center">
          {site.comoFunciona.titulo}
        </SectionHeading>

        {/* Desktop: grid with animated connecting line */}
        <div ref={lineRef} className="relative mt-16 hidden md:block">
          <motion.div
            className="absolute top-10 h-px bg-[var(--primary-soft)]/30 origin-left"
            style={{ left: "calc(16.67% + 2rem)", right: "calc(16.67% + 2rem)" }}
            initial={{ scaleX: 0 }}
            animate={lineVisible ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          />

          <motion.div
            className="grid gap-8 md:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
          >
            {site.comoFunciona.pasos.map((p, i) => (
              <motion.div
                key={p.titulo}
                variants={fadeUp}
                className="group relative text-center"
              >
                <motion.span
                  className="font-display font-extrabold leading-none text-[var(--primary-soft)] select-none"
                  style={{ fontSize: "8rem", opacity: 0.12 }}
                  whileHover={{ opacity: 0.38 }}
                  transition={{ duration: 0.3 }}
                >
                  {i + 1}
                </motion.span>
                <h3 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                  {p.titulo}
                </h3>
                <p className="mt-2 text-[var(--text-secondary)]">{p.texto}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Mobile: no line */}
        <motion.div
          className="mt-10 grid gap-8 md:hidden"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {site.comoFunciona.pasos.map((p, i) => (
            <motion.div key={p.titulo} variants={fadeUp}>
              <span
                className="font-display text-4xl font-extrabold text-[var(--primary-soft)]"
                style={{ opacity: 0.4 }}
              >
                {i + 1}
              </span>
              <h3 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                {p.titulo}
              </h3>
              <p className="mt-2 text-[var(--text-secondary)]">{p.texto}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
