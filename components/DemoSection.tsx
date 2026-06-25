import { site } from "@/content/site";

export function DemoSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-5 text-center">
        <h2 className="font-display text-3xl font-bold text-[var(--text-primary)]">{site.demo.titulo}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-[var(--text-secondary)]">{site.demo.texto}</p>
        <div className="mx-auto mt-10 flex aspect-video max-w-4xl items-center justify-center rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-muted)]">
          {site.demo.placeholder}
        </div>
      </div>
    </section>
  );
}
