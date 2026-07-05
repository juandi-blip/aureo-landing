"use client";
import { useMemo } from "react";
import { useReducedMotion } from "motion/react";

type Particle = {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
};

// PRNG determinista (mulberry32): mismas partículas en servidor y cliente,
// así se renderizan en el HTML inicial sin efecto ni segundo render.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function FloatingParticles({
  count = 14,
  className = "",
}: {
  count?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();

  const particles = useMemo<Particle[]>(() => {
    const rand = mulberry32(count * 2654435761);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: rand() * 100,
      y: rand() * 100,
      size: rand() * 3 + 2,
      duration: rand() * 4 + 4,
      delay: rand() * 3,
    }));
  }, [count]);

  if (reduce) return null;

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle absolute rounded-full bg-[var(--bronze)]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
