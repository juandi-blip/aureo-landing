"use client";
import { useReducedMotion } from "motion/react";

// Uses the CSS .grain-texture class defined in globals.css — no SVG rendering.
export function GrainOverlay() {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <div
      className="grain-texture pointer-events-none absolute inset-0 z-0"
      aria-hidden
    />
  );
}
