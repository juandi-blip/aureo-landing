import { site } from "@/content/site";
import { PricingCard } from "@/components/PricingCard";

export function PricingTable() {
  return (
    <section id="precios" className="py-20">
      <div className="mx-auto max-w-5xl px-5">
        <h2 className="text-center font-display text-3xl font-bold text-[var(--text-primary)]">
          Un plan para cada etapa de tu negocio.
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {site.planes.map((p) => (
            <PricingCard key={p.nombre} plan={p} />
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-[var(--text-muted)]">{site.preciosNota}</p>
      </div>
    </section>
  );
}
