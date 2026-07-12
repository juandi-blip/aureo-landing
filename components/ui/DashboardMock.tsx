// components/ui/DashboardMock.tsx
"use client";
import { useRef, useState, useEffect } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "motion/react";
import {
  AlertTriangle,
  Bell,
  Boxes,
  Calendar,
  Check,
  DollarSign,
  FileText,
  Plus,
} from "lucide-react";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { HERO_TIMING, reducedTransition } from "@/lib/motion";
import { cn } from "@/lib/utils";

const KPIS = [
  {
    label: "Ingresos Totales",
    to: 3433.39,
    prefix: "$",
    decimals: 2,
    delta: "0% vs mes anterior",
    icon: DollarSign,
    iconBg: "bg-[var(--primary)]/10",
    iconColor: "text-[var(--primary)]",
    spark: "M0,10 C4,8 8,4 12,6 S20,10 24,5",
    sparkColor: "var(--emerald)",
  },
  {
    label: "Órdenes Emitidas",
    to: 3,
    decimals: 0,
    delta: "+8.1% este mes",
    icon: FileText,
    iconBg: "bg-[var(--emerald)]/12",
    iconColor: "text-[var(--emerald)]",
    spark: "M0,8 C4,6 8,3 12,5 S20,2 24,4",
    sparkColor: "var(--emerald)",
  },
  {
    label: "Artículos",
    to: 533,
    decimals: 0,
    delta: "5 categorías",
    icon: Boxes,
    iconBg: "bg-[var(--bronze)]/12",
    iconColor: "text-[var(--bronze)]",
    spark: "M0,6 C6,6 12,6 18,6 S21,6 24,6",
    sparkColor: "var(--bronze)",
  },
  {
    label: "Alertas",
    to: 2,
    decimals: 0,
    delta: "Stock crítico",
    icon: AlertTriangle,
    iconBg: "bg-[var(--terracotta)]/10",
    iconColor: "text-[var(--terracotta)]",
    spark: "M0,4 C6,8 12,10 18,8 S21,10 24,12",
    sparkColor: "var(--terracotta)",
  },
] as const;

const TRANSACTIONS = [
  { client: "Metalúrgica Maipú", ref: "FACT-2026-0003", amount: 962.83 },
  { client: "Ferretería El Tornillo", ref: "FACT-2026-0002", amount: 1847.56 },
  { client: "Distribuidora Norte", ref: "FACT-2026-0001", amount: 623.0 },
] as const;

const CHART_DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;

const CHART_LINE =
  "M0,48 C18,48 36,44 54,38 S90,28 108,32 S144,40 162,28 S198,18 216,24 S234,36 252,30";
const CHART_AREA = `${CHART_LINE} L252,56 L0,56 Z`;

const BOOT = HERO_TIMING.boot;

function KpiCard({
  kpi,
  index,
  boot,
  reduce,
}: {
  kpi: (typeof KPIS)[number];
  index: number;
  boot: boolean;
  reduce: boolean | null;
}) {
  const Icon = kpi.icon;
  const delay = boot
    ? BOOT.kpiBase + index * BOOT.kpiStagger
    : 0.2 + index * 0.07;
  const numberDelay = boot
    ? BOOT.numbers + index * 0.06
    : 0;

  return (
    <motion.div
      className="rounded-[var(--radius-md)] bg-[var(--bg-subtle)] p-2.5 md:p-3"
      initial={{ opacity: 0, y: reduce ? 0 : 12, scale: reduce ? 1 : 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={
        reduce
          ? { duration: 0 }
          : { delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }
      }
    >
      <div className="flex items-start justify-between gap-1">
        <motion.div
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-md md:h-7 md:w-7",
            kpi.iconBg,
          )}
          initial={{ scale: reduce ? 1 : 0 }}
          animate={{ scale: 1 }}
          transition={
            reduce
              ? { duration: 0 }
              : { delay: delay + 0.1, type: "spring", damping: 16, stiffness: 220 }
          }
        >
          <Icon className={cn("h-3 w-3 md:h-3.5 md:w-3.5", kpi.iconColor)} aria-hidden />
        </motion.div>
        <svg viewBox="0 0 24 12" className="h-3 w-10 opacity-70" aria-hidden>
          <motion.path
            d={kpi.spark}
            fill="none"
            stroke={kpi.sparkColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={
              reduce
                ? { duration: 0 }
                : { delay: delay + 0.2, duration: 0.5, ease: "easeOut" }
            }
          />
        </svg>
      </div>
      <p className="mt-2 text-[9px] text-[var(--text-muted)] md:text-[10px]">{kpi.label}</p>
      <p className="font-display text-sm font-bold leading-none text-[var(--text-primary)] md:text-base">
        <AnimatedNumber
          to={kpi.to}
          prefix={"prefix" in kpi ? kpi.prefix : ""}
          decimals={kpi.decimals}
          start={boot}
          delay={numberDelay}
          duration={0.9}
        />
      </p>
      <p className="mt-1 text-[8px] text-[var(--text-muted)] md:text-[9px]">{kpi.delta}</p>
    </motion.div>
  );
}

export function DashboardMock({
  className,
  boot = false,
}: {
  className?: string;
  boot?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [liveOn, setLiveOn] = useState(reduce === true);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotateY = useSpring(useTransform(rawX, [-0.5, 0.5], [-4, 4]), {
    stiffness: 200,
    damping: 30,
  });
  const rotateX = useSpring(useTransform(rawY, [-0.5, 0.5], [3, -3]), {
    stiffness: 200,
    damping: 30,
  });

  useEffect(() => {
    // Timeout también en el caso inmediato: evita el setState síncrono en el
    // efecto (render en cascada) que marcaba react-hooks/set-state-in-effect.
    const delay = !boot || reduce ? 0 : BOOT.live * 1000;
    const t = window.setTimeout(() => setLiveOn(true), delay);
    return () => clearTimeout(t);
  }, [boot, reduce]);

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

  const chartDelay = boot ? BOOT.chart : 0.6;
  const txBase = boot ? BOOT.transactions : 0.85;
  const txStagger = boot ? BOOT.txStagger : 0.08;

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 1200 }}
      className={cn(
        "w-full overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xl md:shadow-[0_32px_64px_-12px_rgba(30,51,82,0.18)]",
        className,
      )}
    >
      {/* Chrome */}
      <motion.div
        className="flex items-center gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-4 py-3 md:px-5 md:py-3.5"
        initial={{ opacity: boot && !reduce ? 0 : 1 }}
        animate={{ opacity: 1 }}
        transition={reducedTransition(reduce, boot ? HERO_TIMING.dashboard : 0, 0.35)}
      >
        {(["#FF5F57", "#FEBC2E", "#28C840"] as const).map((color, i) => (
          <motion.span
            key={color}
            className="h-2.5 w-2.5 rounded-full md:h-3 md:w-3"
            style={{ backgroundColor: color }}
            initial={{ scale: boot && !reduce ? 0 : 1 }}
            animate={{ scale: 1 }}
            transition={
              reduce
                ? { duration: 0 }
                : {
                    delay: (boot ? HERO_TIMING.dashboard : 0) + 0.08 + i * 0.05,
                    type: "spring",
                    damping: 14,
                    stiffness: 260,
                  }
            }
          />
        ))}
        <span className="ml-2 text-xs font-semibold text-[var(--text-secondary)] md:text-sm">
          Panel Aureo
        </span>
        <div className="ml-auto flex items-center gap-2">
          <motion.div
            className="hidden items-center gap-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-0.5 text-[9px] text-[var(--text-muted)] sm:flex"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={reducedTransition(reduce, boot ? BOOT.inner : 0.3, 0.35)}
          >
            <Calendar className="h-3 w-3" aria-hidden />
            <span>25 jun 2026</span>
          </motion.div>
          <div className="flex items-center gap-1">
            <motion.span
              className="h-1.5 w-1.5 rounded-full bg-[var(--emerald)] md:h-2 md:w-2"
              animate={
                liveOn
                  ? { scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }
                  : { scale: 1, opacity: 0.3 }
              }
              transition={
                liveOn
                  ? { duration: 1.5, repeat: Infinity }
                  : { duration: 0.2 }
              }
            />
            <motion.span
              className="text-[10px] font-medium text-[var(--emerald)] md:text-xs"
              animate={{ opacity: liveOn ? 1 : 0.4 }}
              transition={{ duration: 0.3 }}
            >
              En vivo
            </motion.span>
          </div>
        </div>
      </motion.div>

      {/* Product UI */}
      <motion.div
        className="space-y-3 p-4 md:space-y-4 md:p-5"
        initial={{ opacity: boot && !reduce ? 0 : 1 }}
        animate={{ opacity: 1 }}
        transition={reducedTransition(reduce, boot ? BOOT.inner : 0, 0.4)}
      >
        <motion.div
          className="flex items-center justify-between gap-2"
          initial={{ opacity: 0, y: reduce ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reducedTransition(reduce, boot ? BOOT.inner + 0.05 : 0.15, 0.35)}
        >
          <div>
            <p className="text-[10px] font-semibold text-[var(--text-primary)] md:text-xs">
              Dashboard Operativo
            </p>
            <p className="text-[9px] text-[var(--text-muted)] md:text-[10px]">
              Transacciones y estado del depósito
            </p>
          </div>
          <div
            aria-hidden
            className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
          >
            <Bell className="h-3.5 w-3.5" />
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:gap-2.5">
          {KPIS.map((kpi, i) => (
            <KpiCard key={kpi.label} kpi={kpi} index={i} boot={boot} reduce={reduce} />
          ))}
        </div>

        <div className="hidden gap-2.5 md:grid md:grid-cols-5 md:gap-3">
          <motion.div
            className="rounded-[var(--radius-md)] bg-[var(--bg-subtle)] p-3 md:col-span-3"
            initial={{ opacity: 0, y: reduce ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reducedTransition(reduce, chartDelay - 0.08, 0.4)}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-[10px] font-semibold text-[var(--text-primary)] md:text-xs">
                Curva de Facturación Semanal
              </p>
              <span className="rounded-full bg-[var(--bg-surface)] px-2 py-0.5 text-[8px] font-medium text-[var(--text-muted)]">
                22–28 JUN
              </span>
            </div>
            <svg viewBox="0 0 252 56" className="h-16 w-full md:h-20" aria-hidden>
              <defs>
                <linearGradient id="aureo-chart-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <motion.path
                d={CHART_AREA}
                fill="url(#aureo-chart-fill)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={reducedTransition(reduce, chartDelay, 0.6)}
              />
              <motion.path
                d={CHART_LINE}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={
                  reduce
                    ? { duration: 0 }
                    : { duration: 1.1, delay: chartDelay + 0.05, ease: "easeInOut" }
                }
              />
            </svg>
            <div className="mt-1 flex justify-between text-[8px] text-[var(--text-muted)]">
              {CHART_DAYS.map((day, i) => (
                <motion.span
                  key={day}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={reducedTransition(reduce, chartDelay + 0.3 + i * 0.03, 0.2)}
                >
                  {day}
                </motion.span>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="rounded-[var(--radius-md)] bg-[var(--bg-subtle)] p-3 md:col-span-2"
            initial={{ opacity: 0, y: reduce ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reducedTransition(reduce, txBase - 0.1, 0.4)}
          >
            <div className="mb-2 flex items-center justify-between gap-1">
              <p className="text-[10px] font-semibold text-[var(--text-primary)] md:text-xs">
                Últimas Transacciones
              </p>
              <span className="flex items-center gap-0.5 rounded-md bg-[var(--primary)] px-1.5 py-0.5 text-[8px] font-semibold text-white">
                <Plus className="h-2.5 w-2.5" aria-hidden />
                NUEVA
              </span>
            </div>
            <div className="space-y-1.5">
              {TRANSACTIONS.map((tx, i) => (
                <motion.div
                  key={tx.ref}
                  className="flex items-center gap-2 rounded-md bg-[var(--bg-surface)] px-2 py-1.5"
                  initial={{ opacity: 0, x: reduce ? 0 : 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={
                    reduce
                      ? { duration: 0 }
                      : {
                          delay: txBase + i * txStagger,
                          duration: 0.4,
                          ease: [0.22, 1, 0.36, 1],
                        }
                  }
                >
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--emerald)]/15">
                    <Check className="h-2.5 w-2.5 text-[var(--emerald)]" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[9px] font-medium text-[var(--text-primary)]">
                      {tx.client}
                    </p>
                    <p className="text-[8px] text-[var(--text-muted)]">{tx.ref}</p>
                  </div>
                  <span className="shrink-0 text-[9px] font-bold text-[var(--text-primary)]">
                    ${tx.amount.toLocaleString("es-CO", { minimumFractionDigits: 0 })}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
