// components/ModuleCard.tsx
"use client";
import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { ShoppingCart, Boxes, Map, BarChart2, Route, ArrowRightLeft, Users, Bell, FileText, ShoppingBag, ClipboardCheck, Shield } from "lucide-react";
import type { Module } from "@/content/site";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "shopping-cart": ShoppingCart,
  boxes: Boxes,
  map: Map,
  "bar-chart": BarChart2,
  route: Route,
  "arrow-right-left": ArrowRightLeft,
  users: Users,
  bell: Bell,
  "file-text": FileText,
  "shopping-bag": ShoppingBag,
  "clipboard-check": ClipboardCheck,
  shield: Shield,
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
      style={{ rotateX: rX, rotateY: rY, transformPerspective: 900 }}
      whileHover={{
        boxShadow: "0 20px 48px rgba(168,116,43,0.18)",
        borderColor: "rgba(168,116,43,0.35)",
      }}
      transition={{ duration: 0.2 }}
      className="group relative flex h-full cursor-default flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6"
    >
      {/* Shimmer sweep on hover */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        initial={{ x: "-100%" }}
        whileHover={{ x: "200%" }}
        transition={{ duration: 0.55, ease: "easeInOut" }}
        style={{
          background:
            "linear-gradient(105deg, transparent 35%, rgba(168,116,43,0.12) 50%, transparent 65%)",
        }}
        aria-hidden
      />

      <motion.div
        className="mb-4 flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary)]/10"
        whileHover={{ scale: 1.18, backgroundColor: "rgba(168,116,43,0.18)" }}
        transition={{ type: "spring", stiffness: 320, damping: 18 }}
      >
        <Icon aria-hidden className="h-5 w-5 text-[var(--primary)] transition-colors group-hover:text-[var(--bronze)]" />
      </motion.div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">
        {module.titulo}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--text-secondary)]">
        {module.beneficio}
      </p>
    </motion.div>
  );
}
