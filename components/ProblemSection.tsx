import { site } from "@/content/site";

export function ProblemSection() {
  return (
    <section className="bg-[var(--bg-subtle)] py-20">
      <div className="mx-auto max-w-6xl px-5">
        <h2 className="font-display text-3xl font-bold text-[var(--text-primary)]">{site.problema.titulo}</h2>
        <p className="mt-3 max-w-2xl text-[var(--text-secondary)]">{site.problema.intro}</p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {site.problema.items.map((it) => (
            <div key={it.titulo} className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
              <h3 className="font-semibold text-[var(--terracotta)]">{it.titulo}</h3>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{it.texto}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
