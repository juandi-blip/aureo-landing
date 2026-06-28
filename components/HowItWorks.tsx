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

        <div ref={lineRef} className="relative mt-16 hidden md:block">
          {/* Línea conectora */}
          <motion.div
            className="pointer-events-none absolute top-5 left-[16.67%] right-[16.67%] z-0 h-px origin-left bg-[var(--primary-soft)]/35"
            initial={{ scaleX: 0 }}
            animate={lineVisible ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          />

          {/* Punto viajero */}
          <motion.div
            className="pointer-events-none absolute top-[1.1rem] z-10 h-3 w-3 -translate-x-1/2 rounded-full bg-[var(--primary)] shadow-[0_0_10px_var(--primary)]"
            initial={{ left: "16.67%", opacity: 0 }}
            animate={lineVisible
              ? { left: ["16.67%", "83.33%"], opacity: [0, 1, 1, 0] }
              : { left: "16.67%", opacity: 0 }}
            transition={{ duration: 1.4, delay: 1.1, ease: [0.4, 0, 0.2, 1], times: [0, 0.05, 0.95, 1] }}
          />

          <motion.div
            className="grid grid-cols-3 gap-x-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
          >
            {site.comoFunciona.pasos.map((p, i) => (
              <motion.div
                key={p.titulo}
                variants={fadeUp}
                className="grid text-center"
                style={{ gridTemplateRows: "2.5rem 7rem auto auto" }}
              >
                {/* Fila 1: badge + pulse ring */}
                <motion.div
                  className="flex items-center justify-center"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={lineVisible ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                  transition={{ duration: 0.4, delay: 0.45 + i * 0.12 }}
                >
                  <div className="relative z-20 flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--primary)]/25 bg-[var(--bg-base)] font-display text-sm font-bold text-[var(--primary)] shadow-sm">
                    {i + 1}
                    {/* Pulse ring */}
                    <motion.span
                      className="pointer-events-none absolute inset-0 rounded-full border border-[var(--primary)]/50"
                      initial={{ scale: 1, opacity: 0.7 }}
                      animate={lineVisible ? { scale: 2.4, opacity: 0 } : { scale: 1, opacity: 0 }}
                      transition={{ duration: 0.9, delay: 0.65 + i * 0.18, ease: "easeOut" }}
                      aria-hidden
                    />
                  </div>
                </motion.div>

                {/* Fila 2: número grande — caja fija 7rem, centrado */}
                <div className="flex items-center justify-center">
                  <span
                    className="inline-flex h-[7rem] w-[5.5rem] items-center justify-center font-display text-[7rem] font-extrabold leading-none tabular-nums text-[var(--primary-soft)] select-none xl:w-[6rem] xl:text-[8rem]"
                    style={{ opacity: 0.12 }}
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                </div>

                {/* Fila 3: título */}
                <h3 className="-mt-6 text-lg font-semibold text-[var(--text-primary)]">
                  {p.titulo}
                </h3>

                {/* Fila 4: descripción */}
                <p className="mt-2 text-[var(--text-secondary)]">{p.texto}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Mobile */}
        <motion.div
          className="mt-10 grid gap-8 md:hidden"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {site.comoFunciona.pasos.map((p, i) => (
            <motion.div key={p.titulo} variants={fadeUp} className="text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--primary)]/25 bg-[var(--bg-surface)] font-display text-sm font-bold text-[var(--primary)]">
                {i + 1}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">
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
