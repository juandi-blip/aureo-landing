"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";

export function ParallaxLayer({
  children,
  speed = 0.25,
  className = "",
}: {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", `${speed * -100}%`]);

  return (
    <div ref={ref} className={className}>
      {reduce ? children : (
        <motion.div style={{ y }} className="will-change-transform">{children}</motion.div>
      )}
    </div>
  );
}
