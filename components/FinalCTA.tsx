import { site } from "@/content/site";
import { WaitlistForm } from "@/components/WaitlistForm";

export function FinalCTA() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-5 text-center">
        <h2 className="font-display text-3xl font-bold text-[var(--text-primary)]">{site.finalCta.titulo}</h2>
        <p className="mt-3 text-[var(--text-secondary)]">{site.finalCta.texto}</p>
        <div className="mt-8 flex justify-center">
          <WaitlistForm origen="final" />
        </div>
      </div>
    </section>
  );
}
