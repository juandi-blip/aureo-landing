# Kaivex AI — Rediseño Multi-Agente: Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar el sitio completo de Kaivex AI fusionando la estética de EinCode (glassmorphism, terminal hero, cursor glow) y COMPUTE (hero 2 columnas, tipografía ghost, steps editoriales) manteniendo la identidad dark blue/violet del proyecto.

**Architecture:** Wave 1 (Diseño, Opus) define el sistema visual y produce `fusion-tokens.css` como contrato. Wave 2 (4 agentes paralelos: Marketing/Sonnet, SEO/Haiku, Seguridad/Opus, Deploy/Haiku) consumen ese contrato. Wave 3 (Integrador/Sonnet) fusiona conflictos, verifica build y hace deploy.

**Tech Stack:** Vite + React JSX, pnpm, React Router v6, Three.js (`woven.js`), CSS custom properties, Vercel.

## Global Constraints

- Stack: Vite + React JSX. NO migrar a Next.js.
- Package manager: pnpm. NO usar npm.
- No reescribir módulos `src/lib/*.js` — solo cambiar markup envolvente.
- No agregar Tailwind — sistema de tokens CSS existente en `src/styles/`.
- Copy siempre en español. Terminología técnica exacta.
- Sin `<React.StrictMode>` — documentado en CLAUDE.md, rompe canvas double-invoke.
- Canvas modules mantienen contrato `init() → cleanup fn` con AbortController.
- Paleta: `--ink-900 #0a0b0f`, `--signal #5b8cff`, `--signal-soft #6f4fff`. No hard-code hex.
- Modelos: Opus=Diseño+Seguridad, Sonnet=Marketing+Integrador, Haiku=SEO+Deploy.

---

## WAVE 1 — Agente Diseño `[claude-opus-4-8]`

### Task 1: Crear `src/styles/fusion-tokens.css`

**Files:**
- Create: `src/styles/fusion-tokens.css`
- Modify: `src/main.jsx` (agregar import)

**Interfaces:**
- Produce: variables CSS consumidas por todos los agentes Wave 2 y los estilos de Wave 1

- [ ] **Step 1: Crear el archivo de tokens**

```css
/* src/styles/fusion-tokens.css */
/* Contrato de diseño — Wave 1 produce, Wave 2 consume */

:root {
  /* Glassmorphism */
  --glass-bg: color-mix(in oklch, var(--ink-820) 60%, transparent);
  --glass-blur: blur(12px) saturate(1.5);
  --glass-border: 1px solid var(--line);

  /* Border glow */
  --border-glow-color: var(--signal);
  --border-glow-color-soft: var(--signal-soft);

  /* Scanlines */
  --scanline-opacity: 0.015;
  --scanline-size: 6px;

  /* Cursor glow */
  --cursor-glow-size: 420px;
  --cursor-glow-color: color-mix(in oklch, var(--signal) 15%, transparent);

  /* Hero layout */
  --hero-cols: 1fr 1fr;
  --hero-gap: 4rem;

  /* Stats strip */
  --stats-gap: 3rem;
  --stats-divider: var(--line);

  /* Editorial steps */
  --step-divider-color: var(--line-strong);
  --step-number-color: var(--bone-faint);

  /* Ghost typography */
  --ghost-text-color: color-mix(in oklch, var(--bone) 35%, transparent);

  /* Hover lift */
  --lift-distance: -4px;
  --lift-shadow: 0 12px 40px -8px color-mix(in oklch, #000 40%, transparent);

  /* Float badge */
  --float-duration: 4s;
}
```

- [ ] **Step 2: Importar en `src/main.jsx`**

Abrir `src/main.jsx`. Agregar el import después de los estilos existentes:

```jsx
import './styles/base.css'
import './styles/sections.css'
import './styles/extras.css'
import './styles/pages.css'
import './styles/fusion-tokens.css'  // ← agregar esta línea
```

- [ ] **Step 3: Verificar que el dev server no rompe**

```bash
pnpm dev
```
Esperado: servidor inicia en `http://localhost:5173` sin errores. El sitio se ve igual (tokens aún no usados).

- [ ] **Step 4: Commit**

```bash
git add src/styles/fusion-tokens.css src/main.jsx
git commit -m "feat: add fusion design tokens contract for multi-agent redesign"
```

---

### Task 2: Extender `base.css` con clases utilitarias del sistema fusionado

**Files:**
- Modify: `src/styles/base.css`

**Interfaces:**
- Produce: `.glass`, `.glass-strong`, `.border-glow`, `.scanlines`, `.hover-lift`, `.animate-float`, `.step-divider`, `.ghost-text`, stagger classes `.stagger-1`…`.stagger-6`

- [ ] **Step 1: Agregar al final de `src/styles/base.css`**

```css
/* ── Glassmorphism ─────────────────────────────── */
.glass {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: var(--glass-border);
}

.glass-strong {
  background: color-mix(in oklch, var(--ink-820) 80%, transparent);
  backdrop-filter: blur(20px) saturate(1.8);
  -webkit-backdrop-filter: blur(20px) saturate(1.8);
  border: var(--glass-border);
}

/* ── Border glow on hover ──────────────────────── */
.border-glow {
  position: relative;
}
.border-glow::before {
  content: "";
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  background: linear-gradient(
    135deg,
    var(--border-glow-color) 0%,
    transparent 40%,
    transparent 60%,
    var(--border-glow-color-soft) 100%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: -1;
}
.border-glow:hover::before { opacity: 0.5; }

/* ── Scanlines texture ─────────────────────────── */
.scanlines {
  position: relative;
}
.scanlines::after {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent calc(var(--scanline-size) - 2px),
    color-mix(in oklch, #000 var(--scanline-opacity), transparent) calc(var(--scanline-size) - 2px),
    color-mix(in oklch, #000 var(--scanline-opacity), transparent) var(--scanline-size)
  );
  pointer-events: none;
  z-index: 1;
}

/* ── Hover lift ────────────────────────────────── */
.hover-lift {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.hover-lift:hover {
  transform: translateY(var(--lift-distance));
  box-shadow: var(--lift-shadow);
}

/* ── Ghost typography ──────────────────────────── */
.ghost-text {
  color: var(--ghost-text-color);
}

/* ── Editorial step divider ────────────────────── */
.step-divider {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.step-divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--step-divider-color);
}
.step-number {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--step-number-color);
  letter-spacing: 0.1em;
}

/* ── Float badge ───────────────────────────────── */
@keyframes float-badge {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-8px); }
}
.animate-float {
  animation: float-badge var(--float-duration) ease-in-out infinite;
}

/* ── Stagger animation delays ──────────────────── */
.stagger-1 { animation-delay: 0.1s; opacity: 0; animation-fill-mode: forwards; }
.stagger-2 { animation-delay: 0.2s; opacity: 0; animation-fill-mode: forwards; }
.stagger-3 { animation-delay: 0.3s; opacity: 0; animation-fill-mode: forwards; }
.stagger-4 { animation-delay: 0.4s; opacity: 0; animation-fill-mode: forwards; }
.stagger-5 { animation-delay: 0.5s; opacity: 0; animation-fill-mode: forwards; }
.stagger-6 { animation-delay: 0.6s; opacity: 0; animation-fill-mode: forwards; }

@keyframes fade-up {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-up { animation: fade-up 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
```

- [ ] **Step 2: Verificar en dev server**

```bash
pnpm dev
```
Abrir DevTools → Elements → agregar clase `.glass` manualmente a un card y confirmar efecto.

- [ ] **Step 3: Commit**

```bash
git add src/styles/base.css
git commit -m "feat: add glassmorphism, border-glow, scanlines and editorial step utilities"
```

---

### Task 3: Refactorizar hero `Home.jsx` a layout 2 columnas

**Files:**
- Modify: `src/pages/Home.jsx`
- Modify: `src/styles/sections.css` (hero grid)

**Interfaces:**
- Consume: `WovenHero` (existente en `src/components/WovenHero.jsx`), `AiStrip` (existente)
- Produce: hero con columna izquierda (texto + stats) y columna derecha (canvas Three.js + terminal)

- [ ] **Step 1: Agregar grid hero en `sections.css`**

Buscar la sección `.hero-woven` en `src/styles/sections.css` y reemplazar/extender:

```css
/* Hero 2 columnas — layout fusionado */
.hero-fusion {
  display: grid;
  grid-template-columns: var(--hero-cols);
  gap: var(--hero-gap);
  align-items: center;
  min-height: 90vh;
  padding: 6rem 2rem 4rem;
  max-width: 1280px;
  margin: 0 auto;
}

.hero-fusion__left {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  z-index: 1;
}

.hero-fusion__right {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.hero-fusion__canvas-wrap {
  position: relative;
  height: 420px;
  border-radius: var(--r-xl);
  overflow: hidden;
  border: var(--glass-border);
}

.hero-fusion__stats {
  display: flex;
  gap: var(--stats-gap);
  padding-top: 2rem;
  border-top: 1px solid var(--stats-divider);
}

.hero-stat__value {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 700;
  color: var(--bone);
  line-height: 1;
}

.hero-stat__label {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--bone-faint);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-top: 0.25rem;
}

.hero-eyebrow {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.25em;
  color: var(--signal);
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.hero-eyebrow::before {
  content: "";
  width: 2rem;
  height: 1px;
  background: var(--signal);
}

.hero-ghost-line {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 700;
  line-height: 1.1;
  color: var(--ghost-text-color);
}

.hero-title-line {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 700;
  line-height: 1.1;
  color: var(--bone);
}

@media (max-width: 900px) {
  .hero-fusion {
    grid-template-columns: 1fr;
    min-height: auto;
    padding: 5rem 1.25rem 3rem;
  }
  .hero-fusion__canvas-wrap { height: 280px; }
}
```

- [ ] **Step 2: Actualizar JSX del hero en `Home.jsx`**

Localizar la sección hero actual (buscar `<section` con clase `hero` o similar). Reemplazar con:

```jsx
{/* Hero fusionado */}
<section className="hero-fusion">
  {/* Columna izquierda */}
  <div className="hero-fusion__left animate-fade-up stagger-1">
    <p className="hero-eyebrow">Estudio de desarrollo de software con IA</p>

    <div>
      <h1 className="hero-title-line">Software que</h1>
      <span className="hero-ghost-line">piensa solo.</span>
    </div>

    <p className="body-lg" style={{ color: 'var(--bone-dim)', maxWidth: '42ch' }}>
      Construimos productos digitales con agentes de IA — desde el prototipo hasta producción.
      Rápido, preciso, sin fricción.
    </p>

    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <a href="#estimador" className="btn btn-primary">Estimar mi proyecto</a>
      <a href="/casos" className="btn btn-ghost">Ver casos reales</a>
    </div>

    {/* Stats strip */}
    <div className="hero-fusion__stats animate-fade-up stagger-3">
      <div>
        <div className="hero-stat__value">3×</div>
        <div className="hero-stat__label">más rápido con IA</div>
      </div>
      <div>
        <div className="hero-stat__value">+40</div>
        <div className="hero-stat__label">proyectos entregados</div>
      </div>
      <div>
        <div className="hero-stat__value">100%</div>
        <div className="hero-stat__label">en producción</div>
      </div>
    </div>
  </div>

  {/* Columna derecha */}
  <div className="hero-fusion__right animate-fade-up stagger-2">
    <div className="hero-fusion__canvas-wrap">
      <WovenHero />
    </div>
    <AiStrip />
  </div>
</section>
```

- [ ] **Step 3: Verificar en dev server — hero 2 columnas visible**

```bash
pnpm dev
```
Abrir `http://localhost:5173`. Confirmar: texto izquierda, Three.js derecha, stats strip al pie izquierdo. Mobile: columna única.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Home.jsx src/styles/sections.css
git commit -m "feat: hero layout 2 columns with ghost typography and stats strip"
```

---

### Task 4: Actualizar cards de servicios con glassmorphism + miniNodes

**Files:**
- Modify: `src/pages/Home.jsx` (cards sección servicios)
- Modify: `src/styles/pages.css` (`.svc-*` clases)

**Interfaces:**
- Consume: `.glass`, `.border-glow`, `.hover-lift` (Task 2), `miniNodes.js` (existente)

- [ ] **Step 1: Actualizar clases en las cards `.svc-*` de `pages.css`**

Buscar `.svc-card` o el selector equivalente. Agregar/reemplazar:

```css
.svc-card {
  position: relative;
  border-radius: var(--r-xl);
  padding: 2rem;
  overflow: hidden;
  /* glassmorphism + border-glow heredados via clases */
}

.svc-card__canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0.35;
  pointer-events: none;
}

.svc-card__content {
  position: relative;
  z-index: 1;
}
```

- [ ] **Step 2: Agregar clases a las cards en `Home.jsx`**

En cada `<div>` de card de servicio, agregar `glass border-glow hover-lift`:

```jsx
<div className="svc-card glass border-glow hover-lift">
  <canvas className="svc-card__canvas" data-mini="nodes" />
  <div className="svc-card__content">
    {/* contenido existente */}
  </div>
</div>
```

- [ ] **Step 3: Verificar que `miniNodes.js` sigue inicializando los canvas**

`miniNodes.js` busca elementos con `[data-mini]`. Confirmar que el atributo `data-mini` en los canvas nuevos coincide con los valores existentes en el código (`nodes`, `api`, `db`, `ml`, `sci`, `deploy`).

- [ ] **Step 4: Verificar en dev server**

```bash
pnpm dev
```
Cards de servicios deben mostrar glass blur + partículas animadas de fondo.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Home.jsx src/styles/pages.css
git commit -m "feat: service cards glassmorphism with miniNodes particle background"
```

---

### Task 5: Refactorizar steps en `Metodo.jsx` a layout editorial 01/02/03

**Files:**
- Modify: `src/pages/Metodo.jsx`
- Modify: `src/styles/pages.css`

**Interfaces:**
- Consume: `.step-divider`, `.step-number`, `.ghost-text` (Task 2)

- [ ] **Step 1: Agregar CSS para steps editoriales en `pages.css`**

```css
/* Editorial steps 01/02/03 */
.editorial-steps { display: flex; flex-direction: column; gap: 0; }

.editorial-step {
  padding: 2.5rem 0;
  border-bottom: 1px solid var(--line);
}
.editorial-step:first-child { border-top: 1px solid var(--line); }

.editorial-step__header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.editorial-step__num {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--step-number-color);
  letter-spacing: 0.1em;
  min-width: 2rem;
}

.editorial-step__divider {
  flex: 1;
  height: 1px;
  background: var(--step-divider-color);
}

.editorial-step__title {
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 3vw, 2.25rem);
  font-weight: 700;
  color: var(--bone);
  line-height: 1.2;
}

.editorial-step__sub {
  color: var(--ghost-text-color);
  font-size: 0.85em;
  display: block;
}

.editorial-step__body {
  color: var(--bone-dim);
  max-width: 60ch;
  line-height: 1.7;
  margin-left: calc(2rem + 1.5rem);
}
```

- [ ] **Step 2: Reemplazar estructura de steps en `Metodo.jsx`**

Cada paso del proceso usa este patrón:

```jsx
<div className="editorial-steps">
  <div className="editorial-step reveal">
    <div className="editorial-step__header">
      <span className="editorial-step__num">01</span>
      <div className="editorial-step__divider" />
    </div>
    <h3 className="editorial-step__title">
      Diagnóstico
      <span className="editorial-step__sub ghost-text"> del problema</span>
    </h3>
    <p className="editorial-step__body">
      Analizamos tu stack, tus usuarios y tus restricciones. Sin supuestos.
      En 48 horas tenés un mapa claro del camino.
    </p>
  </div>

  <div className="editorial-step reveal">
    <div className="editorial-step__header">
      <span className="editorial-step__num">02</span>
      <div className="editorial-step__divider" />
    </div>
    <h3 className="editorial-step__title">
      Diseño
      <span className="editorial-step__sub ghost-text"> de arquitectura</span>
    </h3>
    <p className="editorial-step__body">
      Elegimos el stack correcto, definimos los agentes de IA necesarios
      y entregamos un blueprint ejecutable.
    </p>
  </div>

  {/* continuar con pasos restantes siguiendo el mismo patrón */}
</div>
```

- [ ] **Step 3: Verificar en dev server**

```bash
pnpm dev
```
Navegar a `http://localhost:5173/metodo`. Steps deben mostrar layout editorial con números, dividers y scroll reveal.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Metodo.jsx src/styles/pages.css
git commit -m "feat: editorial 01/02/03 step layout on Metodo page"
```

---

## WAVE 2 — Agentes Paralelos

> Los 4 agentes de Wave 2 arrancan simultáneamente después de que Wave 1 hace el último commit. Cada agente lee `src/styles/fusion-tokens.css` antes de editar para entender el sistema visual.

---

### Task 6: Marketing/Copy `[claude-sonnet-4-6]`

**Files:**
- Modify: `src/pages/Home.jsx`, `src/pages/Servicios.jsx`, `src/pages/Metodo.jsx`, `src/pages/Casos.jsx`, `src/pages/Contacto.jsx`

**Interfaces:**
- Consume: layout de Wave 1 (hero 2 cols, editorial steps, glass cards)
- Produce: copy final en español para todos los CTAs, headlines, descripciones

- [ ] **Step 1: Auditar copy actual en cada página**

Leer cada `src/pages/*.jsx` e identificar todos los strings de copy (headlines, subtítulos, CTAs, body copy).

- [ ] **Step 2: Reescribir headlines con técnica ghost typography**

Patrón: línea 1 bold `var(--bone)` + línea 2 con clase `.ghost-text`.

Ejemplos por página:

**Home hero** (ya definido en Task 3):
```
"Software que" → bold bone
"piensa solo." → ghost-text
```

**Servicios hero:**
```jsx
<h1 className="hero-title-line">Construimos</h1>
<span className="hero-ghost-line ghost-text">el software del futuro.</span>
```

**Metodo hero:**
```jsx
<h1 className="hero-title-line">Método sin</h1>
<span className="hero-ghost-line ghost-text">fricción.</span>
```

**Casos hero:**
```jsx
<h1 className="hero-title-line">Resultados</h1>
<span className="hero-ghost-line ghost-text">que hablan solos.</span>
```

**Contacto hero:**
```jsx
<h1 className="hero-title-line">Hablemos</h1>
<span className="hero-ghost-line ghost-text">de tu próximo producto.</span>
```

- [ ] **Step 3: Actualizar CTAs a tono premium**

```
"Ver más" → "Explorar casos reales"
"Contactar" → "Iniciar proyecto"
"Enviar" → "Enviar mensaje"
"Ver servicios" → "Ver cómo trabajamos"
```

- [ ] **Step 4: Verificar en dev server**

```bash
pnpm dev
```
Navegar por las 5 rutas. Copy en español, tono premium, sin texto placeholder.

- [ ] **Step 5: Commit**

```bash
git add src/pages/
git commit -m "copy: premium Spanish copy with ghost typography across all pages"
```

---

### Task 7: SEO `[claude-haiku-4-5]`

**Files:**
- Modify: `src/hooks/usePageMeta.jsx`
- Modify: `index.html`
- Create: `public/robots.txt`
- Create: `public/sitemap.xml`
- Modify: `vercel.json` (solo sección `headers` de cache — NO tocar CSP ni rewrites)

**Interfaces:**
- Produce: meta tags completos por ruta, robots.txt, sitemap, structured data, cache headers

- [ ] **Step 1: Actualizar `index.html` con meta base**

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Kaivex AI — Estudio de Desarrollo con IA</title>
  <meta name="description" content="Construimos software con agentes de IA. Desde prototipo hasta producción — rápido, preciso, sin fricción." />
  <meta name="theme-color" content="#0a0b0f" />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Kaivex AI" />
  <meta property="og:image" content="/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="/og-image.png" />

  <!-- Structured data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Kaivex AI",
    "description": "Estudio de desarrollo de software con agentes de IA",
    "url": "https://kaivexai.com",
    "email": "juanda24florezvizcaino@gmail.com",
    "serviceType": "Software Development"
  }
  </script>
</head>
```

- [ ] **Step 2: Extender `usePageMeta.jsx` con todas las rutas**

```jsx
// src/hooks/usePageMeta.jsx
const META = {
  '/': {
    title: 'Kaivex AI — Estudio de Desarrollo con IA',
    description: 'Construimos software con agentes de IA. Prototipo a producción, rápido y sin fricción.',
  },
  '/servicios': {
    title: 'Servicios — Kaivex AI',
    description: 'Desarrollo de software con IA: MVPs, agentes autónomos, arquitectura cloud y más.',
  },
  '/metodo': {
    title: 'Método — Kaivex AI',
    description: 'Nuestro proceso de desarrollo: diagnóstico, arquitectura, build con IA y entrega.',
  },
  '/casos': {
    title: 'Casos de éxito — Kaivex AI',
    description: 'Proyectos entregados: métricas reales, stacks reales, resultados reales.',
  },
  '/contacto': {
    title: 'Contacto — Kaivex AI',
    description: 'Iniciá tu proyecto con Kaivex AI. Contanos qué estás construyendo.',
  },
}

export function usePageMeta(pathname) {
  useEffect(() => {
    const meta = META[pathname] || META['/']
    document.title = meta.title

    const setMeta = (sel, val) => {
      const el = document.querySelector(sel)
      if (el) el.setAttribute('content', val)
    }

    setMeta('meta[name="description"]', meta.description)
    setMeta('meta[property="og:title"]', meta.title)
    setMeta('meta[property="og:description"]', meta.description)
    setMeta('meta[property="og:url"]', window.location.href)
    setMeta('meta[name="twitter:title"]', meta.title)
    setMeta('meta[name="twitter:description"]', meta.description)
  }, [pathname])
}
```

- [ ] **Step 3: Crear `public/robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://kaivexai.com/sitemap.xml
```

- [ ] **Step 4: Crear `public/sitemap.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://kaivexai.com/</loc><priority>1.0</priority></url>
  <url><loc>https://kaivexai.com/servicios</loc><priority>0.9</priority></url>
  <url><loc>https://kaivexai.com/metodo</loc><priority>0.8</priority></url>
  <url><loc>https://kaivexai.com/casos</loc><priority>0.8</priority></url>
  <url><loc>https://kaivexai.com/contacto</loc><priority>0.7</priority></url>
</urlset>
```

- [ ] **Step 5: Agregar cache headers en `vercel.json` (SOLO la key `headers`, no tocar `rewrites`)**

```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/(.*)\\.(?:js|css|woff2|png|jpg|svg|ico)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=86400" }
      ]
    }
  ]
}
```

- [ ] **Step 6: Commit**

```bash
git add index.html src/hooks/usePageMeta.jsx public/robots.txt public/sitemap.xml vercel.json
git commit -m "feat: SEO meta tags, sitemap, robots.txt and static asset cache headers"
```

---

### Task 8: Seguridad `[claude-opus-4-8]`

**Files:**
- Modify: `src/components/ContactForm.jsx`
- Modify: `vercel.json` (solo sección `headers` de seguridad — NO tocar cache headers de SEO ni rewrites)

**Interfaces:**
- Produce: CSP header compatible con Three.js ES modules, validación de ContactForm, security headers

- [ ] **Step 1: Agregar validación a `ContactForm.jsx`**

```jsx
// src/components/ContactForm.jsx
const LIMITS = { name: 100, email: 254, message: 2000 }

function sanitize(str) {
  return str.replace(/[<>"'&]/g, c => ({ '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;' }[c]))
}

function validate({ name, email, message }) {
  const errors = {}
  if (!name.trim() || name.length > LIMITS.name)
    errors.name = 'Nombre requerido (máx. 100 caracteres)'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > LIMITS.email)
    errors.email = 'Email inválido'
  if (!message.trim() || message.length < 10 || message.length > LIMITS.message)
    errors.message = `Mensaje entre 10 y ${LIMITS.message} caracteres`
  return errors
}

// En el onSubmit handler:
// const errors = validate(formData)
// if (Object.keys(errors).length) { setErrors(errors); return }
// const safeData = { name: sanitize(formData.name), email: formData.email, message: sanitize(formData.message) }
// ... enviar safeData
```

- [ ] **Step 2: Agregar security headers en `vercel.json`**

Three.js usa `blob:` workers y `data:` URIs internamente. El CSP debe permitirlos:

```json
{
  "source": "/(.*)",
  "headers": [
    {
      "key": "Content-Security-Policy",
      "value": "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; worker-src 'self' blob:; connect-src 'self' https://formspree.io; object-src 'none'; base-uri 'self'"
    },
    { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
    { "key": "X-Frame-Options", "value": "DENY" },
    { "key": "X-Content-Type-Options", "value": "nosniff" },
    { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
    { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
  ]
}
```

> **Nota Opus:** `'unsafe-eval'` es requerido por Three.js (glsl shader compilation). Sin él, los shaders fallan en producción. Verificar si la versión específica de Three.js usada en `woven.js` lo necesita — si no lo necesita, removerlo.

- [ ] **Step 3: Verificar ContactForm sin XSS**

Ingresar en el campo mensaje: `<script>alert(1)</script>`. Confirmar que se sanitiza y no ejecuta.

- [ ] **Step 4: Commit**

```bash
git add src/components/ContactForm.jsx vercel.json
git commit -m "feat: CSP headers, HSTS, security headers and ContactForm input validation"
```

---

### Task 9: Deploy `[claude-haiku-4-5]`

**Files:**
- Modify: `vercel.json` (solo `rewrites` y configuración build — NO tocar headers)

**Interfaces:**
- Produce: `vercel.json` con rewrites SPA correctos y build config para Vite

- [ ] **Step 1: Verificar `vercel.json` rewrites existentes**

El archivo debe tener el rewrite SPA fallback. Si no existe o está incompleto:

```json
{
  "rewrites": [
    { "source": "/((?!assets/).*)", "destination": "/index.html" }
  ]
}
```

El patrón `(?!assets/)` excluye los assets de Vite del fallback — importante para que los JS/CSS se sirvan correctamente.

- [ ] **Step 2: Verificar build settings**

Confirmar que `package.json` tiene:
```json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

Vercel detecta Vite automáticamente. Build command: `pnpm build`. Output: `dist/`.

- [ ] **Step 3: Correr build local para verificar**

```bash
pnpm build
```
Esperado: `dist/` generado sin errores. Si hay warnings de TypeScript/lint, ignorar (no hay linter configurado).

- [ ] **Step 4: Commit**

```bash
git add vercel.json
git commit -m "feat: vercel SPA rewrite config for Vite client-side routing"
```

---

## WAVE 3 — Integrador `[claude-sonnet-4-6]`

### Task 10: Merge `vercel.json` de los 3 agentes

**Files:**
- Modify: `vercel.json`

**Interfaces:**
- Consume: `vercel.json` parciales de SEO (Task 7), Seguridad (Task 8), Deploy (Task 9)
- Produce: `vercel.json` final coherente y sin conflictos

- [ ] **Step 1: Construir `vercel.json` final**

```json
{
  "rewrites": [
    { "source": "/((?!assets/).*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; worker-src 'self' blob:; connect-src 'self' https://formspree.io; object-src 'none'; base-uri 'self'" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/(.*)\\.(?:js|css|woff2|png|jpg|svg|ico)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=86400" }
      ]
    }
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add vercel.json
git commit -m "chore: merge vercel.json from SEO, security and deploy agents"
```

---

### Task 11: Build final + deploy a Vercel

**Files:**
- ninguno nuevo

- [ ] **Step 1: Build de producción**

```bash
pnpm build
```
Si falla: revisar errores de import, JSX syntax, o módulos faltantes. Parchear antes de continuar.

- [ ] **Step 2: Preview local**

```bash
pnpm preview
```
Abrir `http://localhost:4173`. Navegar las 5 rutas. Confirmar:
- Three.js canvas carga en hero
- miniNodes animan en service cards
- aiStrip funciona en hero
- BuildSaas scroll funciona en `/servicios`
- Diagram funciona en home
- ContactForm valida y rechaza inputs maliciosos
- Steps editoriales 01/02/03 visibles en `/metodo`

- [ ] **Step 3: Deploy a Vercel**

Si Vercel CLI está instalado:
```bash
vercel --prod
```

Si no, usar Vercel MCP (disponible en esta sesión) via `mcp__plugin_vercel_vercel__deploy_to_vercel`.

- [ ] **Step 4: Verificar en URL de producción**

Abrir la URL de producción. Confirmar que:
- SPA routing funciona (reload en `/servicios` no da 404)
- Fuentes cargan (Inter Tight, Outfit, JetBrains Mono)
- Three.js no falla por CSP (abrir DevTools → Console, sin errores de CSP)
- Meta tags correctos (abrir `view-source:` de cada ruta)

- [ ] **Step 5: Commit final**

```bash
git add .
git commit -m "feat: Kaivex AI full redesign — fusion of EinCode + COMPUTE aesthetic, SEO, security, deploy"
```
