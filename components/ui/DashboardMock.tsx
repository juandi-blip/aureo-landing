// components/ui/DashboardMock.tsx
"use client";
import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";

const METRICS = [
  { label: "Productos", to: 847, suffix: "" },
  { label: "Ventas hoy", to: 12.4, prefix: "$", suffix: "M", decimals: 1 },
  { label: "Precisión", to: 98.2, suffix: "%", decimals: 1 },
] as const;

const ROWS = [
  { name: "Cemento Gris x50", location: "A-12", stock: 240 },
  { name: "Varilla 1/2\" x12m", location: "B-05", stock: 156 },
  { name: "Arena Fina m³", location: "C-03", stock: 89 },
];

const CHART_PATH =
  "M0,55 C20,45 40,18 60,28 S100,55 120,42 S160,12 180,22 S220,48 240,32 S280,8 300,18";

export function DashboardMock() {
  const ref = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotateY = useSpring(useTransform(rawX, [-0.5, 0.5], [-8, 8]), {
    stiffness: 200,
    damping: 30,
  });
  const rotateX = useSpring(useTransform(rawY, [-0.5, 0.5], [6, -6]), {
    stiffness: 200,
    damping: 30,
  });

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set((e.clientX - rect.left) / rect.width - 0.5);
    rawY.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function onMouseLeave() {
    rawX.set(0);
    rawY.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 1200 }}
      className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xl"
    >
      {/* macOS header */}
      <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
        <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
        <span className="h-3 w-3 rounded-full bg-[#28C840]" />
        <span className="ml-3 text-sm font-semibold text-[var(--text-secondary)]">
          Panel Aureo
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <motion.span
            className="h-2 w-2 rounded-full bg-[var(--emerald)]"
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-xs font-medium text-[var(--emerald)]">
            En vivo
          </span>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3">
          {METRICS.map((m) => (
            <div
              key={m.label}
              className="rounded-[var(--radius-md)] bg-[var(--bg-subtle)] p-3"
            >
              <p className="text-xs text-[var(--text-muted)]">{m.label}</p>
              <p className="mt-1 font-display text-xl font-bold text-[var(--text-primary)]">
                <AnimatedNumber
                  to={m.to}
                  prefix={"prefix" in m ? m.prefix : ""}
                  suffix={m.suffix}
                  decimals={"decimals" in m ? m.decimals : 0}
                />
              </p>
            </div>
          ))}
        </div>

        {/* SVG chart */}
        <div className="rounded-[var(--radius-md)] bg-[var(--bg-subtle)] p-3">
          <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">
            Ventas del mes
          </p>
          <svg viewBox="0 0 300 75" className="h-14 w-full">
            <motion.path
              d={CHART_PATH}
              fill="none"
              stroke="var(--bronze)"
              strokeWidth="2.5"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.6, delay: 0.8, ease: "easeInOut" }}
            />
          </svg>
        </div>

        {/* Product rows */}
        <div className="space-y-1">
          {ROWS.map((row, i) => (
            <motion.div
              key={row.name}
              className="flex items-center justify-between rounded-[var(--radius-sm)] px-2 py-1.5 text-xs"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2 + i * 0.12 }}
            >
              <span className="font-medium text-[var(--text-primary)]">
                {row.name}
              </span>
              <span className="text-[var(--text-muted)]">{row.location}</span>
              <span className="font-semibold text-[var(--primary)]">
                {row.stock} u.
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
