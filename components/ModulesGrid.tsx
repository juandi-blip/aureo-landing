import { site } from "@/content/site";
import { ModuleCard } from "@/components/ModuleCard";

export function ModulesGrid() {
  return (
    <section id="producto" className="bg-[var(--bg-subtle)] py-20">
      <div className="mx-auto max-w-6xl px-5">
        <h2 className="font-display text-3xl font-bold text-[var(--text-primary)]">
          Todo lo que tu negocio necesita, en un solo sistema.
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {site.modulos.map((m) => (
            <ModuleCard key={m.id} module={m} />
          ))}
        </div>
      </div>
    </section>
  );
}
