import { site } from "@/content/site";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function FAQ() {
  return (
    <section id="faq" className="bg-[var(--bg-subtle)] py-20">
      <div className="mx-auto max-w-3xl px-5">
        <h2 className="text-center font-display text-3xl font-bold text-[var(--text-primary)]">Preguntas frecuentes</h2>
        <Accordion className="mt-8">
          {site.faq.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-[var(--text-primary)]">{item.pregunta}</AccordionTrigger>
              <AccordionContent className="text-[var(--text-secondary)]">{item.respuesta}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
