// components/SecuritySection.tsx
"use client";
import { motion } from "motion/react";
import {
  CreditCard,
  Landmark,
  Smartphone,
  Globe,
  ShieldCheck,
  Lock,
  Database,
  Radar,
} from "lucide-react";
import { site } from "@/content/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { staggerContainer, fadeUp, VIEWPORT } from "@/lib/motion";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "credit-card": CreditCard,
  landmark: Landmark,
  smartphone: Smartphone,
  globe: Globe,
  "shield-check": ShieldCheck,
  lock: Lock,
  database: Database,
  radar: Radar,
};

export function SecuritySection() {
  const s = site.seguridad;

  return (
    <section id="seguridad" className="relative overflow-hidden bg-[var(--bg-navy)] py-24">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading light className="text-center">
          {s.titulo}
        </SectionHeading>

        <motion.p
          className="mx-auto mt-4 max-w-2xl text-center text-[var(--text-cream)]/70"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {s.intro}
        </motion.p>

        <motion.div
          className="mt-14 grid gap-6 sm:grid-cols-2"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {s.garantias.map((g) => {
            const Icon = ICON_MAP[g.icono] ?? ShieldCheck;
            return (
              <motion.div
                key={g.titulo}
                variants={fadeUp}
                className="rounded-[var(--radius-lg)] border border-white/10 bg-white/5 p-6"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--bronze)]/15">
                  <Icon aria-hidden className="h-5 w-5 text-[var(--bronze)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--text-cream)]">
                  {g.titulo}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-cream)]/70">
                  {g.texto}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.h3
          className="mt-16 text-center text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-cream)]/60"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {s.metodosTitulo}
        </motion.h3>

        <motion.ul
          className="mt-6 flex flex-wrap items-stretch justify-center gap-3"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {s.metodos.map((m) => {
            const Icon = ICON_MAP[m.icono] ?? CreditCard;
            return (
              <motion.li
                key={m.id}
                variants={fadeUp}
                className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-3"
              >
                <Icon aria-hidden className="h-4 w-4 flex-shrink-0 text-[var(--bronze)]" />
                <span className="text-sm font-medium text-[var(--text-cream)]">
                  {m.nombre}
                  <span className="ml-2 hidden text-[var(--text-cream)]/50 sm:inline">
                    {m.detalle}
                  </span>
                </span>
              </motion.li>
            );
          })}
        </motion.ul>

        <motion.div
          className="mt-12 text-center"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          <p className="mx-auto max-w-xl text-sm text-[var(--text-cream)]/60">{s.nota}</p>
          <motion.a
            href="#waitlist"
            className="glow-btn mt-6 inline-block rounded-[var(--radius-md)] bg-[var(--bronze)] px-8 py-3 font-semibold text-white transition-colors hover:bg-[var(--bronze)]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bronze)] focus-visible:ring-offset-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 350, damping: 20 }}
          >
            {s.cta}
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
