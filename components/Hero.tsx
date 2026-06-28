// components/Hero.tsx
"use client";
import { motion, useReducedMotion } from "motion/react";
import { site } from "@/content/site";
import { WaitlistForm } from "@/components/WaitlistForm";
import { FloatingParticles } from "@/components/ui/FloatingParticles";
import { DashboardMock } from "@/components/ui/DashboardMock";
import {
  HERO_TIMING,
  reducedTransition,
} from "@/lib/motion";
import { ParallaxLayer } from "@/components/ui/ParallaxLayer";

export function Hero() {
  const reduce = useReducedMotion();

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
                  <motion.span
                    className="block"
                    initial={{ y: reduce ? 0 : "110%", opacity: reduce ? 1 : 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={
                      reduce
                        ? { duration: 0 }
                        : {
                            delay:
                              i === 0
                                ? HERO_TIMING.titleLine1
                                : HERO_TIMING.titleLine2,
                            duration: 0.65,
                            ease: [0.22, 1, 0.36, 1],
                          }
                    }
                  >
                    {line}
                  </motion.span>
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

          <motion.p
            className="mt-5 max-w-md text-base leading-relaxed text-[var(--text-secondary)] md:mt-6 md:text-lg"
            initial={{ opacity: 0, y: reduce ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reducedTransition(reduce, HERO_TIMING.subtitle)}
          >
            {site.hero.subtitulo}
          </motion.p>

          <motion.div
            className="mt-7 md:mt-8"
            initial={{ opacity: 0, y: reduce ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reducedTransition(reduce, HERO_TIMING.form)}
          >
            <WaitlistForm origen="hero" />
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              {site.hero.nota}
            </p>
          </motion.div>
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
    </section>
  );
}
