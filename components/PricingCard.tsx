// components/PricingCard.tsx
"use client";
import { motion } from "motion/react";
import type { Plan, Moneda, Periodo } from "@/content/site";

function formatPrecio(valor: number, moneda: Moneda) {
  return moneda === "cop"
    ? `$${valor.toLocaleString("es-CO")}`
    : `$${valor}`;
}

export function PricingCard({
  plan,
  moneda,
  periodo,
}: {
  plan: Plan;
  moneda: Moneda;
  periodo: Periodo;
}) {
  const hl = plan.destacado;
  const precio = formatPrecio(plan.precios[moneda][periodo], moneda);
  const precioRegular = formatPrecio(plan.precioRegular[moneda][periodo], moneda);

  return (
    <div className="group relative">
      {/* Gold border animation — follows exact card shape */}
      <div className={`gold-card-border pointer-events-none absolute inset-0 rounded-[var(--radius-lg)]${hl ? "" : " gold-card-border-dim"}`} aria-hidden />
      <div
        className={`relative z-[1] overflow-hidden rounded-[var(--radius-lg)] p-8 transition-shadow duration-300 ${
          hl
            ? "bg-[var(--bg-navy)] shadow-xl"
            : "bg-[var(--bg-surface)]"
        }`}
      >
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {hl && (
            <span className="shimmer-btn relative inline-block overflow-hidden rounded-full bg-[var(--bronze)] px-3 py-1 text-xs font-semibold text-white">
              Más popular
            </span>
          )}
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
              hl ? "bg-[var(--emerald)]/25 text-[var(--text-cream)]" : "bg-[var(--emerald)]/15 text-[var(--emerald)]"
            }`}
          >
            Precio fundador
          </span>
        </div>

        <h3
          className={`font-display text-2xl font-bold ${
            hl ? "text-[var(--text-cream)]" : "text-[var(--text-primary)]"
          }`}
        >
          {plan.nombre}
        </h3>
        <p
          className={`mt-1 text-sm ${
            hl ? "text-[var(--text-cream)]/70" : "text-[var(--text-secondary)]"
          }`}
        >
          {plan.resumen}
        </p>
        <p className="mt-4 flex flex-wrap items-baseline gap-2">
          <span className="sr-only">Precio regular: </span>
          <del
            className={`text-sm line-through ${
              hl ? "text-[var(--text-cream)]/40" : "text-[var(--text-secondary)]/60"
            }`}
          >
            {precioRegular}
          </del>
          <span className="sr-only">Precio fundador: </span>
          <span
            className={`font-display text-3xl font-extrabold ${
              hl ? "text-[var(--bronze)]" : "text-[var(--primary)]"
            }`}
          >
            {precio}
          </span>
          <span
            className={
              hl ? "text-[var(--text-cream)]/60" : "text-[var(--text-secondary)]"
            }
          >
            {moneda === "usd" ? " USD" : ""}/mes
          </span>
        </p>
        <p
          className={`mt-1 text-xs ${
            hl ? "text-[var(--text-cream)]/50" : "text-[var(--text-secondary)]/80"
          }`}
        >
          {periodo === "anual"
            ? "facturado anual · 2 meses gratis"
            : "Al lanzamiento: 14 días gratis"}
        </p>

        <ul className="mt-6 space-y-3 text-sm">
          {plan.features.map((f) => (
            <li
              key={f}
              className={`flex items-center gap-2 ${
                hl ? "text-[var(--text-cream)]/80" : "text-[var(--text-secondary)]"
              }`}
            >
              <svg className="h-4 w-4 flex-shrink-0 text-[var(--emerald)]" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 8L6.5 11.5L13 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {f}
            </li>
          ))}
        </ul>

        <motion.a
          href="#waitlist"
          className={`relative mt-8 block overflow-hidden rounded-[var(--radius-md)] py-3 text-center font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            hl
              ? "glow-btn bg-[var(--bronze)] text-white hover:bg-[var(--bronze)]/90 focus-visible:ring-[var(--bronze)]"
              : "bg-[var(--primary)] text-white hover:bg-[var(--primary-strong)] focus-visible:ring-[var(--primary)]"
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 350, damping: 20 }}
        >
          {hl && (
            <motion.span
              className="pointer-events-none absolute inset-0"
              initial={{ x: "-100%" }}
              whileHover={{ x: "200%" }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              style={{ background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.2) 50%, transparent 65%)" }}
              aria-hidden
            />
          )}
          {plan.cta}
        </motion.a>
      </div>
    </div>
  );
}
