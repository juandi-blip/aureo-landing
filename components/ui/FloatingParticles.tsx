"use client";
import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

type Particle = {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
};

export function FloatingParticles({
  count = 14,
  className = "",
}: {
  count?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 2,
        duration: Math.random() * 4 + 4,
        delay: Math.random() * 3,
      }))
    );
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
