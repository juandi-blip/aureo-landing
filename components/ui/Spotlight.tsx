"use client";
import { motion, useMotionValue, useMotionTemplate, useReducedMotion } from "motion/react";

export function useSpotlight() {
  const mouseX = useMotionValue(-9999);
  const mouseY = useMotionValue(-9999);

  function onMouseMove(e: React.MouseEvent<HTMLElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }

  function onMouseLeave() {
    mouseX.set(-9999);
    mouseY.set(-9999);
  }

  return { mouseX, mouseY, onMouseMove, onMouseLeave };
}

export function SpotlightGlow({
  mouseX,
  mouseY,
  color = "rgba(168,116,43,0.09)",
  size = 680,
}: {
  mouseX: ReturnType<typeof useMotionValue<number>>;
  mouseY: ReturnType<typeof useMotionValue<number>>;
  color?: string;
  size?: number;
}) {
  const reduce = useReducedMotion();
  // Move a fixed, statically-painted radial gradient with translate3d so the
  // glow is GPU-composited. The previous approach animated the `background`
  // (radial-gradient position) of a full-section div, forcing a full-section
  // repaint on every mousemove — the main source of paint jank.
  const transform = useMotionTemplate`translate3d(calc(${mouseX}px - ${size}px), calc(${mouseY}px - ${size}px), 0)`;

  if (reduce) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <motion.div
        className="absolute left-0 top-0 will-change-transform"
        style={{
          width: size * 2,
          height: size * 2,
          transform,
          background: `radial-gradient(${size}px circle at center, ${color}, transparent 80%)`,
        }}
      />
    </div>
  );
}
