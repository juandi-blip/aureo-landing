// lib/motion.ts
export const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, damping: 25, stiffness: 120 },
  },
};

export const fadeLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, damping: 25, stiffness: 120 },
  },
};

export const fadeRight = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, damping: 25, stiffness: 120 },
  },
};

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

export const clipReveal = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export const VIEWPORT = { once: true, margin: "-50px" } as const;

/** Orchestrated hero entrance — total ~1.5s */
export const HERO_TIMING = {
  nav: 0,
  particles: 0.15,
  titleLine1: 0.2,
  titleLine2: 0.38,
  bronzeLine: 0.52,
  subtitle: 0.58,
  form: 0.72,
  dashboard: 0.48,
  boot: {
    inner: 0.62,
    kpiBase: 0.78,
    kpiStagger: 0.07,
    numbers: 0.85,
    chart: 1.08,
    transactions: 1.28,
    txStagger: 0.09,
    live: 1.55,
  },
  whatsapp: 2.1,
} as const;

export const easeOut = [0.22, 1, 0.36, 1] as const;

export const heroDashboardEnter = {
  hidden: { opacity: 0, x: 48, scale: 0.96 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      delay: HERO_TIMING.dashboard,
      type: "spring" as const,
      damping: 28,
      stiffness: 110,
    },
  },
};

export function reducedTransition(
  reduce: boolean | null,
  delay: number,
  duration = 0.55,
) {
  if (reduce) return { duration: 0, delay: 0 };
  return { delay, duration, ease: easeOut };
}
