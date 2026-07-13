# Landing conversion polish — design spec

Date: 2026-07-12
Scope: `aureo-landing` only (Next.js marketing site). No app (`aureo/`) changes in this spec.

## Context

Previous round covered security/legal/responsive/tests/deploy for both `aureo` and `aureo-landing`; both are on `main`, pushed, landing live at https://aureo-landing.vercel.app (public, SSO off). Remaining conversion work was tracked in 3 fronts (metrics/traction, trust signals, Melyor as differentiator). This spec addresses a narrower, concrete slice raised from screenshot review: three layout/content gaps that make the landing look unfinished. It does not attempt the full 3-front strategy — only these fixes.

Out of scope (explicitly deferred by user to a later conversation): repositioning/making movable the Melyor chat widget inside the `aureo` app itself, and any deeper rework of Melyor's positioning as "AI engine, not chatbot" beyond the copy already covered here.

## Problems identified (from screenshots)

1. `ModulesGrid` renders `site.modulos` (10 items) in a `sm:grid-cols-2 lg:grid-cols-3` grid. 10 mod 3 leaves 1 orphan card alone in the last row — visibly empty space beside it.
2. `MelyorSection` renders `site.melyor.capacidades` (5 items) in a `sm:grid-cols-2` grid. 5 mod 2 leaves 1 orphan card alone in the last row.
3. `ContactSection` (`¿Hablamos?`) is a single centered column: heading, one paragraph, two buttons. Visually flat compared to neighboring sections that use `GrainOverlay`/`SpotlightGlow`/cards.

## Decisions (confirmed with user)

- Fill both grid gaps with **real, already-implemented features/capabilities** pulled from the actual codebase — not filler copy, not layout hacks. Verified by direct agent code reads of `aureo/inventory.js`, `aureo/permissions.js`, `aureo/melyor.js`, `aureo/api/melyor-chat.js`.
- Contact section gets a genuine visual upgrade (split panel), not just copy padding.
- Rejected the "Cifras exactas, al instante" framing risk: user correctly flagged that "sin abrir el dashboard" would undercut the site's own dashboard/heatmap sales pitch (`DemoSection` promotes the dashboard as a differentiator). Reframed to compete with **navigation friction**, not with the dashboard's visual value.

## Changes

### 1. `content/site.ts` — `modulos` array (10 → 12)

Append two entries to `Module[]`, after `compras` (keep existing order untouched):

```ts
{ id: "conteos", titulo: "Conteos físicos", beneficio: "Programa conteos físicos, detecta diferencias y concilia el stock sin parar la operación.", icono: "clipboard-check" },
{ id: "permisos", titulo: "Permisos por rol", beneficio: "Define qué ve cada rol del equipo, módulo por módulo, sin tocar una línea de código.", icono: "shield" },
```

Grounded in: `inventory.js` conteos/reconteos sub-tabs with conciliación workflow; `permissions.js` role × module matrix enforced by `auth.js`.

### 2. `components/ModuleCard.tsx` — icon map

Import `ClipboardCheck, Shield` from `lucide-react`, add to `ICON_MAP`:

```ts
"clipboard-check": ClipboardCheck,
shield: Shield,
```

No other changes to `ModuleCard.tsx`. `ModulesGrid.tsx` needs no changes — `lg:grid-cols-3` now divides 12 evenly (4 rows × 3), no orphan.

### 3. `content/site.ts` — `melyor.capacidades` array (5 → 6)

Append as 6th entry:

```ts
{ titulo: "Cifras exactas, al instante", texto: "Pregunta tu facturación, cantidad de facturas o stock total y te responde con el número real del momento — sin buscar en menús ni filtros." },
```

Grounded in: `melyor.js` `buildMelyorContext()` pulling live KPI snapshot (paid billing, invoice count, total stock units) into the prompt — verified real, not aspirational.

Framing note: deliberately does NOT say "sin abrir el dashboard" — that would compete with `DemoSection`'s pitch that the dashboard/heatmap is the product's visual differentiator. Instead frames the win as skipping menu/filter navigation, positioning Melyor as a faster path to the same trustworthy data, not a dashboard replacement.

### 4. `components/MelyorSection.tsx` — icon list

Add `Zap` to the `lucide-react` import and to `CAPABILITY_ICONS`:

```ts
const CAPABILITY_ICONS = [ShoppingBag, Bell, Users, FileText, MessageCircle, Zap];
```

No layout change needed — `sm:grid-cols-2` with 6 items already closes evenly (3 full rows).

### 5. `components/ContactSection.tsx` — split panel redesign

Restructure from single centered column to a two-column layout on `lg:` breakpoints (stacks on mobile). Section stays light (`bg-[var(--bg-subtle)]`, see resolved rhythm question below) — the visual upgrade comes from the split layout and the elevated trust-points card, not from a dark/grain treatment.

- **Resolved during self-review, corrected post-implementation (final review caught the actual order):** checked `app/page.tsx` section order — actual sequence is `ModulesGrid → DemoSection → FoundersStory → PricingTable → FAQ → ContactSection → FinalCTA`. `FAQ` (light, `bg-subtle`) precedes `ContactSection`, and `FinalCTA` (`bg-[var(--bg-navy)]`) follows it. Switching `ContactSection` to navy would stack it navy-on-navy against `FinalCTA` right after it, still breaking rhythm. **Decision: keep `bg-[var(--bg-subtle)]` (light)** and use a light-styled elevated card for the right column instead of the navy/grain pattern.
- Left column: existing heading (`SectionHeading`, no `light` prop since section stays light), paragraph, and the two CTA buttons (WhatsApp / email) — left-aligned instead of centered.
- Right column: an elevated card (`border border-[var(--border-subtle)] bg-[var(--bg-surface)] rounded-[var(--radius-lg)]` — same token pattern as `ModuleCard.tsx`, since this section is light-themed) containing 3 trust points, each with a small icon + one line, using real/true claims only:
  - "Respuesta el mismo día" (icon: `Clock`) — already promised in existing copy, now surfaced visually.
  - "Hablas directo con los fundadores — no un bot de soporte" (icon: `Users`) — true differentiator, ties into founder-led trust.
  - "Sin compromiso, sin tarjeta" (icon: `ShieldCheck`) — consistent with `preciosTrial`/`earlyBird` copy already on the site (no payment gate yet).
- No new copy needed in `site.ts` beyond these 3 short labels — add them as a small array either inline in the component or as `site.contacto.confianza` in `site.ts` for consistency with how other sections source copy from `site.ts`. **Decision: add to `site.ts`** to match existing convention (every other section sources text from `site`, not inline).

New `site.ts` addition:

```ts
contacto: {
  confianza: [
    { titulo: "Respuesta el mismo día", icono: "clock" },
    { titulo: "Hablas directo con los fundadores — no un bot de soporte", icono: "users" },
    { titulo: "Sin compromiso, sin tarjeta", icono: "shield-check" },
  ],
},
```

## Testing / verification

- Visual check both grids render without orphan cards at `sm`, `lg` breakpoints (browser, both light `ModulesGrid` and dark `MelyorSection`).
- Visual check `ContactSection` split panel at mobile (stacks to single column), tablet, and desktop widths.
- Confirm no TypeScript errors (`Module`/`site` type additions are additive, non-breaking).
- Confirm existing e2e/unit tests (if any target these components) still pass.
- Run project's lint/build before commit.

## Explicitly not doing

- Not touching the Melyor chat widget position/behavior inside the `aureo` app — deferred to a separate future conversation per user's own instruction.
- Not adding the 3rd candidate module (Excel import) or the 2nd candidate Melyor capability (conversation memory) — user picked one path each; the others are documented above only as rejected alternatives for future reference.
- Not building out the full "3 fronts" conversion strategy (metrics/traction data, broader trust/social-proof page, full Melyor-as-engine repositioning) — this spec is the narrow screenshot-driven slice only.
