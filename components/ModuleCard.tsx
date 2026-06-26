// components/ModuleCard.tsx
"use client";
import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { ShoppingCart, Boxes, Map, BarChart2, Route } from "lucide-react";
import type { Module } from "@/content/site";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "shopping-cart": ShoppingCart,
  boxes: Boxes,
  map: Map,
  "bar-chart": BarChart2,
  route: Route,
};

export function ModuleCard({ module }: { module: Module }) {
  const Icon = ICON_MAP[module.icono] ?? Boxes;
  const ref = useRef<HTMLDivElement>(null);
  const rX = useSpring(useMotionValue(0), { stiffness: 200, damping: 30 });
  const rY = useSpring(useMotionValue(0), { stiffness: 200, damping: 30 });

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    rX.set(-((e.clientY - rect.top) / rect.height - 0.5) * 8);
    rY.set(((e.clientX - rect.left) / rect.width - 0.5) * 8);
  }
  function onMouseLeave() {
    rX.set(0);
    rY.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ rotateX: rX, rotateY: rY, transformPerspective: 800 }}
      whileHover={{ boxShadow: "0 20px 40px rgba(168,116,43,0.15)" }}
      className="group cursor-default rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 transition-shadow"
    >
      <motion.div
        className="mb-4 flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary)]/10"
        whileHover={{ scale: 1.2, backgroundColor: "rgba(168,116,43,0.15)" }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <Icon className="h-5 w-5 text-[var(--primary)] transition-colors group-hover:text-[var(--bronze)]" />
      </motion.div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">
        {module.titulo}
      </h3>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        {module.beneficio}
      </p>
    </motion.div>
  );
}
