import type { Plan } from "@/content/site";

export function PricingCard({ plan }: { plan: Plan }) {
  return (
    <div className={`rounded-[var(--radius-lg)] border p-8 ${plan.destacado ? "border-[var(--primary)] bg-[var(--bg-surface)] shadow-md" : "border-[var(--border-subtle)] bg-[var(--bg-surface)]"}`}>
      {plan.destacado && (
        <span className="mb-3 inline-block rounded-full bg-[var(--primary)] px-3 py-1 text-xs font-semibold text-white">Recomendado</span>
      )}
      <h3 className="font-display text-2xl font-bold text-[var(--text-primary)]">{plan.nombre}</h3>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">{plan.resumen}</p>
      <p className="mt-4">
        <span className="font-display text-3xl font-extrabold text-[var(--primary)]">{plan.precio}</span>
        <span className="text-[var(--text-secondary)]">{plan.periodo}</span>
      </p>
      <ul className="mt-6 space-y-2 text-sm text-[var(--text-secondary)]">
        {plan.features.map((f) => (
          <li key={f} className="flex gap-2">
            <span className="text-[var(--emerald)]" aria-hidden>✓</span>{f}
          </li>
        ))}
      </ul>
      <a href="#waitlist" className="mt-8 block rounded-[var(--radius-md)] bg-[var(--primary)] py-3 text-center font-semibold text-white hover:bg-[var(--primary-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2">
        {plan.cta}
      </a>
    </div>
  );
}
