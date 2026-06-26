# Aureo Landing — Animation Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Full visual redesign + Framer Motion animations across all sections of the Aureo landing page.

**Architecture:** Install `motion` (Framer Motion v11), create shared variant library in `lib/motion.ts`, build 4 new shared UI components, then rewrite each section component with animations. All interactive/animation components are Client Components (`"use client"`).

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, `motion` (Framer Motion v11), Lucide React, shadcn/ui

## Global Constraints

- `motion` is imported from `"motion/react"` — NOT `"framer-motion"`
- Every component using Framer Motion hooks or `useEffect` needs `"use client"` at top
- Particle positions generated in `useEffect` only — never during render (avoids SSR hydration mismatch)
- All `whileInView` use `viewport={{ once: true, margin: "-100px" }}`
- `VIEWPORT` constant from `lib/motion.ts` must be used everywhere — not inlined
- Colors: navy bg `#1E3352` as `--bg-navy`, text on navy as `--text-cream` (`#F7F3EA`)
- Bronze `#A8742B` is the animation accent: particles, glow, shimmer
- `overflow-x: hidden` on `body` — set in `globals.css`

---

### Task 1: Install motion + extend globals.css

**Files:**
- Modify: `package.json` (via pnpm)
- Modify: `app/globals.css`

**Interfaces:**
- Produces: CSS vars `--bg-navy`, `--text-cream`, `--bronze-glow`; CSS classes `.shimmer-btn`, `.shimmer-border`, `.shimmer-text`, `.grain-texture`, `.glow-btn`, `.link-underline`; `@keyframes` for shimmer-sweep, rotate-angle, glow-pulse

- [ ] **Step 1: Install motion**

```bash
cd D:/juandiplay/aureo-landing && pnpm add motion
```

Expected: `motion` added to `dependencies` in `package.json`.

- [ ] **Step 2: Add CSS vars and global utilities to globals.css**

Open `app/globals.css`. After the existing `:root` block (after `--radius: 0.625rem;` line), add inside the same `:root` block:

```css
  --bg-navy: #1E3352;
  --text-cream: #F7F3EA;
  --bronze-glow: rgba(168, 116, 43, 0.3);
```

Then add after the `body { ... }` rule (after line `font-family: var(--font-inter)...`):

```css
body {
  overflow-x: hidden;
}

/* Custom scrollbar */
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: var(--bg-base); }
::-webkit-scrollbar-thumb { background: var(--bronze); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--primary); }

/* @property for shimmer border rotation */
@property --angle {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}

@keyframes rotate-angle {
  to { --angle: 360deg; }
}

@keyframes shimmer-sweep {
  0% { transform: translateX(-100%); }
  40%, 100% { transform: translateX(150%); }
}

@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 0 0 var(--bronze-glow); }
  50% { box-shadow: 0 0 30px 10px var(--bronze-glow); }
}

/* Nav CTA shimmer */
.shimmer-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(168, 116, 43, 0.45), transparent);
  transform: translateX(-100%);
  animation: shimmer-sweep 3s ease-in-out infinite;
  pointer-events: none;
}

/* Demo section shimmer border */
.shimmer-border {
  position: relative;
  border: 2px solid transparent;
}
.shimmer-border::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  background: conic-gradient(from var(--angle), var(--bronze), transparent 30%, transparent 70%, var(--bronze));
  animation: rotate-angle 3s linear infinite;
  z-index: -1;
}

/* Demo text shimmer */
.shimmer-text {
  background: linear-gradient(90deg, var(--text-cream), var(--bronze), var(--text-cream));
  background-size: 200% auto;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer-sweep 3s linear infinite;
}

/* Grain texture overlay */
.grain-texture::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.035;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 0;
}

/* Glow CTA button */
.glow-btn {
  animation: glow-pulse 2s ease-in-out infinite;
}

/* Footer link underline from left */
.link-underline {
  position: relative;
}
.link-underline::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--primary);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 250ms ease;
}
.link-underline:hover::after {
  transform: scaleX(1);
}
```

- [ ] **Step 3: Verify dev server compiles**

```bash
cd D:/juandiplay/aureo-landing && pnpm dev
```

Navigate to `http://localhost:3000`. Page loads without errors. Scrollbar should be bronze-tinted.

- [ ] **Step 4: Commit**

```bash
cd D:/juandiplay/aureo-landing && git add app/globals.css package.json pnpm-lock.yaml && git commit -m "feat: install motion, extend globals with animation CSS vars and utilities"
```

---

### Task 2: Create lib/motion.ts

**Files:**
- Create: `lib/motion.ts`

**Interfaces:**
- Produces: `fadeUp`, `fadeLeft`, `fadeRight`, `staggerContainer`, `clipReveal` (Framer Motion variant objects); `VIEWPORT` (viewport config object)

- [ ] **Step 1: Create the file**

```ts
// lib/motion.ts
export const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, damping: 25, stiffness: 120 },
  },
};

export const fadeLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, damping: 25, stiffness: 120 },
  },
};

export const fadeRight = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, damping: 25, stiffness: 120 },
  },
};

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

export const clipReveal = {
  hidden: { clipPath: "inset(100% 0 0 0)" },
  visible: {
    clipPath: "inset(0% 0 0% 0)",
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export const VIEWPORT = { once: true, margin: "-100px" } as const;
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd D:/juandiplay/aureo-landing && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd D:/juandiplay/aureo-landing && git add lib/motion.ts && git commit -m "feat: add shared Framer Motion variant library"
```

---

### Task 3: Create FloatingParticles component

**Files:**
- Create: `components/ui/FloatingParticles.tsx`

**Interfaces:**
- Consumes: `motion` from `"motion/react"`
- Produces: `FloatingParticles({ count?: number; className?: string })` — renders `count` animated bronze dots in an absolute-positioned overlay

- [ ] **Step 1: Create the component**

```tsx
// components/ui/FloatingParticles.tsx
"use client";
import { useEffect, useState } from "react";
import { motion } from "motion/react";

type Particle = {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
};

export function FloatingParticles({
  count = 20,
  className = "",
}: {
  count?: number;
  className?: string;
}) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        duration: Math.random() * 4 + 3,
        delay: Math.random() * 2,
      }))
    );
  }, [count]);

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-[var(--bronze)]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: 0.35,
          }}
          animate={{ y: [0, -24, 0], opacity: [0.35, 0.65, 0.35] }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd D:/juandiplay/aureo-landing && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
cd D:/juandiplay/aureo-landing && git add components/ui/FloatingParticles.tsx && git commit -m "feat: add FloatingParticles animated component"
```

---

### Task 4: Create AnimatedNumber component

**Files:**
- Create: `components/ui/AnimatedNumber.tsx`

**Interfaces:**
- Produces: `AnimatedNumber({ to: number; duration?: number; prefix?: string; suffix?: string; decimals?: number })` — counts up from 0 to `to` when scrolled into view

- [ ] **Step 1: Create the component**

```tsx
// components/ui/AnimatedNumber.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";

export function AnimatedNumber({
  to,
  duration = 1.5,
  prefix = "",
  suffix = "",
  decimals = 0,
}: {
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(eased * to);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, to, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd D:/juandiplay/aureo-landing && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
cd D:/juandiplay/aureo-landing && git add components/ui/AnimatedNumber.tsx && git commit -m "feat: add AnimatedNumber CountUp component"
```

---

### Task 5: Create DashboardMock component

**Files:**
- Create: `components/ui/DashboardMock.tsx`

**Interfaces:**
- Consumes: `AnimatedNumber` from `@/components/ui/AnimatedNumber`
- Produces: `DashboardMock()` — animated macOS-style window with metrics, SVG chart, product rows, 3D mouse parallax

- [ ] **Step 1: Create the component**

```tsx
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
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd D:/juandiplay/aureo-landing && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
cd D:/juandiplay/aureo-landing && git add components/ui/DashboardMock.tsx && git commit -m "feat: add DashboardMock animated product panel"
```

---

### Task 6: Create SectionHeading component

**Files:**
- Create: `components/ui/SectionHeading.tsx`

**Interfaces:**
- Consumes: `clipReveal`, `VIEWPORT` from `@/lib/motion`
- Produces: `SectionHeading({ children; light?: boolean; className?: string })` — animated h2 with clipReveal

- [ ] **Step 1: Create the component**

```tsx
// components/ui/SectionHeading.tsx
"use client";
import { motion } from "motion/react";
import { clipReveal, VIEWPORT } from "@/lib/motion";

export function SectionHeading({
  children,
  light = false,
  className = "",
}: {
  children: React.ReactNode;
  light?: boolean;
  className?: string;
}) {
  return (
    <motion.h2
      className={`font-display text-4xl font-extrabold leading-tight md:text-5xl ${
        light ? "text-[var(--text-cream)]" : "text-[var(--text-primary)]"
      } ${className}`}
      variants={clipReveal}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
    >
      {children}
    </motion.h2>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd D:/juandiplay/aureo-landing && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
cd D:/juandiplay/aureo-landing && git add components/ui/SectionHeading.tsx && git commit -m "feat: add SectionHeading with clipReveal animation"
```

---

### Task 7: Rework Nav

**Files:**
- Modify: `components/Nav.tsx`

**Interfaces:**
- Consumes: `staggerContainer`, `fadeUp`, `VIEWPORT` from `@/lib/motion`

- [ ] **Step 1: Replace Nav.tsx entirely**

```tsx
// components/Nav.tsx
"use client";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { site } from "@/content/site";
import { staggerContainer, fadeUp } from "@/lib/motion";

const LINKS = [
  { href: "#producto", label: "Producto" },
  { href: "#como", label: "Cómo funciona" },
  { href: "#precios", label: "Precios" },
  { href: "#faq", label: "Preguntas" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-md transition-all duration-300 ${
        scrolled
          ? "border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/90 shadow-sm"
          : "bg-[var(--bg-base)]/85"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <motion.span
          className="font-display text-2xl font-extrabold text-[var(--primary)]"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          {site.marca}
        </motion.span>

        <motion.div
          className="hidden gap-7 text-sm font-semibold text-[var(--text-secondary)] md:flex"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {LINKS.map((link) => (
            <motion.a
              key={link.href}
              href={link.href}
              variants={fadeUp}
              className="rounded transition-colors hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            >
              {link.label}
            </motion.a>
          ))}
        </motion.div>

        <motion.a
          href="#waitlist"
          className="shimmer-btn relative overflow-hidden rounded-[var(--radius-md)] bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          Unirme
        </motion.a>
      </nav>
    </header>
  );
}
```

- [ ] **Step 2: Verify visually**

Run `pnpm dev`, open `http://localhost:3000`. Nav should fade in on load, links stagger, CTA slides from right. Scrolling down should add border + shadow.

- [ ] **Step 3: Commit**

```bash
cd D:/juandiplay/aureo-landing && git add components/Nav.tsx && git commit -m "feat: animate Nav with scroll-aware backdrop and stagger links"
```

---

### Task 8: Rework Hero

**Files:**
- Modify: `components/Hero.tsx`

**Interfaces:**
- Consumes: `FloatingParticles` from `@/components/ui/FloatingParticles`; `DashboardMock` from `@/components/ui/DashboardMock`; `staggerContainer`, `fadeUp` from `@/lib/motion`

- [ ] **Step 1: Replace Hero.tsx entirely**

```tsx
// components/Hero.tsx
"use client";
import { motion } from "motion/react";
import { site } from "@/content/site";
import { WaitlistForm } from "@/components/WaitlistForm";
import { FloatingParticles } from "@/components/ui/FloatingParticles";
import { DashboardMock } from "@/components/ui/DashboardMock";
import { staggerContainer, fadeUp } from "@/lib/motion";

export function Hero() {
  const words = site.hero.titulo.split(" ");

  return (
    <section
      id="waitlist"
      className="relative mx-auto max-w-6xl overflow-hidden px-5 py-20 md:py-28"
    >
      <FloatingParticles count={22} className="z-0" />

      <div className="relative z-10 grid items-center gap-12 md:grid-cols-2">
        {/* Left */}
        <div>
          {/* Badge */}
          <motion.div
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--bronze)]/30 bg-[var(--bronze)]/10 px-3 py-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.span
              className="h-2 w-2 rounded-full bg-[var(--bronze)]"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-xs font-semibold text-[var(--bronze)]">
              Acceso anticipado abierto
            </span>
          </motion.div>

          {/* Title — word stagger */}
          <motion.h1
            className="font-display text-5xl font-extrabold leading-tight text-[var(--text-primary)] md:text-[4.5rem]"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {words.map((word, i) => (
              <motion.span
                key={i}
                variants={fadeUp}
                className="mr-[0.2em] inline-block"
              >
                {word}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p
            className="mt-6 text-lg text-[var(--text-secondary)]"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, type: "spring", damping: 25 }}
          >
            {site.hero.subtitulo}
          </motion.p>

          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, type: "spring", damping: 25 }}
          >
            <WaitlistForm origen="hero" />
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              {site.hero.nota}
            </p>
          </motion.div>
        </div>

        {/* Right — Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, type: "spring", damping: 22, stiffness: 90 }}
        >
          <DashboardMock />
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify visually**

`pnpm dev` → `http://localhost:3000`. Hero title animates word by word, dashboard appears with 3D tilt on mouse move, particles float in background, badge pulses.

- [ ] **Step 3: Commit**

```bash
cd D:/juandiplay/aureo-landing && git add components/Hero.tsx && git commit -m "feat: redesign Hero with word stagger, dashboard mock, floating particles"
```

---

### Task 9: Rework ProblemSection

**Files:**
- Modify: `components/ProblemSection.tsx`

**Interfaces:**
- Consumes: `SectionHeading` from `@/components/ui/SectionHeading`; `fadeUp`, `staggerContainer`, `clipReveal`, `VIEWPORT` from `@/lib/motion`

- [ ] **Step 1: Replace ProblemSection.tsx entirely**

```tsx
// components/ProblemSection.tsx
"use client";
import { motion } from "motion/react";
import { site } from "@/content/site";
import { AlertTriangle, Search, Clock, Database } from "lucide-react";
import { fadeUp, staggerContainer, clipReveal, VIEWPORT } from "@/lib/motion";
import { SectionHeading } from "@/components/ui/SectionHeading";

const ICONS = [Search, AlertTriangle, Clock, Database];

export function ProblemSection() {
  return (
    <section className="bg-[var(--bg-navy)] py-24">
      <div className="mx-auto max-w-6xl px-5">
        <motion.span
          className="mb-3 inline-block text-sm font-semibold uppercase tracking-widest text-[var(--bronze)]"
          variants={clipReveal}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          El problema
        </motion.span>

        <SectionHeading light className="max-w-2xl">
          {site.problema.titulo}
        </SectionHeading>

        <motion.p
          className="mt-4 max-w-2xl text-[var(--text-cream)]/70"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {site.problema.intro}
        </motion.p>

        <motion.div
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {site.problema.items.map((it, i) => {
            const Icon = ICONS[i];
            return (
              <motion.div
                key={it.titulo}
                variants={fadeUp}
                whileHover={{ scale: 1.03, borderColor: "var(--terracotta)" }}
                className="cursor-default rounded-[var(--radius-md)] border border-[var(--text-cream)]/10 bg-[var(--text-cream)]/5 p-6 transition-colors"
              >
                <motion.div
                  whileHover={{ rotate: -10 }}
                  transition={{ duration: 0.3 }}
                  className="mb-3 w-fit"
                >
                  <Icon className="h-6 w-6 text-[var(--terracotta)]" />
                </motion.div>
                <h3 className="font-semibold text-[var(--text-cream)]">
                  {it.titulo}
                </h3>
                <p className="mt-2 text-sm text-[var(--text-cream)]/60">
                  {it.texto}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify visually**

Section is navy background, cards stagger in on scroll, icons tilt on hover, cards scale on hover.

- [ ] **Step 3: Commit**

```bash
cd D:/juandiplay/aureo-landing && git add components/ProblemSection.tsx && git commit -m "feat: animate ProblemSection with navy bg, stagger cards, icon hover"
```

---

### Task 10: Rework HowItWorks

**Files:**
- Modify: `components/HowItWorks.tsx`

**Interfaces:**
- Consumes: `SectionHeading`; `fadeUp`, `staggerContainer`, `VIEWPORT` from `@/lib/motion`; `useInView` from `motion/react`

- [ ] **Step 1: Replace HowItWorks.tsx entirely**

```tsx
// components/HowItWorks.tsx
"use client";
import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { site } from "@/content/site";
import { fadeUp, staggerContainer, VIEWPORT } from "@/lib/motion";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function HowItWorks() {
  const lineRef = useRef<HTMLDivElement>(null);
  const lineVisible = useInView(lineRef, { once: true, margin: "-100px" });

  return (
    <section id="como" className="py-24">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading className="text-center">
          {site.comoFunciona.titulo}
        </SectionHeading>

        {/* Desktop: grid with animated connecting line */}
        <div ref={lineRef} className="relative mt-16 hidden md:block">
          <motion.div
            className="absolute top-10 h-px bg-[var(--primary-soft)]/30 origin-left"
            style={{ left: "calc(16.67% + 2rem)", right: "calc(16.67% + 2rem)" }}
            initial={{ scaleX: 0 }}
            animate={lineVisible ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          />

          <motion.div
            className="grid gap-8 md:grid-cols-3"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
          >
            {site.comoFunciona.pasos.map((p, i) => (
              <motion.div
                key={p.titulo}
                variants={fadeUp}
                className="group relative text-center"
              >
                <motion.span
                  className="font-display font-extrabold leading-none text-[var(--primary-soft)] select-none"
                  style={{ fontSize: "8rem", opacity: 0.12 }}
                  whileHover={{ opacity: 0.38 }}
                  transition={{ duration: 0.3 }}
                >
                  {i + 1}
                </motion.span>
                <h3 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                  {p.titulo}
                </h3>
                <p className="mt-2 text-[var(--text-secondary)]">{p.texto}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Mobile: no line */}
        <motion.div
          className="mt-10 grid gap-8 md:hidden"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {site.comoFunciona.pasos.map((p, i) => (
            <motion.div key={p.titulo} variants={fadeUp}>
              <span
                className="font-display text-4xl font-extrabold text-[var(--primary-soft)]"
                style={{ opacity: 0.4 }}
              >
                {i + 1}
              </span>
              <h3 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                {p.titulo}
              </h3>
              <p className="mt-2 text-[var(--text-secondary)]">{p.texto}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify visually**

Steps animate in on scroll, connecting line draws left-to-right, number decoratives show on hover.

- [ ] **Step 3: Commit**

```bash
cd D:/juandiplay/aureo-landing && git add components/HowItWorks.tsx && git commit -m "feat: animate HowItWorks with drawing connector line and step stagger"
```

---

### Task 11: Rework ModuleCard + ModulesGrid

**Files:**
- Modify: `components/ModuleCard.tsx`
- Modify: `components/ModulesGrid.tsx`

**Interfaces:**
- Consumes: `fadeUp`, `staggerContainer`, `VIEWPORT` from `@/lib/motion`; `SectionHeading`

- [ ] **Step 1: Replace ModuleCard.tsx entirely**

```tsx
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
```

- [ ] **Step 2: Replace ModulesGrid.tsx entirely**

```tsx
// components/ModulesGrid.tsx
"use client";
import { motion } from "motion/react";
import { site } from "@/content/site";
import { ModuleCard } from "@/components/ModuleCard";
import { staggerContainer, fadeUp, VIEWPORT } from "@/lib/motion";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function ModulesGrid() {
  return (
    <section id="producto" className="bg-[var(--bg-subtle)] py-24">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading>
          Todo lo que tu negocio necesita, en un solo sistema.
        </SectionHeading>

        <motion.div
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {site.modulos.map((m) => (
            <motion.div key={m.id} variants={fadeUp}>
              <ModuleCard module={m} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verify visually**

Cards stagger in on scroll, 3D tilt on mouse move, icon scales + bronzes on hover, card shadow appears bronze-tinted.

- [ ] **Step 4: Commit**

```bash
cd D:/juandiplay/aureo-landing && git add components/ModuleCard.tsx components/ModulesGrid.tsx && git commit -m "feat: animate ModulesGrid with 3D tilt cards, icon hover, stagger entrance"
```

---

### Task 12: Rework DemoSection

**Files:**
- Modify: `components/DemoSection.tsx`

**Interfaces:**
- Consumes: `SectionHeading`; `fadeUp`, `VIEWPORT` from `@/lib/motion`

- [ ] **Step 1: Replace DemoSection.tsx entirely**

```tsx
// components/DemoSection.tsx
"use client";
import { motion } from "motion/react";
import { site } from "@/content/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { fadeUp, VIEWPORT } from "@/lib/motion";

export function DemoSection() {
  return (
    <section className="bg-[var(--bg-navy)] py-24">
      <div className="mx-auto max-w-6xl px-5 text-center">
        <SectionHeading light>{site.demo.titulo}</SectionHeading>

        <motion.p
          className="mx-auto mt-4 max-w-2xl text-[var(--text-cream)]/70"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {site.demo.texto}
        </motion.p>

        <motion.div
          className="mt-3 inline-flex items-center gap-2"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          <motion.span
            className="h-2 w-2 rounded-full bg-[var(--bronze)]"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-sm font-semibold text-[var(--bronze)]">
            Demo interactiva — próximamente
          </span>
        </motion.div>

        <motion.div
          className="shimmer-border mx-auto mt-10 flex aspect-video max-w-4xl items-center justify-center rounded-[var(--radius-lg)] bg-[var(--bg-navy)]"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          <span className="shimmer-text font-display text-xl font-bold">
            {site.demo.placeholder}
          </span>
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify visually**

Section is navy, shimmer border rotates around the demo container, text has golden shimmer.

- [ ] **Step 3: Commit**

```bash
cd D:/juandiplay/aureo-landing && git add components/DemoSection.tsx && git commit -m "feat: animate DemoSection with navy bg and shimmer border"
```

---

### Task 13: Rework FoundersStory

**Files:**
- Modify: `components/FoundersStory.tsx`

**Interfaces:**
- Consumes: `SectionHeading`; `fadeUp`, `staggerContainer`, `VIEWPORT` from `@/lib/motion`

- [ ] **Step 1: Replace FoundersStory.tsx entirely**

```tsx
// components/FoundersStory.tsx
"use client";
import { motion } from "motion/react";
import { site } from "@/content/site";
import { fadeUp, staggerContainer, VIEWPORT } from "@/lib/motion";
import { SectionHeading } from "@/components/ui/SectionHeading";

const NAME_CHARS = Array.from("Juan & Leif");

export function FoundersStory() {
  return (
    <section className="grain-texture relative overflow-hidden bg-[var(--bg-base)] py-24">
      <div className="relative z-10 mx-auto max-w-3xl px-5 text-center">
        {/* Rotating ring avatars */}
        <div className="mb-10 flex justify-center gap-6">
          {["J", "L"].map((initial) => (
            <div key={initial} className="relative h-16 w-16">
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-[var(--bronze)]"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              />
              <div className="absolute inset-1 flex items-center justify-center rounded-full bg-[var(--bg-subtle)]">
                <span className="font-display text-xl font-bold text-[var(--primary)]">
                  {initial}
                </span>
              </div>
            </div>
          ))}
        </div>

        <SectionHeading>{site.fundadores.titulo}</SectionHeading>

        <motion.p
          className="mt-5 text-lg leading-relaxed text-[var(--text-secondary)]"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {site.fundadores.texto}
        </motion.p>

        {/* Letter stagger name */}
        <motion.div
          className="mt-8 flex justify-center"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {NAME_CHARS.map((char, i) => (
            <motion.span
              key={i}
              variants={fadeUp}
              className="font-display text-xl font-bold text-[var(--bronze)]"
            >
              {char === " " ? " " : char}
            </motion.span>
          ))}
        </motion.div>

        <motion.p
          className="mt-6 text-sm uppercase tracking-widest text-[var(--text-muted)]"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {site.fundadores.socialProofPlaceholder}
        </motion.p>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify visually**

Grain texture visible on section, avatar rings rotate, "Juan & Leif" letters stagger in.

- [ ] **Step 3: Commit**

```bash
cd D:/juandiplay/aureo-landing && git add components/FoundersStory.tsx && git commit -m "feat: animate FoundersStory with grain, rotating rings, letter stagger"
```

---

### Task 14: Rework PricingCard + PricingTable

**Files:**
- Modify: `components/PricingCard.tsx`
- Modify: `components/PricingTable.tsx`

**Interfaces:**
- Consumes: `staggerContainer`, `fadeUp`, `VIEWPORT` from `@/lib/motion`; `SectionHeading`

- [ ] **Step 1: Replace PricingCard.tsx entirely**

```tsx
// components/PricingCard.tsx
"use client";
import { motion } from "motion/react";
import type { Plan } from "@/content/site";
import { VIEWPORT } from "@/lib/motion";

export function PricingCard({ plan, index = 0 }: { plan: Plan; index?: number }) {
  const hl = plan.destacado;

  return (
    <motion.div
      className={`rounded-[var(--radius-lg)] border p-8 ${
        hl
          ? "border-[var(--bronze)]/40 bg-[var(--bg-navy)] shadow-xl"
          : "border-[var(--border-subtle)] bg-[var(--bg-surface)]"
      }`}
      initial={{
        opacity: 0,
        x: hl ? 0 : index === 0 ? -60 : 60,
        y: hl ? -40 : 0,
      }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={VIEWPORT}
      transition={{
        type: "spring",
        damping: 25,
        stiffness: 100,
        delay: hl ? 0.15 : 0,
      }}
    >
      {hl && (
        <motion.span
          className="shimmer-btn relative mb-3 inline-block overflow-hidden rounded-full bg-[var(--bronze)] px-3 py-1 text-xs font-semibold text-white"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={VIEWPORT}
          transition={{ delay: 0.35 }}
        >
          Más popular
        </motion.span>
      )}

      <h3
        className={`font-display text-2xl font-bold ${
          hl ? "text-[var(--text-cream)]" : "text-[var(--text-primary)]"
        }`}
      >
        {plan.nombre}
      </h3>
      <p
        className={`mt-1 text-sm ${
          hl ? "text-[var(--text-cream)]/70" : "text-[var(--text-secondary)]"
        }`}
      >
        {plan.resumen}
      </p>
      <p className="mt-4">
        <span
          className={`font-display text-3xl font-extrabold ${
            hl ? "text-[var(--bronze)]" : "text-[var(--primary)]"
          }`}
        >
          {plan.precio}
        </span>
        <span
          className={
            hl ? "text-[var(--text-cream)]/60" : "text-[var(--text-secondary)]"
          }
        >
          {plan.periodo}
        </span>
      </p>

      <ul className="mt-6 space-y-3 text-sm">
        {plan.features.map((f, i) => (
          <motion.li
            key={f}
            className={`flex items-center gap-2 ${
              hl ? "text-[var(--text-cream)]/80" : "text-[var(--text-secondary)]"
            }`}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={VIEWPORT}
            transition={{ delay: 0.15 + i * 0.06 }}
          >
            <svg
              className="h-4 w-4 flex-shrink-0 text-[var(--emerald)]"
              viewBox="0 0 16 16"
              fill="none"
            >
              <motion.path
                d="M3 8L6.5 11.5L13 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={VIEWPORT}
                transition={{ delay: 0.3 + i * 0.06, duration: 0.3 }}
              />
            </svg>
            {f}
          </motion.li>
        ))}
      </ul>

      <a
        href="#waitlist"
        className={`mt-8 block rounded-[var(--radius-md)] py-3 text-center font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
          hl
            ? "glow-btn bg-[var(--bronze)] text-white hover:bg-[var(--bronze)]/90 focus-visible:ring-[var(--bronze)]"
            : "bg-[var(--primary)] text-white hover:bg-[var(--primary-strong)] focus-visible:ring-[var(--primary)]"
        }`}
      >
        {plan.cta}
      </a>
    </motion.div>
  );
}
```

- [ ] **Step 2: Replace PricingTable.tsx entirely**

```tsx
// components/PricingTable.tsx
"use client";
import { motion } from "motion/react";
import { site } from "@/content/site";
import { PricingCard } from "@/components/PricingCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { fadeUp, VIEWPORT } from "@/lib/motion";

export function PricingTable() {
  return (
    <section id="precios" className="py-24">
      <div className="mx-auto max-w-5xl px-5">
        <SectionHeading className="text-center">
          Un plan para cada etapa de tu negocio.
        </SectionHeading>

        <div className="mt-12 grid gap-6 md:grid-cols-2 md:items-start">
          {site.planes.map((p, i) => (
            <PricingCard key={p.nombre} plan={p} index={i} />
          ))}
        </div>

        <motion.p
          className="mt-6 text-center text-sm text-[var(--text-secondary)]"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {site.preciosNota}
        </motion.p>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verify visually**

Starter slides from left, Pro card drops from above, check marks draw themselves, Pro CTA glows.

- [ ] **Step 4: Commit**

```bash
cd D:/juandiplay/aureo-landing && git add components/PricingCard.tsx components/PricingTable.tsx && git commit -m "feat: animate PricingTable with directional entrances, path-draw checks, glow CTA"
```

---

### Task 15: Rework FAQ

**Files:**
- Modify: `components/FAQ.tsx`

**Interfaces:**
- Consumes: `staggerContainer`, `fadeUp`, `VIEWPORT` from `@/lib/motion`; `SectionHeading`

- [ ] **Step 1: Replace FAQ.tsx entirely**

```tsx
// components/FAQ.tsx
"use client";
import { motion } from "motion/react";
import { site } from "@/content/site";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { staggerContainer, fadeUp, VIEWPORT } from "@/lib/motion";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function FAQ() {
  return (
    <section id="faq" className="bg-[var(--bg-subtle)] py-24">
      <div className="mx-auto max-w-3xl px-5">
        <SectionHeading className="text-center">
          Preguntas frecuentes
        </SectionHeading>

        <motion.div
          className="mt-10"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          <Accordion>
            {site.faq.map((item, i) => (
              <motion.div key={i} variants={fadeUp}>
                <AccordionItem value={`item-${i}`}>
                  <AccordionTrigger className="text-left text-[var(--text-primary)] transition-all hover:translate-x-1.5">
                    {item.pregunta}
                  </AccordionTrigger>
                  <AccordionContent className="text-[var(--text-secondary)]">
                    {item.respuesta}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify visually**

FAQ items stagger in on scroll, trigger slides right on hover, accordion open/close is smooth (handled by shadcn).

- [ ] **Step 3: Commit**

```bash
cd D:/juandiplay/aureo-landing && git add components/FAQ.tsx && git commit -m "feat: animate FAQ with stagger entrance and hover slide"
```

---

### Task 16: Rework FinalCTA

**Files:**
- Modify: `components/FinalCTA.tsx`

**Interfaces:**
- Consumes: `FloatingParticles`; `clipReveal`, `fadeUp`, `VIEWPORT` from `@/lib/motion`; `SectionHeading`

- [ ] **Step 1: Replace FinalCTA.tsx entirely**

```tsx
// components/FinalCTA.tsx
"use client";
import { motion } from "motion/react";
import { site } from "@/content/site";
import { WaitlistForm } from "@/components/WaitlistForm";
import { FloatingParticles } from "@/components/ui/FloatingParticles";
import { fadeUp, VIEWPORT } from "@/lib/motion";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-[var(--bg-navy)] py-32">
      <FloatingParticles count={35} className="z-0" />

      {/* Breathing radial gradient */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(168,116,43,0.08) 0%, transparent 70%)",
        }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 mx-auto max-w-3xl px-5 text-center">
        <SectionHeading light>{site.finalCta.titulo}</SectionHeading>

        <motion.p
          className="mt-4 text-lg text-[var(--bronze)]"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {site.finalCta.texto}
        </motion.p>

        <motion.div
          className="mt-10 flex justify-center"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          <WaitlistForm origen="final" />
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify visually**

Navy section, particles float, radial gradient breathes, heading reveals with clip, form fades up.

- [ ] **Step 3: Commit**

```bash
cd D:/juandiplay/aureo-landing && git add components/FinalCTA.tsx && git commit -m "feat: animate FinalCTA with navy bg, particles, breathing radial gradient"
```

---

### Task 17: Rework Footer

**Files:**
- Modify: `components/Footer.tsx`

**Interfaces:**
- Consumes: `fadeUp`, `VIEWPORT` from `@/lib/motion`

- [ ] **Step 1: Replace Footer.tsx entirely**

```tsx
// components/Footer.tsx
"use client";
import { motion } from "motion/react";
import { site } from "@/content/site";
import { fadeUp, VIEWPORT } from "@/lib/motion";

const NAV_LINKS = [
  { label: "Producto", href: "#producto" },
  { label: "Cómo funciona", href: "#como" },
  { label: "Precios", href: "#precios" },
  { label: "Preguntas", href: "#faq" },
];

export function Footer() {
  return (
    <motion.footer
      className="border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)] py-12"
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 text-center">
        <span className="font-display text-xl font-extrabold text-[var(--primary)]">
          {site.marca}
        </span>
        <p className="text-sm text-[var(--text-secondary)]">{site.footer.tagline}</p>
        <nav className="flex flex-wrap justify-center gap-6 text-sm text-[var(--text-muted)]">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="link-underline transition-colors hover:text-[var(--primary)]"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <p className="text-xs text-[var(--text-muted)]">{site.footer.derechos}</p>
      </div>
    </motion.footer>
  );
}
```

- [ ] **Step 2: Full page visual QA**

Run `pnpm dev`, scroll through all sections and verify:
- [ ] Nav: stagger on load, scroll border, CTA shimmer
- [ ] Hero: word stagger, particles, dashboard 3D tilt, badge pulse
- [ ] ProblemSection: navy bg, card stagger, icon hover tilt
- [ ] HowItWorks: line draws, number decoratives, step stagger
- [ ] ModulesGrid: card tilt, icon hover, stagger
- [ ] DemoSection: navy bg, shimmer border rotates, shimmer text
- [ ] FoundersStory: grain texture, rotating rings, letter stagger
- [ ] PricingTable: directional entrances, check path-draw, glow CTA
- [ ] FAQ: stagger items, hover slide
- [ ] FinalCTA: navy, particles, breathing gradient, clip reveal
- [ ] Footer: fade up, link underlines

- [ ] **Step 3: Run TypeScript check**

```bash
cd D:/juandiplay/aureo-landing && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd D:/juandiplay/aureo-landing && git add components/Footer.tsx && git commit -m "feat: animate Footer with fadeUp and link underline CSS"
```

---

### Task 18: Final build verification

**Files:** none new

- [ ] **Step 1: Production build**

```bash
cd D:/juandiplay/aureo-landing && pnpm build
```

Expected: build completes with no errors. Warnings about `use client` boundaries are OK.

- [ ] **Step 2: Run existing tests**

```bash
cd D:/juandiplay/aureo-landing && pnpm test
```

Expected: all existing tests pass.

- [ ] **Step 3: Final commit**

```bash
cd D:/juandiplay/aureo-landing && git add -A && git commit -m "feat: complete Aureo Cinematic animation redesign"
```
