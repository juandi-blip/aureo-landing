// components/ModulesGrid.tsx
"use client";
import { motion } from "motion/react";
import { site } from "@/content/site";
import { ModuleCard } from "@/components/ModuleCard";
import { staggerContainer, fadeUp, VIEWPORT } from "@/lib/motion";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function ModulesGrid() {
  return (
    <section id="producto" className="bg-[var(--bg-subtle)] py-24">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading>
          Todo lo que tu negocio necesita, en un solo sistema.
        </SectionHeading>

        <motion.div
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {site.modulos.map((m) => (
            <motion.div key={m.id} variants={fadeUp}>
              <ModuleCard module={m} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
