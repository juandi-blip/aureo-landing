// components/FAQ.tsx
"use client";
import { motion } from "motion/react";
import { site } from "@/content/site";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { staggerContainer, fadeUp, VIEWPORT } from "@/lib/motion";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function FAQ() {
  return (
    <section id="faq" className="bg-[var(--bg-subtle)] py-24">
      <div className="mx-auto max-w-3xl px-5">
        <SectionHeading className="text-center">
          Preguntas frecuentes
        </SectionHeading>

        <motion.div
          className="mt-10"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          <Accordion>
            {site.faq.map((item, i) => (
              <motion.div key={i} variants={fadeUp}>
                <AccordionItem value={`item-${i}`}>
                  <AccordionTrigger className="text-left text-[var(--text-primary)] transition-all hover:translate-x-1.5">
                    {item.pregunta}
                  </AccordionTrigger>
                  <AccordionContent className="text-[var(--text-secondary)]">
                    {item.respuesta}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
