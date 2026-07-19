// components/Hero.tsx
"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { site } from "@/content/site";
import { WaitlistForm, type WaitlistStep } from "@/components/WaitlistForm";
import { FloatingParticles } from "@/components/ui/FloatingParticles";
import { DashboardMock } from "@/components/ui/DashboardMock";
import {
  HERO_TIMING,
  reducedTransition,
} from "@/lib/motion";
import { ParallaxLayer } from "@/components/ui/ParallaxLayer";
import { DemoGateModal } from "@/components/DemoGateModal";

const DEMO_URL = process.env.NEXT_PUBLIC_DEMO_URL || "";

export function Hero() {
  const reduce = useReducedMotion();
  const [formStep, setFormStep] = useState<WaitlistStep>("email");
  const [gateOpen, setGateOpen] = useState(false);

  return (
    <section
      id="waitlist"
      className="relative mx-auto max-w-7xl overflow-visible px-5 py-14 md:py-20 lg:px-8 lg:py-24"
    >
      <motion.div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={reducedTransition(reduce, HERO_TIMING.particles, 1.2)}
      >
        <ParallaxLayer speed={0.2} className="absolute inset-0">
          <FloatingParticles count={14} className="z-0" />
        </ParallaxLayer>
      </motion.div>

      <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-8 xl:gap-10">
        {/* Copy */}
        <div className="relative z-10 min-w-0 xl:pr-6">
          <div className="relative">
            {/* Anillo de Saturno detrás del título */}
            {!reduce && (
              <motion.div
                className="pointer-events-none absolute inset-0 flex items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4, duration: 1.6, ease: "easeOut" }}
                aria-hidden
              >
                <svg
                  viewBox="0 0 340 110"
                  className="animate-spin-slow absolute -left-6 w-[105%] text-[var(--bronze)]"
                  style={{ opacity: 0.13 }}
                >
                  <ellipse cx="170" cy="55" rx="164" ry="46" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <ellipse cx="170" cy="55" rx="120" ry="32" fill="none" stroke="currentColor" strokeWidth="0.7" />
                </svg>
              </motion.div>
            )}

            <h1 className="relative z-10 font-display text-[2.35rem] font-extrabold leading-[1.06] tracking-tight text-[var(--text-primary)] sm:text-5xl lg:text-[3rem] lg:leading-[1.08] xl:text-[3.5rem]">
              {site.hero.tituloLineas.map((line, i) => (
                <span key={line} className="block overflow-hidden">
                  <span className={`hero-line ${i === 0 ? "hero-line-1" : "hero-line-2"}`}>
                    {line}
                  </span>
                </span>
              ))}
            </h1>
          </div>

          <motion.div
            className="mt-4 h-0.5 w-14 origin-left rounded-full bg-[var(--bronze)]"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={reducedTransition(reduce, HERO_TIMING.bronzeLine, 0.5)}
            aria-hidden
          />

          <p className="hero-fade hero-fade-subtitle mt-5 max-w-md text-base leading-relaxed text-[var(--text-secondary)] md:mt-6 md:text-lg">
            {site.hero.subtitulo}
          </p>

          <div className="hero-fade hero-fade-form mt-7 md:mt-8">
            <WaitlistForm origen="hero" onStepChange={setFormStep} />
            {formStep === "email" && (
              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                {site.hero.nota}
              </p>
            )}
            {formStep === "email" && DEMO_URL && (
              <button
                type="button"
                onClick={() => setGateOpen(true)}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--bronze)] underline underline-offset-2 hover:text-[var(--bronze)]/80"
              >
                o explora la demo →
              </button>
            )}
          </div>
        </div>

        {/* Dashboard */}
        <motion.div
          className="relative z-0 min-w-0 w-full"
          initial={reduce ? false : { opacity: 0, x: 48, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={
            reduce
              ? { duration: 0 }
              : {
                  delay: HERO_TIMING.dashboard,
                  type: "spring",
                  damping: 28,
                  stiffness: 110,
                }
          }
        >
          <div className="mx-auto w-full max-w-lg p-3 sm:max-w-xl sm:p-4 lg:mx-0 lg:max-w-none">
            <DashboardMock className="w-full" boot />
          </div>
        </motion.div>
      </div>
      <DemoGateModal
        open={gateOpen}
        onOpenChange={setGateOpen}
        demoUrl={DEMO_URL}
        reason={null}
      />
    </section>
  );
}
