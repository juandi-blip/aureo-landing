// components/Hero.tsx
"use client";
import { motion } from "motion/react";
import { site } from "@/content/site";
import { WaitlistForm } from "@/components/WaitlistForm";
import { FloatingParticles } from "@/components/ui/FloatingParticles";
import { DashboardMock } from "@/components/ui/DashboardMock";
import { staggerContainer, fadeUp } from "@/lib/motion";

export function Hero() {
  const words = site.hero.titulo.split(" ");

  return (
    <section
      id="waitlist"
      className="relative mx-auto max-w-6xl overflow-hidden px-5 py-20 md:py-28"
    >
      <FloatingParticles count={22} className="z-0" />

      <div className="relative z-10 grid items-center gap-12 md:grid-cols-2">
        {/* Left */}
        <div>
          {/* Badge */}
          <motion.div
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--bronze)]/30 bg-[var(--bronze)]/10 px-3 py-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.span
              className="h-2 w-2 rounded-full bg-[var(--bronze)]"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-xs font-semibold text-[var(--bronze)]">
              Acceso anticipado abierto
            </span>
          </motion.div>

          {/* Title — word stagger */}
          <motion.h1
            className="font-display text-5xl font-extrabold leading-tight text-[var(--text-primary)] md:text-[4.5rem]"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {words.map((word, i) => (
              <motion.span
                key={i}
                variants={fadeUp}
                className="mr-[0.2em] inline-block"
              >
                {word}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p
            className="mt-6 text-lg text-[var(--text-secondary)]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, type: "spring", damping: 25 }}
          >
            {site.hero.subtitulo}
          </motion.p>

          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, type: "spring", damping: 25 }}
          >
            <WaitlistForm origen="hero" />
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              {site.hero.nota}
            </p>
          </motion.div>
        </div>

        {/* Right — Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, type: "spring", damping: 22, stiffness: 90 }}
        >
          <DashboardMock />
        </motion.div>
      </div>
    </section>
  );
}
