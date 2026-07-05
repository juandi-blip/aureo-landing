// components/PricingTable.tsx
"use client";
import { useState } from "react";
import { motion } from "motion/react";
import { site, type Moneda, type Periodo } from "@/content/site";
import { PricingCard } from "@/components/PricingCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { fadeUp, VIEWPORT } from "@/lib/motion";

function SegmentedToggle<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string; badge?: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={`relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "text-white"
                : "text-[var(--text-secondary)] hover:text-[var(--primary)]"
            }`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${label}`}
                className="absolute inset-0 rounded-full bg-[var(--primary)]"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10 whitespace-nowrap">
              {opt.label}
              {opt.badge && (
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[0.65rem] font-semibold ${
                    active
                      ? "bg-white/20 text-white"
                      : "bg-[var(--emerald)]/15 text-[var(--emerald)]"
                  }`}
                >
                  {opt.badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function PricingTable() {
  const [moneda, setMoneda] = useState<Moneda>("cop");
  const [periodo, setPeriodo] = useState<Periodo>("mensual");

  return (
    <section id="precios" className="overflow-hidden py-24">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading className="text-center">
          Un plan para cada etapa de tu negocio.
        </SectionHeading>

        <motion.p
          className="mx-auto mt-4 max-w-xl text-center text-[var(--text-secondary)]"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {site.preciosTrial}
        </motion.p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <SegmentedToggle
            label="Periodo de facturación"
            value={periodo}
            onChange={setPeriodo}
            options={[
              { value: "mensual", label: "Mensual" },
              { value: "anual", label: "Anual", badge: "−17%" },
            ]}
          />
          <SegmentedToggle
            label="Moneda"
            value={moneda}
            onChange={setMoneda}
            options={[
              { value: "cop", label: "COP" },
              { value: "usd", label: "USD" },
            ]}
          />
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3 md:items-start">
          {site.planes.map((p) => (
            <PricingCard key={p.nombre} plan={p} moneda={moneda} periodo={periodo} />
          ))}
        </div>

        <motion.p
          className="mt-6 text-center text-sm text-[var(--text-secondary)]"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {site.preciosNota}
        </motion.p>

        <motion.p
          className="mt-3 flex items-center justify-center gap-1.5 text-center text-sm text-[var(--text-secondary)]"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          <svg className="h-3.5 w-3.5 text-[var(--emerald)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Pagos protegidos y cifrados.{" "}
          <a href="#seguridad" className="font-medium text-[var(--primary)] underline-offset-2 hover:underline">
            Mira cómo te cuidamos
          </a>
        </motion.p>
      </div>
    </section>
  );
}
