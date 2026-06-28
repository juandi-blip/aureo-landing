// components/PricingTable.tsx
"use client";
import { motion } from "motion/react";
import { site } from "@/content/site";
import { PricingCard } from "@/components/PricingCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { fadeUp, VIEWPORT } from "@/lib/motion";

export function PricingTable() {
  return (
    <section id="precios" className="overflow-hidden py-24">
      <div className="mx-auto max-w-5xl px-5">
        <SectionHeading className="text-center">
          Un plan para cada etapa de tu negocio.
        </SectionHeading>

        <div className="mt-12 grid gap-6 md:grid-cols-2 md:items-start">
          {site.planes.map((p, i) => (
            <PricingCard key={p.nombre} plan={p} />
          ))}
        </div>

        <motion.p
          className="mt-6 text-center text-sm text-[var(--text-secondary)]"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {site.preciosNota}
        </motion.p>
      </div>
    </section>
  );
}
