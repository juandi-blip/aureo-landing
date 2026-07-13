# Modules grid grouping + Melyor badge — design spec

Date: 2026-07-12
Scope: `aureo-landing` only (Next.js marketing site).

## Context

Previous slice (`2026-07-12-landing-conversion-polish-design.md`) closed a set of screenshot-driven layout gaps, including growing `site.modulos` from 10 to 12 entries so its 3-column grid would close evenly. That fix worked structurally but created a new problem: 12 flat cards in a row now read as a "wall of features" — hard to scan, no hierarchy, and it buries the fact that some of these modules are powered by Melyor (the AI engine) rather than being plain CRUD screens.

This was raised as part of a broader 3-front conversion strategy (traction metrics, trust signals, Melyor-as-differentiator). Of those three:
- **Traction metrics** (front 1) is explicitly dropped for this round — the waitlist has zero real signups today, and inventing a number would be dishonest marketing. No spec work happens on this front until there's real data.
- **Trust signals via testimonials** (front 2) is explicitly dropped — no customers yet, nothing genuine to show. Other trust-signal ideas (guarantee, security page) are not part of this spec either; out of scope until raised again.
- **Melyor as differentiator** (front 3) is addressed by this spec, but narrowly: only the modules grid regroup + a "Powered by Melyor" badge on the cards Melyor actually touches. Broader reinforcement (Hero copy, Nav, a new ComparisonSection row) was explicitly deferred to a separate future session with its own design pass.

## Problem

`components/ModulesGrid.tsx` renders `site.modulos` (12 items) as a single flat 3-column grid. This reads as an undifferentiated list. It also gives no visual signal that 4 of these 12 features are backed by Melyor's real-time context (per `aureo/melyor.js`'s `buildMelyorContext`: KPI snapshot, low-stock/reorder-point products, proactive alerts, top clients by value) — a fact currently only surfaced in the separate `MelyorSection`, disconnected from the module list where a visitor is scanning concrete features.

## Decisions (confirmed with user)

1. Group the 12 modules into 3 categories of 4, each with its own heading, instead of one flat grid:
   - **Ventas y clientes**: `pos`, `crm`, `alertas`, `compras`
   - **Inventario y bodega**: `inventario`, `conteos`, `wms`, `reubicacion`
   - **Datos y control**: `abc`, `picking`, `reportes`, `permisos`
2. Add a small "Potenciado por Melyor" badge to the 4 module cards Melyor genuinely touches: `alertas`, `compras`, `crm`, `reportes`. This list is grounded in `aureo/melyor.js`'s `buildMelyorContext` (KPIs, low-stock/reorder suggestions, alerts, top-client cross-sell data) plus the pre-existing "Reportes que se explican solos" Melyor capability already in `site.melyor.capacidades` (not newly invented — it was already claimed in the Melyor section before this spec).
3. No changes to Hero, Nav, or ComparisonSection in this pass — explicitly deferred.
4. No traction-metric numbers, no testimonials, no new trust-signal content in this pass — explicitly deferred (front 1 and front 2 dropped for now, per user).

## Changes

### 1. `content/site.ts` — extend `Module` type and data

Extend the `Module` type (currently `{ id, titulo, beneficio, icono }`, `content/site.ts:1`):

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

Add `categoria` to all 12 existing entries in `site.modulos` (`content/site.ts:42-55`), and `melyorPowered: true` to exactly 4 of them (`alertas`, `compras`, `crm`, `reportes`). No other fields change — `titulo`, `beneficio`, `icono` stay exactly as they are today (verbatim, no copy rewrite in this pass).

Add a new top-level array, `categoriasModulos: ModuloCategoria[]`, placed immediately before `modulos`:

```ts
categoriasModulos: [
  { id: "ventas", titulo: "Ventas y clientes" },
  { id: "bodega", titulo: "Inventario y bodega" },
  { id: "datos", titulo: "Datos y control" },
] as ModuloCategoria[],
```

This keeps category display copy in `site.ts`, consistent with how every other section sources its text — not hardcoded in the component.

### 2. `components/ModulesGrid.tsx` — render 3 grouped blocks

Currently renders one `motion.div` grid of all 12 `ModuleCard`s (`components/ModulesGrid.tsx:17-29`). Change to: for each entry in `site.categoriasModulos`, render a heading (using the category's `titulo`, smaller than the section's main `SectionHeading` — e.g. an `h3`) followed by a grid containing only the 4 modules whose `categoria` matches, in their existing relative order from `site.modulos`. Reuse the existing `staggerContainer`/`fadeUp`/`VIEWPORT` motion pattern per category block (each category's grid animates in as its own stagger group, consistent with how the whole grid animates today).

Grid columns per category block: `sm:grid-cols-2 lg:grid-cols-4` (4 items closing evenly in one row at desktop width, 2×2 at tablet, 1 column at mobile) — this is a new column count for this component, chosen because each category now holds a fixed 4, not 12.

### 3. `components/ModuleCard.tsx` — badge for Melyor-powered modules

Add an optional badge rendered when `module.melyorPowered` is true. Reuse the visual style already established in `components/MelyorSection.tsx` for its "Exclusivo de Aureo" eyebrow badge (`border-[var(--bronze)]/40 bg-[var(--bronze)]/10 text-[var(--bronze)]`, small rounded-full pill, uppercase tracking-wide text) — same tokens, same visual language, just relocated onto the module card. Badge text: "Potenciado por Melyor". Position: top of the card body, above or beside the icon — exact placement left to the implementer to match the card's existing internal spacing, as long as it doesn't crowd the icon or push the title down awkwardly on narrow cards.

### 4. `test/site-content.test.ts` — updated assertions

Update the `site.modulos` describe block to also verify:
- Every module has a `categoria` that is one of `"ventas" | "bodega" | "datos"`.
- Each of the 3 categories has exactly 4 modules (grouping is balanced, matches the spec's assignment).
- Exactly 4 modules have `melyorPowered === true`, and they are exactly `alertas`, `compras`, `crm`, `reportes` (not a different 4).
- `site.categoriasModulos` has exactly 3 entries with non-empty `titulo`.

## Testing / verification

- Visual check: 3 category blocks render with correct headings, each showing exactly 4 cards, at `sm`, `lg` breakpoints (browser).
- Visual check: the "Potenciado por Melyor" badge appears only on `alertas`, `compras`, `crm`, `reportes` cards, and its styling matches the reused bronze pill pattern (no visual regression to the rest of the card).
- `npx vitest run` and `npx tsc --noEmit` and `npm run build` all pass clean.
- No regression to `id="producto"` nav anchor (unchanged, still on the outer `<section>`).

## Explicitly not doing

- No traction-metric content (waitlist counts or otherwise) — dropped, no real data exists today.
- No testimonials or other new trust-signal content — dropped, no customers exist today.
- No Hero, Nav, or ComparisonSection changes to reinforce Melyor further — deferred to a separate future session with its own design pass.
- No rewrite of any module's `titulo`/`beneficio` copy — this pass only adds `categoria` and `melyorPowered` fields and changes layout, not the existing verified copy.
