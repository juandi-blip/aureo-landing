# Kaivex AI — Rediseño Multi-Agente

**Fecha:** 2026-06-20
**Alcance:** Rediseño completo del sitio (todas las rutas) + arquitectura de agentes paralelos
**Stack:** Vite + React JSX, pnpm, React Router, Vercel

---

## Objetivos

1. Fusionar estética de dos templates (EinCode Digital Lab + COMPUTE) con la identidad Kaivex AI existente
2. Orquestar el desarrollo con agentes especializados usando modelos Claude según complejidad de tarea
3. Mejorar SEO, seguridad y preparar deploy producción en Vercel

---

## Sistema Visual Fusionado

### Qué se toma de cada fuente

**De EinCode Digital Lab:**
- Glassmorphism en cards: `backdrop-filter: blur(12px) saturate(1.5)` con fondo translúcido
- Terminal mockup en hero (lado derecho) — reutiliza `aiStrip.js` como contenido
- Cursor glow radial mejorado — potencia el `cursor-halo` existente de `blueprint.js`
- Border glow on hover: pseudo-elemento `::before` con gradient animado
- Stagger animations CSS unificadas (reemplaza mezcla reveal.js + framer-motion ad-hoc)
- Scanlines texture sutil (repeating-linear-gradient) en secciones oscuras

**De COMPUTE:**
- Hero 2 columnas: texto izquierda / Three.js visual derecha (reposiciona `WovenHero` del centro)
- Tipografía ghost: línea 1 bold blanca + línea 2 dim/apagada (`--bone-dim`)
- Feature cards con campo de partículas de fondo — `miniNodes.js` como fondo de card
- Steps editoriales 01/02/03 con divider horizontal — aplica a `/metodo` y `#proceso`
- Stats strip inmediatamente debajo del hero

**Se conserva de Kaivex AI:**
- Paleta dark: `--ink-900 #0a0b0f`, `--signal #5b8cff`, `--signal-soft #6f4fff`, `--signal-gradient`
- Todos los módulos `src/lib/*.js` — lógica intacta, solo cambia markup envolvente
- React Router + Vite — no se migra a Next.js
- `WovenHero` Three.js (~18k partículas en TorusKnot) — se reposiciona, no reemplaza
- Tokens CSS existentes — se extienden, no se reescriben

### Nuevo archivo de tokens

`src/styles/fusion-tokens.css` — contrato para todos los agentes Wave 2:

```css
--glass-bg: oklch(from var(--ink-820) l c h / 0.6);
--glass-blur: blur(12px) saturate(1.5);
--border-glow-color: var(--signal);
--scanline-opacity: 0.015;
--cursor-glow-size: 400px;
--hero-cols: 1fr 1fr;
--stats-gap: 3rem;
--step-divider-color: var(--line);
```

---

## Arquitectura de Agentes

### Wave 1 — Diseño (Opus)

**Modelo:** `claude-opus-4-8`
**Corre:** Primero, en solitario
**Outputs que otros consumen:** `src/styles/fusion-tokens.css`

Tareas:
- Crear `src/styles/fusion-tokens.css`
- Actualizar `src/styles/base.css` con `.glass`, `.border-glow`, `.scanlines`, `.hover-lift`, stagger CSS
- Refactorizar `src/components/WovenHero.jsx` + `Home.jsx` hero a layout 2 columnas
- Agregar terminal mockup al hero (markup para `aiStrip.js`)
- Actualizar cards de servicios: clase `.glass` + `miniNodes` como fondo canvas
- Refactorizar steps en `Metodo.jsx` a layout 01/02/03 con dividers horizontales
- Agregar stats strip debajo del hero en `Home.jsx`
- Asegurar que todos los `init*()` existentes siguen funcionando con el nuevo markup

---

### Wave 2 — Paralelo (4 agentes simultáneos)

Arrancan cuando Wave 1 commitea `fusion-tokens.css`. Cada agente lee ese archivo antes de editar.

#### Agente Marketing/Copy — `claude-sonnet-4-6`

Archivos: `src/pages/*.jsx`

- Reescribir headlines con técnica ghost typography (línea bold + línea dim)
- CTAs en español alineados al tono premium dark de Kaivex
- Copy de casos, servicios y método coherente con nueva estructura visual
- Mantener terminología técnica exacta (no simplificar conceptos de software)

#### Agente SEO — `claude-haiku-4-5`

Archivos: `src/hooks/usePageMeta.jsx`, `index.html`, `vercel.json` (solo sección `headers`), `public/robots.txt`, `public/sitemap.xml`

- Meta tags completos: `title`, `description`, `og:*`, `twitter:*` para cada ruta
- `robots.txt` básico
- `sitemap.xml` con las 5 rutas (`/`, `/servicios`, `/metodo`, `/casos`, `/contacto`)
- Cache headers en `vercel.json` para assets estáticos (`/assets/*`)
- Structured data JSON-LD para la organización (schema.org `Organization`)

#### Agente Seguridad — `claude-opus-4-8`

Archivos: `src/components/ContactForm.jsx`, `vercel.json` (sección `headers` CSP/HSTS)

- CSP header: `Content-Security-Policy` — permitir Three.js inline workers, bloquear todo lo demás
- `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`
- Validación y sanitización de inputs en `ContactForm.jsx` (nombre, email, mensaje)
- Verificar que no haya XSS posible en las strings del `aiStrip.js` (pre-scripted, verificar)
- Modelo Opus: CSP con Three.js + módulos ES es complejo, requiere razonamiento profundo

#### Agente Deploy — `claude-haiku-4-5`

Archivos: `vercel.json`, `package.json` (scripts)

- Revisar rewrites existentes (SPA fallback a `/index.html`)
- Confirmar `pnpm build` como build command en Vercel
- Output directory: `dist/`
- Node version: 24 (default actual de Vercel)
- Agregar preview alias config si aplica
- No toca headers (los maneja Seguridad)

---

### Wave 3 — Integrador (Sonnet)

**Modelo:** `claude-sonnet-4-6`
**Corre:** Cuando los 4 agentes Wave 2 terminan

Tareas:
1. **Merge `vercel.json`:** SEO aporta cache headers, Seguridad aporta CSP/HSTS, Deploy aporta rewrites → un solo `vercel.json` coherente
2. **Coherencia copy/layout:** Si Marketing cambió estructura de secciones, verificar que SEO meta descriptions sigan siendo precisas
3. **Build check:** `pnpm build` — si falla, parchear antes de continuar
4. **Deploy a Vercel:** `vercel --prod` o via Vercel MCP
5. **Verificación final:** Screenshot de cada ruta en prod, confirmar que módulos canvas siguen funcionando

---

## Manejo de Conflictos

| Conflicto | Resolución |
|---|---|
| SEO + Seguridad + Deploy escriben `vercel.json` | Integrador hace merge manual de secciones (`headers`, `rewrites`) |
| Marketing cambia copy que afecta meta descriptions ya escritas | Marketing corre primero; SEO usa su output como fuente en Wave 3 si hay delta |
| Build rompe por cambio de markup en Wave 1 | Wave 3 parchea antes de deploy — no se hace deploy con build roto |
| CSP bloquea Three.js / módulos ES | Agente Seguridad es Opus precisamente por este riesgo — debe probar configuración |

---

## Outputs Esperados

```
src/styles/fusion-tokens.css          ← Wave 1 (nuevo)
src/styles/base.css                   ← Wave 1 (extendido)
src/styles/sections.css               ← Wave 1 (hero 2 cols)
src/pages/Home.jsx                    ← Wave 1 (layout) + Wave 2 Marketing (copy)
src/pages/Servicios.jsx               ← Wave 1 (cards glass) + Wave 2 Marketing
src/pages/Metodo.jsx                  ← Wave 1 (steps 01/02/03) + Wave 2 Marketing
src/pages/Casos.jsx                   ← Wave 2 Marketing
src/pages/Contacto.jsx                ← Wave 2 Marketing + Wave 2 Seguridad
src/components/ContactForm.jsx        ← Wave 2 Seguridad
src/hooks/usePageMeta.jsx             ← Wave 2 SEO
public/robots.txt                     ← Wave 2 SEO (nuevo)
public/sitemap.xml                    ← Wave 2 SEO (nuevo)
vercel.json                           ← Wave 2 SEO + Seguridad + Deploy → Wave 3 merge
index.html                            ← Wave 2 SEO (meta base)
```

---

## Restricciones

- No migrar a Next.js — mantener Vite + React JSX
- No reescribir módulos `src/lib/*.js` — solo cambiar markup envolvente
- No agregar Tailwind — usar sistema de tokens CSS existente
- Copy siempre en español
- Canvas modules deben seguir el contrato `init() → cleanup()` existente
- Sin `<React.StrictMode>` (documentado en CLAUDE.md — doble invocación rompe canvas)
