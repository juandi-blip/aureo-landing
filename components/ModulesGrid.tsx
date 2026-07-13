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

        <div className="mt-12 flex flex-col gap-12">
          {site.categoriasModulos.map((categoria) => {
            const modulosDeCategoria = site.modulos.filter(
              (m) => m.categoria === categoria.id,
            );
            return (
              <div key={categoria.id}>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  {categoria.titulo}
                </h3>
                <motion.div
                  className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={VIEWPORT}
                >
                  {modulosDeCategoria.map((m) => (
                    <motion.div key={m.id} variants={fadeUp} className="h-full">
                      <ModuleCard module={m} />
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
