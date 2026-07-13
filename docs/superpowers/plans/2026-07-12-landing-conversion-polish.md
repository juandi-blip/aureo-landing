# Landing Conversion Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the 3 layout/content gaps found on the `aureo-landing` site — orphan cards in the modules grid, orphan card in the Melyor capabilities grid, and a visually flat contact section — using only real, verified product features and true claims.

**Architecture:** Additive content changes to `content/site.ts` (2 new modules, 1 new Melyor capability, 1 new `contacto.confianza` array), 2 icon-map additions in existing components, and one component restructure (`ContactSection.tsx` → split panel). No new dependencies, no new files except the restructured component's internals stay in the same file.

**Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS, `motion/react` (Framer Motion), `lucide-react` icons, Vitest for unit tests.

## Global Constraints

- Scope is `aureo-landing` only — do not touch `aureo/` (the app repo). Per spec: `docs/superpowers/specs/2026-07-12-landing-conversion-polish-design.md`.
- Do not reposition/modify the Melyor chat widget inside the `aureo` app — explicitly deferred by the user to a later conversation.
- All new copy must describe real, already-implemented behavior (verified against `aureo/inventory.js`, `aureo/permissions.js`, `aureo/melyor.js` — see spec for exact grounding). Do not invent capabilities.
- Contact section must NOT switch to `bg-[var(--bg-navy)]` — `FinalCTA` (immediately following it in `app/page.tsx`) is already navy; stacking two dark sections breaks visual rhythm. Keep `bg-[var(--bg-subtle)]`. (Corrected post-implementation: original spec/plan text wrongly attributed this to `DemoSection` preceding it — the actual neighbor requiring the light background is `FinalCTA` after it.)
- New Melyor capability copy must NOT say "sin abrir el dashboard" or otherwise imply the dashboard is skippable — `DemoSection` sells the dashboard/heatmap as the product's visual differentiator; new copy competes with menu/filter navigation friction instead.
- Follow existing repo conventions: content lives in `content/site.ts`, components read from `site`, motion patterns use `fadeUp`/`staggerContainer`/`VIEWPORT` from `@/lib/motion`.
- Run `npm run build` and `npx vitest run` before the final commit — both must pass clean.

---

### Task 1: Extend `site.ts` content + update existing content tests (TDD)

**Files:**
- Modify: `content/site.ts` (`modulos` array ~line 42-53, `melyor.capacidades` array ~line 73-79, add new `contacto` key after `melyor` block ~line 81)
- Modify: `test/site-content.test.ts:4-30`

**Interfaces:**
- Produces: `site.modulos` now has 12 entries (ids include new `conteos`, `permisos`). `site.melyor.capacidades` now has 6 entries. New `site.contacto.confianza: { titulo: string; icono: string }[]` with 3 entries (icono values: `"clock"`, `"users"`, `"shield-check"`).
- Consumed by: Task 2 (`ModuleCard.tsx` icon map for `clipboard-check`/`shield`), Task 3 (`MelyorSection.tsx` icon list), Task 4 (`ContactSection.tsx` reads `site.contacto.confianza`).

- [ ] **Step 1: Update the existing tests first to express the new expected counts and new type**

Edit `test/site-content.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { site, type Moneda, type Periodo } from "@/content/site";

describe("site.modulos", () => {
  it("incluye los 12 módulos del producto, incluyendo los nuevos", () => {
    expect(site.modulos).toHaveLength(12);
    const ids = site.modulos.map((m) => m.id);
    expect(ids).toEqual(
      expect.arrayContaining(["crm", "alertas", "reportes", "compras", "conteos", "permisos"]),
    );
  });

  it("cada módulo tiene título y beneficio no vacíos", () => {
    for (const m of site.modulos) {
      expect(m.titulo.length).toBeGreaterThan(0);
      expect(m.beneficio.length).toBeGreaterThan(0);
    }
  });
});

describe("site.melyor", () => {
  it("tiene identidad de modelo propia", () => {
    expect(site.melyor.nombre).toBe("Melyor");
    expect(site.melyor.version).toBe("1");
  });

  it("tiene 6 capacidades mapeadas a los módulos reales", () => {
    expect(site.melyor.capacidades).toHaveLength(6);
  });

  it("ninguna capacidad implica que el dashboard es prescindible", () => {
    for (const cap of site.melyor.capacidades) {
      expect(cap.texto.toLowerCase()).not.toContain("sin abrir el dashboard");
    }
  });
});

describe("site.contacto", () => {
  it("tiene 3 puntos de confianza con título e icono no vacíos", () => {
    expect(site.contacto.confianza).toHaveLength(3);
    for (const c of site.contacto.confianza) {
      expect(c.titulo.length).toBeGreaterThan(0);
      expect(c.icono.length).toBeGreaterThan(0);
    }
  });
});

describe("site.planes — precios", () => {
  it("Starter no cambia de precio", () => {
    const starter = site.planes.find((p) => p.nombre === "Starter")!;
    expect(starter.precios.cop.mensual).toBe(24900);
  });

  it("Pro sube a 64.900 COP/mes fundador", () => {
    const pro = site.planes.find((p) => p.nombre === "Pro")!;
    expect(pro.precios.cop.mensual).toBe(64900);
    expect(pro.features.some((f) => f.includes("CRM"))).toBe(true);
  });

  it("Logística sube a 114.900 COP/mes fundador", () => {
    const log = site.planes.find((p) => p.nombre === "Logística")!;
    expect(log.precios.cop.mensual).toBe(114900);
    expect(log.features.some((f) => f.includes("Compras inteligentes"))).toBe(true);
  });

  it("cada plan tiene precio anual menor al mensual (descuento por pago anual)", () => {
    for (const p of site.planes) {
      expect(p.precios.cop.anual).toBeLessThan(p.precios.cop.mensual);
    }
  });

  it("precioRegular es siempre mayor que precios (founder < regular) en todos los planes/monedas/periodos", () => {
    const monedas: Moneda[] = ["cop", "usd"];
    const periodos: Periodo[] = ["mensual", "anual"];

    for (const p of site.planes) {
      for (const moneda of monedas) {
        for (const periodo of periodos) {
          expect(p.precioRegular[moneda][periodo]).toBeGreaterThan(
            p.precios[moneda][periodo],
          );
        }
      }
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run test/site-content.test.ts`
Expected: FAIL — `site.modulos` length 10 ≠ 12, `site.melyor.capacidades` length 5 ≠ 6, `site.contacto` is `undefined`.

- [ ] **Step 3: Update `content/site.ts` — extend `modulos`**

In `content/site.ts`, find the `modulos` array (currently ends with the `compras` entry at line 52). Change:

```ts
    { id: "compras", titulo: "Compras inteligentes", beneficio: "Órdenes de compra agrupadas por proveedor, con numeración automática.", icono: "shopping-bag" },
  ] as Module[],
```

to:

```ts
    { id: "compras", titulo: "Compras inteligentes", beneficio: "Órdenes de compra agrupadas por proveedor, con numeración automática.", icono: "shopping-bag" },
    { id: "conteos", titulo: "Conteos físicos", beneficio: "Programa conteos físicos, detecta diferencias y concilia el stock sin parar la operación.", icono: "clipboard-check" },
    { id: "permisos", titulo: "Permisos por rol", beneficio: "Define qué ve cada rol del equipo, módulo por módulo, sin tocar una línea de código.", icono: "shield" },
  ] as Module[],
```

- [ ] **Step 4: Update `content/site.ts` — extend `melyor.capacidades`**

Find the `capacidades` array inside `melyor` (currently ends with "Pregúntale directamente" at line 78). Change:

```ts
      { titulo: "Pregúntale directamente", texto: "Además de todo esto, puedes chatear con Melyor sobre stock bajo, clientes inactivos o facturas pendientes, en lenguaje natural." },
    ],
```

to:

```ts
      { titulo: "Pregúntale directamente", texto: "Además de todo esto, puedes chatear con Melyor sobre stock bajo, clientes inactivos o facturas pendientes, en lenguaje natural." },
      { titulo: "Cifras exactas, al instante", texto: "Pregunta tu facturación, cantidad de facturas o stock total y te responde con el número real del momento — sin buscar en menús ni filtros." },
    ],
```

- [ ] **Step 5: Update `content/site.ts` — add `contacto` block**

Immediately after the closing of the `melyor` object (after its `nota` line and closing `},` at line 81), insert a new top-level key:

```ts
  contacto: {
    confianza: [
      { titulo: "Respuesta el mismo día", icono: "clock" },
      { titulo: "Hablas directo con los fundadores — no un bot de soporte", icono: "users" },
      { titulo: "Sin compromiso, sin tarjeta", icono: "shield-check" },
    ],
  },
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run test/site-content.test.ts`
Expected: PASS — all assertions green.

- [ ] **Step 7: Commit**

```bash
git add content/site.ts test/site-content.test.ts
git commit -m "feat: add 2 real modules, 1 Melyor capability, and contact trust points to site content"
```

---

### Task 2: Add new icons to `ModuleCard.tsx` icon map

**Files:**
- Modify: `components/ModuleCard.tsx:1-19`

**Interfaces:**
- Consumes: `Module.icono` string values `"clipboard-check"` and `"shield"` from Task 1.
- Produces: no new exports; `ModuleCard` renders correctly for all 12 modules.

- [ ] **Step 1: Add the two new lucide imports and map entries**

In `components/ModuleCard.tsx`, change:

```ts
import { ShoppingCart, Boxes, Map, BarChart2, Route, ArrowRightLeft, Users, Bell, FileText, ShoppingBag } from "lucide-react";
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
};
```

to:

```ts
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
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/ModuleCard.tsx
git commit -m "feat: map icons for the 2 new module cards"
```

---

### Task 3: Add `Zap` icon to `MelyorSection.tsx` capability list

**Files:**
- Modify: `components/MelyorSection.tsx:4,11`

**Interfaces:**
- Consumes: `site.melyor.capacidades` now length 6 (Task 1).
- Produces: `CAPABILITY_ICONS` array length 6, index-aligned with `capacidades`.

- [ ] **Step 1: Add `Zap` import and array entry**

Change:

```ts
import { ShoppingBag, Bell, Users, FileText, MessageCircle } from "lucide-react";
```
```ts
const CAPABILITY_ICONS = [ShoppingBag, Bell, Users, FileText, MessageCircle];
```

to:

```ts
import { ShoppingBag, Bell, Users, FileText, MessageCircle, Zap } from "lucide-react";
```
```ts
const CAPABILITY_ICONS = [ShoppingBag, Bell, Users, FileText, MessageCircle, Zap];
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Visual check grid closes evenly**

Run: `npm run dev` (if not already running), open `http://localhost:3000`, scroll to the Melyor section. Expected: 6 cards in a 2-column × 3-row grid, no orphan card, last row has 2 cards (5th: "Pregúntale directamente", 6th: "Cifras exactas, al instante").

- [ ] **Step 4: Commit**

```bash
git add components/MelyorSection.tsx
git commit -m "feat: add 6th Melyor capability card and matching icon"
```

---

### Task 4: Rebuild `ContactSection.tsx` as a split panel

**Files:**
- Modify: `components/ContactSection.tsx` (full rewrite of the JSX body; imports and `CONTACT_EMAIL` constant stay)

**Interfaces:**
- Consumes: `site.whatsapp` (existing), `site.contacto.confianza: { titulo: string; icono: string }[]` (Task 1).
- Produces: no new exports — `ContactSection` keeps its existing named export and `id="contacto"` anchor (used by `Nav.tsx`).

- [ ] **Step 1: Rewrite the component**

Replace the full contents of `components/ContactSection.tsx` with:

```tsx
// components/ContactSection.tsx
"use client";
import { motion } from "motion/react";
import { Clock, Users, ShieldCheck } from "lucide-react";
import { site } from "@/content/site";
import { fadeUp, staggerContainer, VIEWPORT } from "@/lib/motion";
import { SectionHeading } from "@/components/ui/SectionHeading";

const CONTACT_EMAIL = "aureosaas@gmail.com";

const CONFIANZA_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  clock: Clock,
  users: Users,
  "shield-check": ShieldCheck,
};

export function ContactSection() {
  return (
    <section id="contacto" className="bg-[var(--bg-subtle)] py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <SectionHeading>¿Hablamos?</SectionHeading>
            <motion.p
              className="mt-4 max-w-xl text-lg text-[var(--text-secondary)]"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT}
            >
              ¿Tienes dudas, quieres una demo o vender en tu ciudad? Escríbenos y te
              respondemos el mismo día.
            </motion.p>

            <motion.div
              className="mt-8 flex flex-col items-start gap-3 sm:flex-row"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT}
            >
              <a
                href={site.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[var(--emerald)] px-6 font-semibold text-white transition-opacity hover:opacity-90 sm:w-auto"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.554 4.1 1.523 5.824L0 24l6.336-1.498A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.371l-.36-.214-3.724.88.897-3.628-.235-.373A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
                </svg>
                Escríbenos por WhatsApp
              </a>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-[var(--border-subtle)] px-6 font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--primary)] sm:w-auto"
              >
                {CONTACT_EMAIL}
              </a>
            </motion.div>
          </div>

          <motion.div
            className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
          >
            <ul className="flex flex-col gap-6">
              {site.contacto.confianza.map((item) => {
                const Icon = CONFIANZA_ICONS[item.icono] ?? Clock;
                return (
                  <motion.li key={item.titulo} variants={fadeUp} className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary)]/10">
                      <Icon aria-hidden className="h-5 w-5 text-[var(--primary)]" />
                    </div>
                    <p className="pt-2 font-medium text-[var(--text-primary)]">{item.titulo}</p>
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Visual check at 3 breakpoints**

Run: `npm run dev`, open `http://localhost:3000#contacto` in a browser. Resize to mobile (~375px), tablet (~768px), desktop (~1280px). Expected:
- Mobile/tablet (below `lg`): single column, heading/text/buttons on top, trust-points card stacked below.
- Desktop (`lg`+): two columns side by side, left text-aligned-left, right card with 3 icon rows.
- `id="contacto"` anchor still scrolls correctly from the nav "Contacto" link (`Nav.tsx`).

- [ ] **Step 4: Commit**

```bash
git add components/ContactSection.tsx
git commit -m "feat: redesign contact section as split panel with trust points"
```

---

### Task 5: Full-site verification pass

**Files:** none (verification only)

**Interfaces:** none

- [ ] **Step 1: Run full unit test suite**

Run: `npx vitest run`
Expected: all test files pass, including `test/site-content.test.ts` from Task 1.

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: build completes with no type errors, no failed pages.

- [ ] **Step 3: Manual browser pass over all 3 changed areas**

With `npm run dev` running, visit `http://localhost:3000` and check:
- `#producto` (ModulesGrid): 12 cards, 4 full rows of 3 at desktop width, no orphan.
- Melyor section: 6 cards, 3 full rows of 2, no orphan.
- `#contacto`: split panel renders as designed at mobile/tablet/desktop widths (repeat Task 4 Step 3 as a final pass after all other changes landed).
- Nav links ("Producto", "Contacto") still scroll to the right sections.

- [ ] **Step 4: Run e2e suite if it touches these sections**

Run: `npx playwright test e2e/waitlist.spec.ts`
Expected: PASS (this spec doesn't target the changed sections directly, but confirms the waitlist flow — which lives on the same page — still works after the DOM changes).

No commit for this task — verification only. If any check fails, fix in the relevant task's files and re-run.

---

### Task 6: Push and deploy to production

**Files:** none

**Interfaces:** none

- [ ] **Step 1: Confirm all commits from Tasks 1-4 are on `main` and working tree is clean**

Run: `git status`
Expected: `nothing to commit, working tree clean`, current branch `main`.

- [ ] **Step 2: Push to remote**

Run: `git push`

- [ ] **Step 3: Deploy to production**

Use the Vercel deploy flow already established for this project (production deploy, not preview) — confirm with the user before triggering if there's any ambiguity about which command/tool to use, since this affects the live site at https://aureo-landing.vercel.app.
