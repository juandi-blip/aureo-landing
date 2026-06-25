# Aureo Landing — Animation Redesign Design Spec
**Date:** 2026-06-25  
**Status:** Approved  
**Approach:** Enfoque A — "Aureo Cinematic"

---

## 1. Objetivo

Rediseño visual completo + animaciones cinematográficas sobre la paleta Aureo existente. La página debe generar un espectáculo inmersivo que atraiga y retenga al usuario. Identidad de marca (crema/navy/bronce) intacta. Sin cambio de fondo a dark — se logra el dramatismo con secciones alternas navy y motion pesado.

---

## 2. Stack técnico

| Librería | Versión | Uso |
|----------|---------|-----|
| `motion` | latest (Framer Motion v11) | Todas las animaciones JS |
| `tailwindcss` | v4 (ya instalado) | Estilos base |
| `tw-animate-css` | (ya instalado) | Utilidades CSS auxiliares |
| `lucide-react` | (ya instalado) | Íconos animados |

**Instalación nueva:** `pnpm add motion`

---

## 3. Sistema de design global

### Paleta extendida
```
--bg-base:        #F7F3EA  (crema — fondo primario)
--bg-surface:     #FFFFFF
--bg-subtle:      #EFE7D7
--bg-navy:        #1E3352  (navy fuerte — secciones alternas)
--primary:        #2E4A6E
--primary-soft:   #7BA3D0
--bronze:         #A8742B  (acento animado — glow, shimmer, particles)
--bronze-glow:    rgba(168,116,43,0.3)
--terracotta:     #A8442C
--emerald:        #5E7D52
--text-primary:   #241F1A
--text-cream:     #F7F3EA  (texto sobre navy)
```

### Tipografía
- Display (Syne): 72–80px en hero, 48–56px en section headings. `font-weight: 800`.
- Body (Inter): 16–18px, `font-weight: 400/500`.
- Decorativos: números 1/2/3 en Syne `120px`, `opacity: 0.12`, color `--primary-soft`.

### Sistema de motion (variantes reutilizables)
```ts
// lib/motion.ts
export const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 25, stiffness: 120 } }
}

export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
}

export const clipReveal = {
  hidden: { clipPath: "inset(100% 0 0 0)" },
  visible: { clipPath: "inset(0% 0 0% 0)", transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
}
```

**Viewport trigger:** `{ once: true, margin: "-100px" }` en todos los `whileInView`.

### Layout global
- `overflow-x: hidden` en `body`
- Secciones alternas: crema (`--bg-base`) ↔ navy (`--bg-navy`)
- Scrollbar personalizado: thumb bronce `#A8742B`, track crema

---

## 4. Componentes compartidos nuevos

### `lib/motion.ts`
Variantes exportadas: `fadeUp`, `fadeLeft`, `fadeRight`, `staggerContainer`, `clipReveal`, `tiltCard`.

### `components/ui/FloatingParticles.tsx`
- 25 partículas con posiciones x/y aleatorias (generadas en `useEffect` para evitar hydration mismatch)
- Cada partícula: `div` 2–6px, `background: --bronze`, `border-radius: 50%`, `opacity: 0.3–0.6`
- Animación: `y: [0, -20, 0]`, `opacity: [0.3, 0.7, 0.3]`, duration: 3–7s aleatorio, `repeat: Infinity`
- Props: `count`, `className`, `color`

### `components/ui/SectionHeading.tsx`
- `clipReveal` animation con `whileInView`
- Acepta `light` prop para texto crema (sobre navy)

### `components/ui/AnimatedNumber.tsx`
- CountUp con `useEffect + requestAnimationFrame`
- Props: `from`, `to`, `duration`, `prefix`, `suffix`, `decimals`

---

## 5. Secciones — diseño detallado

### 5.1 Nav
**Layout:** Sticky top, `backdrop-blur-md`, `bg-[--bg-base]/85`, `border-b border-[--border-subtle]/0 → /100` al scroll.

**Animaciones:**
- Mount: logo `x: -20, opacity: 0 → 0, 1` (0.4s)
- Links: `staggerContainer` con `fadeUp` (delay 0.2s)
- CTA button: shimmer dorado — pseudo-element `::after` con `background: linear-gradient(90deg, transparent, rgba(168,116,43,0.4), transparent)` animado en `translateX: -100% → 100%` cada 3s en loop

**Scroll behavior:** `useScroll` → `useMotionValueEvent` → `scrolled: boolean` state → aplica border y fondo más opaco.

---

### 5.2 Hero
**Layout:** `min-h-screen`, grid 50/50 desktop, stack mobile. Fondo crema con partículas.

**Izquierda:**
- `<FloatingParticles count={20} />` en absolute, z-0
- Badge "Acceso anticipado" pill con dot bronce pulsante
- Título Syne 72px: cada palabra en `<motion.span>` con `fadeUp` stagger 0.08s
- Subtítulo: `fadeUp` delay 0.6s
- WaitlistForm: `fadeUp` delay 0.8s
- Nota: `fadeUp` delay 1.0s

**Derecha — Dashboard Mock:**
- Contenedor: `perspective: 1200px`, `rotateX: 5deg, rotateY: -5deg` base
- `useMotionValue(x/y)` + `useSpring` para parallax 3D en mouse move (±8deg)
- Ventana estilo macOS: barra superior crema oscuro con 3 dots (rojo/amarillo/verde), título "Panel Aureo"
- Contenido mock:
  - 3 metric cards: `<AnimatedNumber>` (847 productos, $12.4M, 98.2%)
  - Mini SVG chart con `strokeDashoffset` animado al mount (500ms delay)
  - Badge "● En vivo" con dot verde pulsante (`scale: 1→1.5→1`, `opacity: 1→0.5→1`, 1.5s loop)
  - Tabla con 3 productos ficticios, fade-in row by row

---

### 5.3 ProblemSection
**Fondo:** `--bg-navy` (#1E3352) — primera sección oscura.

**Animaciones:**
- Eyebrow "El problema" en bronce: `clipReveal`
- Título crema Syne 48px: `clipReveal` con delay 0.2s
- Intro: `fadeUp` delay 0.4s
- 4 cards crema: `staggerContainer` con `fadeUp`, stagger 0.12s
  - Card fondo: `rgba(247,243,234,0.06)`, border `rgba(247,243,234,0.12)`
  - Hover: `scale: 1.03`, `border-color: --terracotta`, `shadow-lg`
  - Ícono terracota: `rotate: 0→-10→0` en hover (Lucide `AlertTriangle`, `Search`, `Clock`, `Database`)

---

### 5.4 HowItWorks
**Fondo:** crema (`--bg-base`).

**Layout:** 3 columnas desktop. Línea SVG horizontal conectando los números (desktop only).

**Animaciones:**
- SVG connecting line: `pathLength: 0→1` con `useInView` trigger, duration 1.2s ease-out
- Número decorativo (Syne 120px, navy 12% opacity): `scale: 0.8, opacity: 0 → 1, 0.12` stagger
- Cada paso: `fadeUp` stagger 0.15s
- Número decorativo: en hover del step padre, sube a `opacity: 0.35` con 300ms transition

---

### 5.5 ModulesGrid
**Fondo:** `--bg-subtle` (#EFE7D7).

**Layout:** grid `2-3-2` o `3+2` centered. 5 cards.

**Animaciones:**
- Card 3D tilt: `useMotionValue(rotateX, rotateY)` ±8deg en mouse enter/leave, spring reset
- Card borde sweep: pseudo-element con `background: conic-gradient(--bronze, transparent)` animado en hover (opacity 0→1, 400ms)
- Ícono Lucide: `scale: 1→1.2`, `color: --text-muted → --bronze` en hover
- Grid entrada: `staggerContainer`, cards `fadeUp` stagger 0.1s

---

### 5.6 DemoSection
**Fondo:** `--bg-navy`.

**Layout:** Contenedor centrado con ratio 16:9.

**Animaciones:**
- Contenedor borde shimmer: `@property --angle` CSS, `border: 2px solid`, `background: conic-gradient(from var(--angle), --bronze, transparent, --bronze)` rotando 360° en 3s loop
- Texto "Demo próximamente": shimmer dorado — `background-clip: text`, gradiente animado
- Badge "Demo interactiva": pulse bronce

**Nota:** Cuando haya video real, el contenedor lo recibe sin cambios adicionales.

---

### 5.7 FoundersStory
**Fondo:** crema con grain texture (SVG `feTurbulence` filter, 3% opacity en pseudo-element).

**Animaciones:**
- Avatares (círculo con ring bronce girando): `rotate: 0→360` en 8s loop linear
- Quote Syne 32px itálica: `clipReveal`
- Nombres "Juan & Leif": `Array.from("Juan & Leif")` → cada letra en `<motion.span>` con `fadeUp` stagger 0.03s
- Social proof placeholder: `fadeUp` delay 0.6s

---

### 5.8 PricingTable
**Fondo:** `--bg-subtle`.

**Layout:** 2 cards. Pro card: `scale: 1.04` base, `z-index: 10`, fondo navy, badge "Más popular".

**Animaciones:**
- Starter card: `x: -60, opacity: 0 → 0, 1`
- Pro card: `y: -40, opacity: 0 → 0, 1` (delay 0.15s)
- Badge "Más popular": shimmer bronce loop
- Feature list items: stagger `fadeUp` 0.05s cada uno
- Check SVG: `pathLength: 0→1` stagger (0.05s) al entrar viewport
- Toggle mensual/anual: `AnimatePresence` + precio con `y: -20, opacity:0 → 0,1` salida/entrada

---

### 5.9 FAQ
**Fondo:** `--bg-base`.

**Layout:** Lista de accordions, max-width 760px centrado.

**Animaciones:**
- Entrada items: `staggerContainer + fadeUp`
- Accordion open: `motion.div` con `height: 0 → "auto"`, `overflow: hidden`, spring suave
- Chevron: `rotate: 0 → 180` con `motion` en el estado open
- Hover pregunta: `x: 0 → 6` slide leve

---

### 5.10 FinalCTA
**Fondo:** `--bg-navy` con `<FloatingParticles count={35} color="bronze" />`.

**Layout:** Centrado, padding vertical 120px.

**Animaciones:**
- Gradiente radial de fondo que "respira": `scale: 1→1.1→1`, `opacity: 0.04→0.08→0.04`, 4s loop
- Título Syne 80px crema: `clipReveal`
- Subtítulo bronce: `fadeUp` delay 0.3s
- CTA button: glow pulsante — `box-shadow: 0 0 0 0 --bronze-glow → 0 0 30px 10px --bronze-glow` en 2s loop, + ripple en click

---

### 5.11 Footer
**Fondo:** `--bg-subtle`.

**Animaciones:**
- Todo el footer: `fadeUp` al entrar viewport
- Links: underline que crece desde izquierda — `::after` con `scaleX: 0→1, transform-origin: left` en hover (CSS puro, 250ms)

---

## 6. Archivos a crear/modificar

| Acción | Archivo |
|--------|---------|
| NUEVO | `lib/motion.ts` |
| NUEVO | `components/ui/FloatingParticles.tsx` |
| NUEVO | `components/ui/SectionHeading.tsx` |
| NUEVO | `components/ui/AnimatedNumber.tsx` |
| NUEVO | `components/ui/DashboardMock.tsx` |
| MODIFICAR | `app/globals.css` (scrollbar, grain, @property) |
| MODIFICAR | `components/Nav.tsx` |
| MODIFICAR | `components/Hero.tsx` |
| MODIFICAR | `components/ProblemSection.tsx` |
| MODIFICAR | `components/HowItWorks.tsx` |
| MODIFICAR | `components/ModulesGrid.tsx` |
| MODIFICAR | `components/DemoSection.tsx` |
| MODIFICAR | `components/FoundersStory.tsx` |
| MODIFICAR | `components/PricingTable.tsx` |
| MODIFICAR | `components/FAQ.tsx` |
| MODIFICAR | `components/FinalCTA.tsx` |
| MODIFICAR | `components/Footer.tsx` |

---

## 7. Constrains técnicas

- `"use client"` en todos los componentes que usen hooks de Framer Motion o `useEffect`
- Generar posiciones de partículas en `useEffect` (no en render) para evitar hydration mismatch SSR
- `useReducedMotion()` check en `lib/motion.ts` — si está activo, reducir a `opacity: 0→1` simple sin transforms
- Todos los `whileInView` con `once: true` para no re-animar en scroll up
- Imágenes: si hay avatares o fotos reales, usar `next/image`

---

## 8. Fuera de alcance

- Cambio de contenido en `content/site.ts` (solo animaciones y layout)
- Backend / Supabase / waitlist logic (no se toca)
- Tests E2E (se dejan los existentes; no se agregan nuevos en este ciclo)
- Dark mode toggle (no aplica en este diseño)
