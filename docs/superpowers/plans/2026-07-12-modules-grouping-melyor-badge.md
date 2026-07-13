# Modules Grid Grouping + Melyor Badge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat 12-card modules grid with 3 labeled category groups of 4, and add a "Potenciado por Melyor" badge to the 4 module cards genuinely backed by Melyor's real-time context — making Melyor read as a pervasive engine rather than a single isolated section.

**Architecture:** Additive/structural change to `content/site.ts` (2 new type fields on `Module`, 1 new `categoriasModulos` array), a badge addition in `ModuleCard.tsx`, and a render restructure in `ModulesGrid.tsx` (one flat grid → 3 heading+grid blocks). No new dependencies, no new files.

**Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS, `motion/react` (Framer Motion), `lucide-react` icons, Vitest.

## Global Constraints

- Scope is `aureo-landing` only — no `aureo/` (app repo) changes.
- No copy rewrites: every module's existing `titulo`/`beneficio`/`icono` stays byte-for-byte identical. This pass only adds `categoria` and `melyorPowered` fields and restructures layout.
- Category assignment (verbatim, do not deviate): **Ventas y clientes** = `pos`, `crm`, `alertas`, `compras`. **Inventario y bodega** = `inventario`, `conteos`, `wms`, `reubicacion`. **Datos y control** = `abc`, `picking`, `reportes`, `permisos`.
- `melyorPowered: true` on exactly these 4 module ids, no others: `alertas`, `compras`, `crm`, `reportes`.
- No changes to Hero, Nav, or ComparisonSection — explicitly out of scope for this plan.
- No traction-metric numbers, no testimonials, no new trust-signal content — explicitly out of scope for this plan.
- Category display copy lives in `content/site.ts` (`categoriasModulos`), never hardcoded in a component — matches existing repo convention that all section text sources from `site`.
- Badge visual style reuses the existing bronze pill pattern from `components/MelyorSection.tsx`'s "Exclusivo de Aureo" eyebrow (`border-[var(--bronze)]/40 bg-[var(--bronze)]/10 text-[var(--bronze)]`) — do not invent a new visual language for it.
- Run `npm run build`, `npx tsc --noEmit`, and `npx vitest run` before the final commit — all must pass clean.

---

### Task 1: Extend `content/site.ts` types + data, update tests (TDD)

**Files:**
- Modify: `content/site.ts:1` (type `Module`), `content/site.ts:42-55` (`modulos` array), insert new `categoriasModulos` array immediately before `modulos`
- Modify: `test/site-content.test.ts` (the `describe("site.modulos", ...)` block)

**Interfaces:**
- Produces: `Module` type gains `categoria: "ventas" | "bodega" | "datos"` and `melyorPowered?: boolean`. New exported type `ModuloCategoriaId` and `ModuloCategoria`. New `site.categoriasModulos: ModuloCategoria[]` (3 entries: `ventas`/`bodega`/`datos` with display `titulo`).
- Consumed by: Task 2 (`ModuleCard.tsx` reads `module.melyorPowered`), Task 3 (`ModulesGrid.tsx` reads `site.categoriasModulos` and filters `site.modulos` by `categoria`).

- [ ] **Step 1: Update `test/site-content.test.ts` first to express the new expected shape**

Find the existing `describe("site.modulos", ...)` block (currently 2 `it(...)` blocks: length check and non-empty-fields check) and replace it with:

```ts
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

  it("cada módulo tiene una categoría válida", () => {
    const validCategorias = ["ventas", "bodega", "datos"];
    for (const m of site.modulos) {
      expect(validCategorias).toContain(m.categoria);
    }
  });

  it("cada categoría tiene exactamente 4 módulos", () => {
    const porCategoria = { ventas: 0, bodega: 0, datos: 0 };
    for (const m of site.modulos) {
      porCategoria[m.categoria as keyof typeof porCategoria]++;
    }
    expect(porCategoria).toEqual({ ventas: 4, bodega: 4, datos: 4 });
  });

  it("exactamente 4 módulos están potenciados por Melyor: alertas, compras, crm, reportes", () => {
    const melyorIds = site.modulos.filter((m) => m.melyorPowered).map((m) => m.id).sort();
    expect(melyorIds).toEqual(["alertas", "compras", "crm", "reportes"]);
  });
});

describe("site.categoriasModulos", () => {
  it("tiene exactamente 3 categorías con título no vacío", () => {
    expect(site.categoriasModulos).toHaveLength(3);
    const ids = site.categoriasModulos.map((c) => c.id).sort();
    expect(ids).toEqual(["bodega", "datos", "ventas"]);
    for (const c of site.categoriasModulos) {
      expect(c.titulo.length).toBeGreaterThan(0);
    }
  });
});
```

Leave every other `describe` block in the file (`site.melyor`, `site.contacto`, `site.planes`) untouched.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run test/site-content.test.ts`
Expected: FAIL — `m.categoria` is `undefined` (not in `["ventas","bodega","datos"]`), `site.categoriasModulos` is `undefined`.

- [ ] **Step 3: Update the `Module` type and add `ModuloCategoriaId`/`ModuloCategoria` types**

In `content/site.ts`, change line 1:

```ts
export type Module = { id: string; titulo: string; beneficio: string; icono: string };
```

to:

```ts
export type ModuloCategoriaId = "ventas" | "bodega" | "datos";
export type Module = {
  id: string;
  titulo: string;
  beneficio: string;
  icono: string;
  categoria: ModuloCategoriaId;
  melyorPowered?: boolean;
};
export type ModuloCategoria = { id: ModuloCategoriaId; titulo: string };
```

- [ ] **Step 4: Insert `categoriasModulos` and add `categoria`/`melyorPowered` to every entry in `modulos`**

Immediately before the `modulos:` key (currently at `content/site.ts:42`), insert:

```ts
  categoriasModulos: [
    { id: "ventas", titulo: "Ventas y clientes" },
    { id: "bodega", titulo: "Inventario y bodega" },
    { id: "datos", titulo: "Datos y control" },
  ] as ModuloCategoria[],
```

Then change the `modulos` array (currently `content/site.ts:42-55`) from:

```ts
  modulos: [
    { id: "pos", titulo: "Punto de venta", beneficio: "Vende y factura en segundos, con o sin conexión.", icono: "shopping-cart" },
    { id: "inventario", titulo: "Inventario inteligente", beneficio: "Control en tiempo real, alertas de stock y conteos físicos.", icono: "boxes" },
    { id: "wms", titulo: "Mapa de calor de bodega", beneficio: "Ve tu bodega como un plano vivo y ubica lo que más rota cerca del despacho.", icono: "map" },
    { id: "abc", titulo: "Análisis ABC / Pareto", beneficio: "Descubre el 20% de productos que generan el 80% de tus ventas.", icono: "bar-chart" },
    { id: "picking", titulo: "Preparación de pedidos", beneficio: "Recorridos optimizados para despachar más rápido y sin errores.", icono: "route" },
    { id: "reubicacion", titulo: "Reubicación inteligente", beneficio: "Sugerencias para ubicar lo que más rota cerca del despacho.", icono: "arrow-right-left" },
    { id: "crm", titulo: "CRM de clientes", beneficio: "Historial de compras, notas y clientes inactivos, sin hoja de cálculo aparte.", icono: "users" },
    { id: "alertas", titulo: "Alertas proactivas", beneficio: "Te avisa de stock bajo, clientes inactivos y facturas pendientes antes de que te cuesten una venta.", icono: "bell" },
    { id: "reportes", titulo: "Reportes exportables", beneficio: "Ventas, rotación, rentabilidad y por cliente, listos para exportar cuando los necesites.", icono: "file-text" },
    { id: "compras", titulo: "Compras inteligentes", beneficio: "Órdenes de compra agrupadas por proveedor, con numeración automática.", icono: "shopping-bag" },
    { id: "conteos", titulo: "Conteos físicos", beneficio: "Programa conteos físicos, detecta diferencias y concilia el stock sin parar la operación.", icono: "clipboard-check" },
    { id: "permisos", titulo: "Permisos por rol", beneficio: "Define qué ve cada rol del equipo, módulo por módulo, sin tocar una línea de código.", icono: "shield" },
  ] as Module[],
```

to (only added fields, no other text changed):

```ts
  modulos: [
    { id: "pos", titulo: "Punto de venta", beneficio: "Vende y factura en segundos, con o sin conexión.", icono: "shopping-cart", categoria: "ventas" },
    { id: "inventario", titulo: "Inventario inteligente", beneficio: "Control en tiempo real, alertas de stock y conteos físicos.", icono: "boxes", categoria: "bodega" },
    { id: "wms", titulo: "Mapa de calor de bodega", beneficio: "Ve tu bodega como un plano vivo y ubica lo que más rota cerca del despacho.", icono: "map", categoria: "bodega" },
    { id: "abc", titulo: "Análisis ABC / Pareto", beneficio: "Descubre el 20% de productos que generan el 80% de tus ventas.", icono: "bar-chart", categoria: "datos" },
    { id: "picking", titulo: "Preparación de pedidos", beneficio: "Recorridos optimizados para despachar más rápido y sin errores.", icono: "route", categoria: "datos" },
    { id: "reubicacion", titulo: "Reubicación inteligente", beneficio: "Sugerencias para ubicar lo que más rota cerca del despacho.", icono: "arrow-right-left", categoria: "bodega" },
    { id: "crm", titulo: "CRM de clientes", beneficio: "Historial de compras, notas y clientes inactivos, sin hoja de cálculo aparte.", icono: "users", categoria: "ventas", melyorPowered: true },
    { id: "alertas", titulo: "Alertas proactivas", beneficio: "Te avisa de stock bajo, clientes inactivos y facturas pendientes antes de que te cuesten una venta.", icono: "bell", categoria: "ventas", melyorPowered: true },
    { id: "reportes", titulo: "Reportes exportables", beneficio: "Ventas, rotación, rentabilidad y por cliente, listos para exportar cuando los necesites.", icono: "file-text", categoria: "datos", melyorPowered: true },
    { id: "compras", titulo: "Compras inteligentes", beneficio: "Órdenes de compra agrupadas por proveedor, con numeración automática.", icono: "shopping-bag", categoria: "ventas", melyorPowered: true },
    { id: "conteos", titulo: "Conteos físicos", beneficio: "Programa conteos físicos, detecta diferencias y concilia el stock sin parar la operación.", icono: "clipboard-check", categoria: "bodega" },
    { id: "permisos", titulo: "Permisos por rol", beneficio: "Define qué ve cada rol del equipo, módulo por módulo, sin tocar una línea de código.", icono: "shield", categoria: "datos" },
  ] as Module[],
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run test/site-content.test.ts`
Expected: PASS — all assertions green, including the new categoria/melyorPowered/categoriasModulos checks.

- [ ] **Step 6: Run the full suite to confirm no regressions**

Run: `npx vitest run`
Expected: all test files pass (this change only adds fields, doesn't remove any consumed by other tests).

- [ ] **Step 7: Commit**

```bash
git add content/site.ts test/site-content.test.ts
git commit -m "feat: add category grouping and Melyor-powered flag to modulos data"
```

---

### Task 2: Add "Potenciado por Melyor" badge to `ModuleCard.tsx`

**Files:**
- Modify: `components/ModuleCard.tsx:40-79` (the returned JSX)

**Interfaces:**
- Consumes: `module.melyorPowered?: boolean` from Task 1.
- Produces: no new exports — `ModuleCard` keeps its existing signature `{ module: Module }`.

- [ ] **Step 1: Add the badge markup**

In `components/ModuleCard.tsx`, the current JSX body (lines 40-79) ends the icon block, then renders the title `<h3>` and beneficio `<p>`. Insert a conditional badge between the icon block (ends `components/ModuleCard.tsx:72`) and the title (`components/ModuleCard.tsx:73`):

Change:

```tsx
        <Icon aria-hidden className="h-5 w-5 text-[var(--primary)] transition-colors group-hover:text-[var(--bronze)]" />
      </motion.div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">
        {module.titulo}
      </h3>
```

to:

```tsx
        <Icon aria-hidden className="h-5 w-5 text-[var(--primary)] transition-colors group-hover:text-[var(--bronze)]" />
      </motion.div>
      {module.melyorPowered && (
        <span className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-[var(--bronze)]/40 bg-[var(--bronze)]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--bronze)]">
          Potenciado por Melyor
        </span>
      )}
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">
        {module.titulo}
      </h3>
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Visual check**

Run: `npm run dev` (if not already running), open `http://localhost:3000#producto`. Confirm the badge appears only on the "CRM de clientes", "Alertas proactivas", "Reportes exportables", and "Compras inteligentes" cards, styled as a small bronze pill above the title, not crowding the icon or breaking card height alignment with cards in the same row that lack the badge.

- [ ] **Step 4: Commit**

```bash
git add components/ModuleCard.tsx
git commit -m "feat: add Potenciado por Melyor badge to module cards Melyor actually powers"
```

---

### Task 3: Restructure `ModulesGrid.tsx` into 3 category blocks

**Files:**
- Modify: `components/ModulesGrid.tsx` (full rewrite of the component body)

**Interfaces:**
- Consumes: `site.categoriasModulos: ModuloCategoria[]` and `site.modulos[].categoria` from Task 1.
- Produces: no new exports — `ModulesGrid` keeps its existing named export and `id="producto"` anchor (used by `Nav.tsx`).

- [ ] **Step 1: Rewrite the component**

Replace the full contents of `components/ModulesGrid.tsx` with:

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

        <div className="mt-12 flex flex-col gap-12">
          {site.categoriasModulos.map((categoria) => {
            const modulosDeCategoria = site.modulos.filter(
              (m) => m.categoria === categoria.id,
            );
            return (
              <div key={categoria.id}>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  {categoria.titulo}
                </h3>
                <motion.div
                  className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
                  variants={staggerContainer}
                  initial="hidden"
                  whileInView="visible"
                  viewport={VIEWPORT}
                >
                  {modulosDeCategoria.map((m) => (
                    <motion.div key={m.id} variants={fadeUp} className="h-full">
                      <ModuleCard module={m} />
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Visual check at 2 breakpoints**

Run: `npm run dev` (if not already running), open `http://localhost:3000#producto` at mobile (~375px) and desktop (~1280px) widths. Confirm: 3 category headings appear in order (Ventas y clientes, Inventario y bodega, Datos y control), each followed by exactly 4 cards; desktop shows 4 cards in one row per category, mobile stacks to 1 column; `id="producto"` anchor still scrolls correctly from the nav "Producto" link.

- [ ] **Step 4: Commit**

```bash
git add components/ModulesGrid.tsx
git commit -m "feat: group modules grid into 3 labeled categories instead of one flat grid"
```

---

### Task 4: Full-site verification pass

**Files:** none (verification only)

**Interfaces:** none

- [ ] **Step 1: Run full unit test suite**

Run: `npx vitest run`
Expected: all test files pass, including the updated `test/site-content.test.ts` from Task 1.

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: build completes with no type errors, no failed pages.

- [ ] **Step 3: Manual browser pass over the changed area**

With `npm run dev` running, visit `http://localhost:3000#producto` and check:
- 3 category headings render in the correct order with the correct titles.
- Each category shows exactly 4 cards.
- The Melyor badge appears on exactly 4 cards total across the whole grid: CRM de clientes, Alertas proactivas, Reportes exportables, Compras inteligentes — and nowhere else.
- Nav "Producto" link still scrolls to the right section.
- No layout regression in cards without the badge (title/beneficio still aligned consistently within a row).

- [ ] **Step 4: Run e2e suite**

Run: `npx playwright test e2e/waitlist.spec.ts`
Expected: PASS (confirms the waitlist flow on the same page still works after the DOM restructure).

No commit for this task — verification only. If any check fails, fix in the relevant task's files and re-run.

---

### Task 5: Push and deploy to production

**Files:** none

**Interfaces:** none

- [ ] **Step 1: Confirm all commits from Tasks 1-3 are on `main` and working tree is clean**

Run: `git status`
Expected: `nothing to commit, working tree clean` (aside from any pre-existing unrelated untracked files), current branch `main`.

- [ ] **Step 2: Push to remote**

Run: `git push`

- [ ] **Step 3: Deploy to production**

Use the same Vercel production deploy flow already established for this project (`vercel --prod`), then verify the deployment reaches `READY` state and spot-check `https://aureo-landing.vercel.app/#producto` in a browser for the 3 grouped categories and the 4 Melyor badges, same as the local verification in Task 4.
