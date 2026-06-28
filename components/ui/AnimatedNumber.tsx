// components/ui/AnimatedNumber.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";

export function AnimatedNumber({
  to,
  duration = 1.2,
  prefix = "",
  suffix = "",
  decimals = 0,
  delay = 0,
  start = false,
}: {
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  /** Delay in seconds before counting starts */
  delay?: number;
  /** Start immediately on mount (hero boot) instead of waiting for scroll */
  start?: boolean;
}) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const shouldRun = start || inView;

  useEffect(() => {
    if (!shouldRun) return;

    let frame = 0;
    const timeout = window.setTimeout(() => {
      const t0 = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - t0) / (duration * 1000), 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(eased * to);
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, delay * 1000);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(frame);
    };
  }, [shouldRun, to, duration, delay]);

  return (
    <span ref={ref}>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}
