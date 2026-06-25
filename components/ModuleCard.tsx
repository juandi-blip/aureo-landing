import type { Module } from "@/content/site";

export function ModuleCard({ module }: { module: Module }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 transition hover:shadow-md">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary)]/10 text-[var(--primary)]" aria-hidden>
        {/* icono simple por ahora; reemplazable por lucide en pulido */}
        <span className="font-display text-lg font-bold">{module.titulo.charAt(0)}</span>
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">{module.titulo}</h3>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">{module.beneficio}</p>
    </div>
  );
}
