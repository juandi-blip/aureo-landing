"use client";
import { motion, useReducedMotion } from "motion/react";
import { site } from "@/content/site";
import { HERO_TIMING, reducedTransition } from "@/lib/motion";

export function WhatsAppButton() {
  const reduce = useReducedMotion();

  return (
    <motion.a
      href={site.whatsapp}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--emerald)] text-white shadow-lg hover:opacity-90"
      initial={{ opacity: 0, y: reduce ? 0 : 24, scale: reduce ? 1 : 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={
        reduce
          ? { duration: 0 }
          : { type: "spring", damping: 20, stiffness: 180, delay: HERO_TIMING.whatsapp }
      }
    >
      <span className="font-bold">WA</span>
    </motion.a>
  );
}
