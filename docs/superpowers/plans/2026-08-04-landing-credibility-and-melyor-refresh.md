# Landing Credibility Audit + Melyor Visual Refresh — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close three concrete credibility gaps on the `aureo-landing` marketing site (a vague waitlist-risk FAQ objection, a buried legal-location fact, and a text-only Melyor section that doesn't show the product's real, recently-shipped visual identity) — without touching login/auth, which stays out of scope per the design spec.

**Architecture:** Content-only changes to `content/site.ts` (the single source of truth every landing component reads from, per existing pattern) plus one component restructure (`MelyorSection.tsx`) to display two real screenshots captured from the `aureo-demo` prototype. No new dependencies, no new backend routes, no test infra beyond the existing Vitest content tests in `test/site-content.test.ts`.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind v4, `next/image`, Vitest.

## Global Constraints

- Design spec: `docs/superpowers/specs/2026-08-04-landing-credibility-and-melyor-refresh-design.md`.
- No login/"Iniciar sesión" is added anywhere (confirmed decision).
- No mention of a mobile app / Play Store anywhere in the landing.
- No fabricated social proof — `fundadores.socialProofPlaceholder` stays as-is; do not invent numbers or testimonials.
- No founder photos in this cycle.
- `SecuritySection` stays disabled — do not touch `app/page.tsx`'s commented import or `components/SecuritySection.tsx`.
- All new/changed user-facing copy is in Spanish (Colombia), matching the existing tone in `content/site.ts` (informal "tú/vos"-neutral, direct, no corporate jargon).
- `aureo-demo` (`D:\juandiplay\aureoapp\aureo-demo`) has **no git repository** — the one temporary edit Task 4 makes there (commenting out a single `<script>` line to bypass the demo gate for local capture) must be restored to its exact original text before the task is considered done; there is no `git checkout` safety net.

---

### Task 1: FAQ entry for the "what if the launch stalls" objection

**Files:**
- Modify: `content/site.ts:223-231` (the `faq` array)
- Test: `test/site-content.test.ts`

**Interfaces:**
- Consumes: existing `FaqItem = { pregunta: string; respuesta: string }` type (`content/site.ts:18`), existing `site.faq` array rendered by `components/FAQ.tsx` (no changes needed there — it already maps over `site.faq`).
- Produces: nothing new consumed by later tasks.

- [ ] **Step 1: Write the failing test**

Add to `test/site-content.test.ts` (new `describe` block, after the existing `site.contacto` block):

```ts
describe("site.faq", () => {
  it("tiene 8 preguntas, incluyendo la objeción de riesgo de la waitlist", () => {
    expect(site.faq).toHaveLength(8);
    const preguntas = site.faq.map((f) => f.pregunta.toLowerCase());
    expect(preguntas.some((p) => p.includes("tarda") || p.includes("retras") || p.includes("no llega"))).toBe(true);
  });

  it("la respuesta de riesgo de waitlist no promete nada que el producto no ofrece hoy (sin mención de tarjeta ni pago)", () => {
    const item = site.faq.find((f) => f.pregunta.toLowerCase().includes("tarda"));
    expect(item).toBeDefined();
    expect(item!.respuesta.toLowerCase()).not.toContain("reembolso");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `site.faq` has length 7, not 8, and no item matches "tarda/retras/no llega".

- [ ] **Step 3: Add the FAQ entry**

In `content/site.ts`, inside the `faq` array, add a new entry right after the `"¿Cuándo estará disponible?"` item (currently the last one, `content/site.ts:230`):

```ts
    { pregunta: "¿Qué pasa si me uno a la lista de espera y el lanzamiento tarda?", respuesta: "No arriesgas nada: anotarte no cuesta nada ni pide tarjeta. Mientras tanto tu precio de fundador queda reservado y congelado para cuando lancemos — cuanto antes te unas, mejor precio aseguras." },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add content/site.ts test/site-content.test.ts
git commit -m "content: add FAQ entry addressing waitlist-delay objection"
```

---

### Task 2: Surface "operates from Colombia" in the footer

**Files:**
- Modify: `content/site.ts:238-241` (the `footer` object)
- Modify: `components/Footer.tsx:61` (render the new field)
- Test: `test/site-content.test.ts`

**Interfaces:**
- Consumes: existing `site.footer` object, existing `Footer.tsx` structure (renders `site.footer.derechos` in a `<p>` at line 61).
- Produces: `site.footer.ubicacion: string`, consumed only by `Footer.tsx` in this task.

- [ ] **Step 1: Write the failing test**

Add to `test/site-content.test.ts`:

```ts
describe("site.footer", () => {
  it("menciona que Aureo opera desde Colombia", () => {
    expect(site.footer.ubicacion.toLowerCase()).toContain("colombia");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `site.footer.ubicacion` is `undefined`, `.toLowerCase()` throws.

- [ ] **Step 3: Add the field and render it**

In `content/site.ts`, update the `footer` object:

```ts
  footer: {
    tagline: "Inteligencia logística para tu negocio.",
    derechos: "© 2026 Aureo. Todos los derechos reservados.",
    ubicacion: "Operamos desde Colombia.",
  },
```

In `components/Footer.tsx`, change line 61 from:

```tsx
        <p className="text-xs text-[var(--text-muted)]">{site.footer.derechos}</p>
```

to:

```tsx
        <p className="text-xs text-[var(--text-muted)]">
          {site.footer.derechos} · {site.footer.ubicacion}
        </p>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 5: Visual check**

Run: `pnpm dev`, open `http://localhost:3001`, scroll to the footer. Confirm "© 2026 Aureo. Todos los derechos reservados. · Operamos desde Colombia." renders on one line on desktop and wraps cleanly on mobile width (375px).

- [ ] **Step 6: Commit**

```bash
git add content/site.ts components/Footer.tsx test/site-content.test.ts
git commit -m "content: surface Colombia location in the footer"
```

---

### Task 3: Trim and refocus Melyor's capabilities copy

**Files:**
- Modify: `content/site.ts:89-97` (`melyor.capacidades` and `melyor.nota`)
- Modify: `test/site-content.test.ts:58-60` (existing test, currently asserts length 6)

**Interfaces:**
- Consumes: existing `site.melyor` shape (no type change — still `{ titulo: string; texto: string }[]`).
- Produces: `site.melyor.capacidades` with exactly 4 items in this order: "Pregúntale directamente", "Cifras exactas, al instante", "Alertas antes de que duelan", "Compras óptimas". Task 5 (`MelyorSection.tsx`) consumes this exact order to map against a 4-item icon array.

- [ ] **Step 1: Update the existing test's expectation**

In `test/site-content.test.ts`, change:

```ts
  it("tiene 6 capacidades mapeadas a los módulos reales", () => {
    expect(site.melyor.capacidades).toHaveLength(6);
  });
```

to:

```ts
  it("tiene 4 capacidades mapeadas a los módulos reales, en el orden que consume MelyorSection", () => {
    expect(site.melyor.capacidades.map((c) => c.titulo)).toEqual([
      "Pregúntale directamente",
      "Cifras exactas, al instante",
      "Alertas antes de que duelan",
      "Compras óptimas",
    ]);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `site.melyor.capacidades` still has 6 items in the old order.

- [ ] **Step 3: Update `melyor.capacidades` and `melyor.nota`**

In `content/site.ts`, replace the `capacidades` array (lines 89-96) with:

```ts
    capacidades: [
      { titulo: "Pregúntale directamente", texto: "Chatea con Melyor sobre stock bajo, clientes inactivos o facturas pendientes, en lenguaje natural." },
      { titulo: "Cifras exactas, al instante", texto: "Pregunta tu facturación, cantidad de facturas o stock total y te responde con el número real del momento — sin buscar en menús ni filtros." },
      { titulo: "Alertas antes de que duelan", texto: "Vigila tu stock, tus clientes inactivos y tus facturas pendientes — y te avisa antes de que se conviertan en un problema." },
      { titulo: "Compras óptimas", texto: "Sugiere cuánto y cuándo reabastecer según tu demanda real, y arma la orden de compra por ti." },
    ],
```

Update `nota` (line 97) from:

```ts
    nota: "Incluido en Aureo. Se activa junto con tu cuenta — sin configuración adicional.",
```

to:

```ts
    nota: "Incluido en Aureo, mejorando semana a semana. Se activa junto con tu cuenta — sin configuración adicional.",
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test`
Expected: PASS. Also confirm the pre-existing test `"ninguna capacidad implica que el dashboard es prescindible"` (`test/site-content.test.ts:62-66`) still passes — none of the 4 kept texts mention "sin abrir el dashboard".

- [ ] **Step 5: Commit**

```bash
git add content/site.ts test/site-content.test.ts
git commit -m "content: trim Melyor capabilities to 4, refocused on chat + data"
```

---

### Task 4: Capture two real Melyor screenshots from `aureo-demo`

This task produces two static image files. It involves one temporary, single-line edit to `aureo-demo/index.html` (which has no git repository — there's no safety net, so the exact restoration in Step 6 is mandatory) to bypass the token gate for local capture, and does not modify anything in `aureo-landing` itself.

**Files:**
- Create: `D:\juandiplay\aureoapp\aureo-landing\public\melyor-panel-empty.png`
- Create: `D:\juandiplay\aureoapp\aureo-landing\public\melyor-panel-card.png`

**Interfaces:**
- Produces: two image files at the paths above, consumed by Task 5's `<Image src="/melyor-panel-empty.png" .../>` and `<Image src="/melyor-panel-card.png" .../>`.

- [ ] **Step 1: Serve `aureo-demo` locally**

```bash
cd D:\juandiplay\aureoapp\aureo-demo
npx http-server . -p 8181 -c-1
```

Leave this running. `AI_MOCK_MODE` in `melyor.js` stays `false` — it is never used for this capture, since Step 4 below injects the conversation directly instead of sending a real chat message.

- [ ] **Step 2: Temporarily disable the token gate (one line, easy to restore)**

`demo-gate.js` redirects synchronously the instant `index.html` loads if there's no valid session or token (`aureo-demo/demo-gate.js:53-57` — `if (!token) { redirectToLanding("required"); return; }`), before any console command could run. There is no token available locally (minting a real one would require running `aureo-demo`'s `/api/verify-demo-token.js` under `vercel dev`, not a plain static server — out of proportion for a screenshot). Instead, comment out the gate for the duration of this capture only.

In `D:\juandiplay\aureoapp\aureo-demo\index.html`, line 5 is exactly:

```html
    <script src="demo-gate.js"></script>
```

Change it to:

```html
    <!-- TEMP: disabled for local screenshot capture, see Task 4 Step 2 of docs/superpowers/plans/2026-08-04-landing-credibility-and-melyor-refresh.md — restore before finishing this task -->
    <!-- <script src="demo-gate.js"></script> -->
```

- [ ] **Step 3: Open the demo**

Using browser automation (e.g. `mcp__claude-in-chrome__navigate` or Playwright), navigate to `http://localhost:8181/index.html`. With the gate disabled, `auth.js`'s `guardImmediate()` auto-creates an admin session (`aureo-demo/auth.js:168-191` — no session found → logs in as the `admin` user from `VULCAN_USERS`) and the dashboard loads directly, no login click needed.

- [ ] **Step 4: Screenshot 1 — empty-state panel with suggestion chips**

Resize the browser viewport to 1440x900. Click the Melyor trigger in the header to open the panel. With no messages sent yet, `renderMelyorMessages()` shows the empty state with the 3 suggestion chips (`content/site.ts` is irrelevant here — these chips are hardcoded in `aureo-demo/melyor.js:33-37` as `MELYOR_EMPTY_SUGGESTIONS`). Take a full-viewport screenshot. Save it as `D:\juandiplay\aureoapp\aureo-landing\public\melyor-panel-empty.png`.

- [ ] **Step 5: Screenshot 2 — a reply with a data card and a suggestion chip**

With the panel still open, run this in the browser console (these are global top-level `let`/`function` bindings in the non-module script `melyor.js`, reachable by name from the console on the same page):

```js
melyorMessages = [
  { role: "user", text: "¿Qué productos están bajo stock?" },
  { role: "assistant", text: "**Productos bajo el punto de reorden**\n- Tornillo autorroscante 1\" — 8 unidades (mínimo 20)\n- Cable eléctrico 12 AWG — 3 unidades (mínimo 10)\n- Guantes de nitrilo talla M — 12 unidades (mínimo 25)\nSUGERENCIA: Generar orden de compra para estos productos" },
];
renderMelyorMessages();
```

This renders a user bubble, an assistant bubble with the bold-title + list rendered as a data card (via `renderMelyorCard`, `melyor.js:269`), and a clickable suggestion chip below it (via the `SUGERENCIA:` marker parsed in `renderMelyorMarkdown`, `melyor.js:205-212`). Take a full-viewport screenshot at the same 1440x900 size. Save it as `D:\juandiplay\aureoapp\aureo-landing\public\melyor-panel-card.png`.

- [ ] **Step 6: Restore `index.html` and stop the server**

Undo Step 2 exactly: in `D:\juandiplay\aureoapp\aureo-demo\index.html`, replace the two commented-out lines back with the original single line:

```html
    <script src="demo-gate.js"></script>
```

Run `grep -n "demo-gate" D:\juandiplay\aureoapp\aureo-demo\index.html` and confirm the output is exactly `5:    <script src="demo-gate.js"></script>` — one line, uncommented, at line 5, matching the original. Then stop the `http-server` process (Ctrl+C).

- [ ] **Step 7: Verify the files**

```bash
cd D:\juandiplay\aureoapp\aureo-landing
ls -la public/melyor-panel-empty.png public/melyor-panel-card.png
```

Expected: both files exist, each a few hundred KB at most (a 1440x900 PNG screenshot). If either is unreasonably small (<10KB, likely a blank/broken capture) or huge (>3MB, needs compression), redo the capture or run it through an image optimizer before proceeding to Task 5.

- [ ] **Step 8: Commit**

```bash
git add public/melyor-panel-empty.png public/melyor-panel-card.png
git commit -m "assets: add Melyor panel screenshots for the landing"
```

---

### Task 5: Restructure `MelyorSection.tsx` to show the real panel

**Files:**
- Modify: `components/MelyorSection.tsx`

**Interfaces:**
- Consumes: `site.melyor.capacidades` (4 items, exact order from Task 3), `public/melyor-panel-empty.png` and `public/melyor-panel-card.png` (from Task 4).
- Produces: nothing consumed by later tasks (this is the last task in this plan).

- [ ] **Step 1: Update imports**

In `components/MelyorSection.tsx`, replace:

```tsx
import { ShoppingBag, Bell, Users, FileText, MessageCircle, Zap } from "lucide-react";
```

with:

```tsx
import Image from "next/image";
import { ShoppingBag, Bell, MessageCircle, Zap } from "lucide-react";
```

(`Users` and `FileText` are dropped — they matched the two capabilities removed in Task 3.)

Update the icon array right below the imports from:

```tsx
const CAPABILITY_ICONS = [ShoppingBag, Bell, Users, FileText, MessageCircle, Zap];
```

to:

```tsx
const CAPABILITY_ICONS = [MessageCircle, Zap, Bell, ShoppingBag];
```

This order matches the 4 `capacidades` from Task 3 exactly: "Pregúntale directamente" → `MessageCircle`, "Cifras exactas, al instante" → `Zap`, "Alertas antes de que duelan" → `Bell`, "Compras óptimas" → `ShoppingBag`.

- [ ] **Step 2: Insert the screenshots between the intro paragraph and the capabilities grid**

In `components/MelyorSection.tsx`, immediately after the closing `</div>` of the intro block (the `<div className="mx-auto max-w-2xl text-center">...</div>`, right before the `<motion.div className="mt-14 grid gap-5 sm:grid-cols-2" ...>` that renders the capabilities), insert:

```tsx
        <motion.div
          className="mx-auto mt-14 grid max-w-4xl gap-4 sm:grid-cols-2"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          <motion.div
            variants={fadeUp}
            className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--bronze)]/30 shadow-lg"
          >
            <Image
              src="/melyor-panel-empty.png"
              alt="Panel de Melyor abierto, con sugerencias de preguntas frecuentes"
              fill
              className="object-cover object-right"
              sizes="(min-width: 640px) 50vw, 100vw"
            />
          </motion.div>
          <motion.div
            variants={fadeUp}
            className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--bronze)]/30 shadow-lg"
          >
            <Image
              src="/melyor-panel-card.png"
              alt="Melyor respondiendo con una tarjeta de datos de stock bajo y una acción sugerida"
              fill
              className="object-cover object-right"
              sizes="(min-width: 640px) 50vw, 100vw"
            />
          </motion.div>
        </motion.div>
```

- [ ] **Step 3: Reduce the capabilities grid to a tighter, secondary role**

The existing capabilities `<motion.div>` (currently `className="mt-14 grid gap-5 sm:grid-cols-2"`) now follows the screenshots instead of the intro directly. Change its top margin so it reads as a secondary block, not a second hero: change `mt-14` to `mt-8`. No other change needed here — it already maps over `site.melyor.capacidades`, which Task 3 already trimmed to 4 items, and `CAPABILITY_ICONS` from Step 1 already has matching length.

- [ ] **Step 4: Visual check**

Run: `pnpm dev`, open `http://localhost:3001`, scroll to the Melyor section. Confirm:
- Both screenshots render at a consistent size, cropped to feature the right-hand panel (`object-right`), with no layout shift or broken image icon.
- On mobile width (375px), the two screenshots stack in one column and the section doesn't overflow horizontally.
- The 4 capability cards below still render with their (now 4, not 6) icons correctly matched to their titles.

- [ ] **Step 5: Run the full check before committing**

```bash
pnpm test
pnpm lint
```

Expected: both pass — `lint` catches any leftover unused import (e.g. if `Users`/`FileText` removal was incomplete).

- [ ] **Step 6: Commit**

```bash
git add components/MelyorSection.tsx
git commit -m "feat: show real Melyor panel screenshots in MelyorSection"
```

---

## Post-plan verification

- [ ] Run `pnpm test` once more from a clean state — all of `test/site-content.test.ts` (plus the untouched existing suites) pass.
- [ ] Run `pnpm build` to confirm `next/image` with local `public/` sources and the new content don't break the production build.
- [ ] Manually re-read `content/site.ts`'s `faq`, `footer`, and `melyor` sections end to end to confirm no copy contradicts `preciosNota` / `garantias` (per the design spec's testing note).
