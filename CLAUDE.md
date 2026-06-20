# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A multi-page marketing site for **Kaivex AI** — an AI software-development studio. Spanish-language copy. It is a **Vite + React (JSX) single-page app** with client-side routing (React Router), designed to deploy to **Vercel** (or any static host). The brand was renamed from "Saas" to "Kaivex AI"; the term "SaaS" (software-as-a-service) in copy is unrelated and stays.

> **History:** this started as a no-build static site (multiple `.html` files, vanilla JS modules, React/Babel from CDN). In June 2026 it was migrated to Vite + React. The interactive canvas/scroll pieces were **wrapped, not rewritten** — their logic lives in `src/lib/*.js` as framework-agnostic `init()` functions that React components call from `useEffect`.

### Commands
- `pnpm dev` — Vite dev server (HMR) at `http://localhost:5173`.
- `pnpm build` — production build to `dist/`.
- `pnpm preview` — serve the built `dist/` locally.
- Package manager: **pnpm** (migrated from npm June 2026). Lockfile: `pnpm-lock.yaml`.
- Unit tests for pure logic run on the Node built-in runner: `node --test src/lib/sim.test.mjs` (no test framework installed). No linter configured.

### Routing & pages
One entry (`index.html` → `src/main.jsx`). `createBrowserRouter` mounts `<App>` (shared chrome) with these child routes, each a page component in `src/pages/`:
- **`/`** → `Home.jsx` — flagship "live showcase": hero + AI strip, proof, interactive architecture diagram, services teaser (with mini-node canvases), estimator (feeds the diagram), cases teaser, CTA.
- **`/servicios`** → `Servicios.jsx` — the services in depth (M-01…M-06) + build-a-saas scroll sequence + tech stack grid.
- **`/metodo`** → `Metodo.jsx` — principles manifesto, AI-per-phase, process timeline (`#proceso`), engineering values.
- **`/casos`** → `Casos.jsx` — metric-led cases grid + detailed case studies.
- **`/contacto`** → `Contacto.jsx` — about the studio + contact form.

`vercel.json` rewrites all paths to `/index.html` so deep links / reloads work with client-side routing.

## Architecture

### Shared chrome — `src/App.jsx`
`App` is the router layout: it renders `<BlueprintBackground>`, `<Nav>`, `<main><Outlet/></main>`, `<Footer>`, and owns a per-navigation `useEffect` (keyed on `location.pathname`/`hash`) that **re-runs the reveal-on-scroll scan** and handles scroll (to top, or to the `#hash` anchor). Nav/Footer/background persist across routes; only the `<Outlet>` content swaps.

### Components — `src/components/`
- **`Nav.jsx` / `Footer.jsx` / `Wordmark.jsx`** — chrome. Nav uses `<NavLink>` (active link gets `aria-current="page"` automatically, which the CSS targets) and owns the mobile-menu state + sticky-on-scroll effect.
- **`BlueprintBackground.jsx`** — renders `#bp-canvas` + `#cursor-halo`, runs `initBlueprint()` once.
- **`Diagram.jsx`, `AiStrip.jsx`, `BuildSaas.jsx`, `Estimator.jsx`** — each renders the exact markup (with the IDs the module expects) and calls its `init*()` from `useEffect`. These are the **wrapped vanilla modules**.
- **`CasesGrid.jsx`** — the one piece **rewritten as idiomatic React** (data array + `useState` filter); takes a `heading` prop, used on both Home and Casos.
- **`ContactForm.jsx`** — also rewritten as React (`onSubmit` + state). Set `FORM_ACTION` to a real Formspree endpoint to go live; while it contains `your-form-id` it stays in demo mode.

### The wrapped vanilla modules — `src/lib/`
Each exports an `init…()` that finds its DOM by id, bails (`return () => {}`) if absent, respects `prefers-reduced-motion`, and **returns a cleanup function**. Cleanup uses an `AbortController` (`addEventListener(..., { signal })`) plus `cancelAnimationFrame`/`clear*` so React can tear them down on unmount/route-change without leaking listeners or rAF loops. Components call them as `useEffect(() => initX(), [])`.
- **`blueprint.js`** — living-blueprint grid canvas + cursor parallax/halo.
- **`diagram.js`** — draggable/wireable architecture diagram on `#arch-canvas`; valid `LINKS` snap and animate packets; updates the latency/cost HUD; auto-demos after 4s; accessible table fallback. **Exposes `window.__archDemo.wire(list)`** so the estimator can push an architecture into it; cleanup deletes it.
- **`aiStrip.js`** — fake live "AI engine" in the hero; pre-scripted char-by-char streaming. 100% front-end, no API.
- **`buildSaas.js`** — scroll-driven "build a SaaS" sticky sequence (stages 0→3).
- **`estimator.js`** — 4-question quiz → price range + phased plan; calls `window.__archDemo.wire()`. **Coupling:** estimator and diagram must be on the same page — both are on Home.
- **`reveal.js`** — reveal-on-scroll (`.reveal` → `.in`); called by `App` per navigation.
- **`miniNodes.js`** — the mini-node canvases in the Home service cards. Dispatches by `data-mini`: most cards draw triangulated nodes + a travelling packet; `data-mini="sci"` (M-05) draws a **damped-sine curve** with a travelling dot.
- **`particles.js`** — a field of small colored dashes (Antigravity-style "liftoff field") in the blue/violet signal palette, drawn on `#hero-particles`. **Superseded as the Home hero signature by `woven.js`** but kept available.
- **`woven.js`** — the current Home hero **signature**: a Three.js particle field (~18k points sampled on a `TorusKnotGeometry`), tinted blue→violet, slow rotation + soft cursor repulsion. Wrapped by `components/WovenHero.jsx`. Cleanup disposes geometry/material/renderer + AbortController.
- **`sim.js`** — **pure, DOM-free** RK4 integrator for a damped harmonic oscillator (`deriv`, `rk4Step`, `simulate`). Unit-tested in `sim.test.mjs` via the Node built-in runner (`node --test src/lib/sim.test.mjs`). Powers the interactive `components/SciSim.jsx` on the Casos scientific case study.
- **`motion.jsx`** — centralised framer-motion primitives: named variants (`charVHero`, `charVPage`, `fadeUp`, `fadeIn`, `slideLeft`, `scaleIn`), a `stagger()` factory, and the `chars(str, variant, offset)` helper that splits a string into per-character `<motion.span>` elements with staggered custom delays. **Use these instead of authoring one-off variants** so timing stays consistent across the site.

### Hooks — `src/hooks/`
- **`usePageMeta(title, description)`** — updates `<title>` and all `og:*`/`twitter:*` meta tags imperatively on each route change. Call it at the top of every page component so social shares and browser tabs stay accurate (the SPA never does a full HTML reload).

### Why no `<React.StrictMode>`
`main.jsx` intentionally omits StrictMode: its dev-only double-invocation of effects would re-initialize the canvas/scroll modules (duplicate rAF loops and listeners). The modules each return cleanup, but skipping StrictMode keeps init single and predictable.

## Styling — `src/styles/` (dark premium theme)
Four stylesheets imported by `main.jsx` in order (**base → sections → extras → pages**); Vite bundles them preserving that order.

The site uses a **dark premium, Linear-style palette** (near-black canvas, blue→violet glow), in an **Antigravity-style** layout (centred hero, big type, lots of whitespace, pill buttons). Re-themed from the earlier AUREO light/cream look to dark premium in June 2026.
- **`base.css`** — design tokens, reset, typography, utilities. Tokens are named **by intent, not by value** — reuse them, never hard-code hex. Key values: canvas `--ink-900: #0a0b0f`, cards `--ink-820: #13151c`, elevated/hover `--ink-780: #181b24`, text `--bone: #e8eaf0` (dim `--bone-dim: #a3acbf`, faint `--bone-faint: #6b7488`), **signal `--signal: #5b8cff` (blue)** + `--signal-soft: #6f4fff` (violet) + `--signal-gradient` (`#3a6df0 → #5b8cff → #6f4fff`), hairlines `--line`/`--line-strong` (white at low alpha), premium rounded `--r-*` (pills via `--r-pill`). Fonts: **Inter Tight** (`--font-display`, headings), **Outfit** (`--font-body`), **JetBrains Mono** (`--font-mono`) — loaded in `index.html`. Buttons are pills.
- **`sections.css`** — per-section layout incl. `.nav` (centred links), `.foot`, `.blueprint-bg`, `.cursor-halo`, and the **centred hero** (`.hero-woven` + `.hero-woven-canvas` for the Three.js signature, `.hero-inner`, `.hero-engine`).
- **`extras.css`** — build-a-saas mock internals + hero treatments.
- **`pages.css`** — sub-page chrome (mobile nav, `.page-head`) and components incl. `.tick-list`, `.svc-*`, `.stack-grid`, `.case-study`, `.contact-*`, and `.tech-logos` (the "construido con" brand-logo strip).

The signal accent is `var(--signal*)`; author against the variables, never hard-coded hex. When adapting canvas modules, their colors are hard-coded in the JS — keep them in sync with the dark theme (light marks on dark, blue/violet signal: `#5b8cff`, text `#e8eaf0`, cards `#13151c`/`#181b24`).

### Magic MCP components
`TechLogos.jsx` is the brand-logo strip on Servicios. Logos came from the **Magic MCP** `logo_search` (Docker, Redis, Python, Tailwind), cleaned to JSX with namespaced gradient ids; React + TypeScript are hand-drawn (Magic's DB lacked them). Magic outputs Tailwind by default — this project is plain CSS, so Magic builder output must be adapted to the token system.

## Conventions
- Comments and UI copy are in Spanish; match that when editing.
- Internal navigation uses React Router `<Link>`/`<NavLink>` (`to="/servicios"`, `to="/#estimador"`). Same-page anchors (`#proceso`, `#stack`, …) stay as plain `<a href="#…">`. `mailto:` stays a plain anchor.
- Each `src/lib` module keeps its banner comment and the `init()` + cleanup contract — preserve it for any new wrapped module.
- Canvas work assumes `dpr = Math.min(devicePixelRatio, 2)` and must degrade under `prefers-reduced-motion`.
- `framer-motion` is installed and available if you want motion in new components, but the existing reveal animations are CSS-driven.
