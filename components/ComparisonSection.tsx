// components/ComparisonSection.tsx
"use client";
import { motion } from "motion/react";
import { Check, X, Minus } from "lucide-react";
import { site, type ComparativaValor } from "@/content/site";
import { fadeUp, clipReveal, VIEWPORT } from "@/lib/motion";
import { SectionHeading } from "@/components/ui/SectionHeading";

const ICONO: Record<ComparativaValor, { Icon: typeof Check; className: string; texto: string }> = {
  si: { Icon: Check, className: "text-[var(--emerald)]", texto: "Sí" },
  no: { Icon: X, className: "text-[var(--terracotta)]", texto: "No" },
  parcial: { Icon: Minus, className: "text-[var(--text-muted)]", texto: "Parcial" },
};

export function ComparisonSection() {
  return (
    <section className="bg-[var(--bg-base)] py-24">
      <div className="mx-auto max-w-5xl px-5">
        <motion.span
          className="mb-3 inline-block text-sm font-semibold uppercase tracking-widest text-[var(--bronze)]"
          variants={clipReveal}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          La comparación
        </motion.span>

        <SectionHeading className="max-w-2xl">{site.comparativa.titulo}</SectionHeading>

        <motion.div
          className="mt-10 overflow-x-auto"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          <div className="grid min-w-[640px] grid-cols-[1.6fr_1fr_1fr_1fr] gap-y-1">
            <div />
            {site.comparativa.columnas.map((col, i) => (
              <div
                key={col}
                className={`rounded-t-[var(--radius-md)] px-4 py-3 text-center text-sm font-semibold ${
                  i === 2 ? "bg-[var(--bronze)]/10 text-[var(--bronze)]" : "text-[var(--text-secondary)]"
                }`}
              >
                {col}
              </div>
            ))}

            {site.comparativa.filas.map((fila) => (
              <div key={fila.criterio} className="contents">
                <div className="flex items-center border-t border-[var(--border-subtle)] px-4 py-3 text-sm text-[var(--text-primary)]">
                  {fila.criterio}
                </div>
                {fila.valores.map((valor, i) => {
                  const { Icon, className, texto } = ICONO[valor];
                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-center border-t border-[var(--border-subtle)] px-4 py-3 ${
                        i === 2 ? "bg-[var(--bronze)]/10" : ""
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${className}`} aria-hidden />
                      <span className="sr-only">{texto}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
