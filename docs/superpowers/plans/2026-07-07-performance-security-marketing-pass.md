# Performance, Security & Marketing Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the highest-impact findings from the Fable audit (`docs/superpowers/audits/2026-07-07-fable-performance-security-marketing.md` — not created as a file; findings are summarized per-task below) that the user approved: fix the hero's LCP-blocking hydration gate, close two one-line security gaps, remove a redundant JS animation, build a real referral mechanism (replacing a promise the code didn't keep), add real founder names, cover the top sales objection in FAQ, sharpen the comparison table against the real competitor (Siigo/Alegra), and surface the demo CTA earlier.

**Architecture:** No new dependencies, no Supabase schema changes. Hero's title/subtitle/form become CSS-animated (not framer-motion-gated) so they're visible in the initial SSR HTML regardless of hydration timing. Referral tracking reuses the existing `origen` text column (no migration) by appending `:ref:<code>` to it, and reuses the existing per-signup Supabase row id (the anti-IDOR token, already returned by POST) as the shareable referral code.

**Tech Stack:** Next.js App Router (Turbopack), Tailwind v4 CSS variables, motion/react, Supabase, vitest, Playwright.

## Global Constraints

- Spanish copy only, matching existing tone (`.agents/product-marketing.md`): dolor cotidiano > jerga, trato de "tú", sin humo.
- No Supabase schema changes — reuse the existing `origen` column (max 60 chars, enforced by `MAX_ORIGEN` in `lib/validation.ts:14`) for referral attribution.
- No new npm/pnpm dependencies.
- Do not fabricate business facts. Do not add customer counts or testimonials — user explicitly said omit for this pass. Founder names are real, provided by the user: **Leif Guy Florez** (CEO) and **Juan David Florez** (CEO).
- Every task ends green on `pnpm tsc --noEmit` and `pnpm build`. Tasks touching `lib/` or `app/api/` also need `pnpm vitest run` green. Tasks touching the waitlist flow end-to-end need `pnpm exec playwright test` green.
- Reuse existing design tokens (`var(--bronze)`, `var(--emerald)`, `var(--bg-base)`, `var(--text-primary)`, `var(--text-secondary)`, `var(--border-subtle)`) — no new hardcoded colors.
- `prefers-reduced-motion` must still be respected for any new CSS animation (media query, not JS).

---

### Task 1: Hero — make title/subtitle/form visible without JS (LCP fix)

**Problem (Fable audit, HIGH):** `components/Hero.tsx:60-116` renders the `<h1>`, subtitle, and form wrapper as `motion.span`/`motion.p`/`motion.div` with `initial={{ opacity: 0, y: "110%" }}`. Framer Motion serializes that `initial` state into the SSR HTML. Until React hydrates and runs the `animate` transition, the LCP content is literally invisible — on a slow connection or a JS failure, the hero is blank.

**Files:**
- Modify: `app/globals.css` (add keyframes + utility classes near the existing animation utilities, e.g. after the `.gold-card-border` block around line 277)
- Modify: `components/Hero.tsx:60-116`

**Interfaces:**
- Consumes: existing `HERO_TIMING` delays from `lib/motion.ts:48-68` (reused as animation-delay values, not framer transition delays)
- Produces: `.hero-line-1`, `.hero-line-2`, `.hero-fade-subtitle`, `.hero-fade-form` CSS classes usable by any future hero variant

- [ ] **Step 1: Add CSS entrance keyframes to globals.css**

Insert after the `.gold-card-border-dim::after` rule (around line 277):

```css
/* Hero entrance — CSS-driven so LCP content paints without waiting for JS hydration */
@keyframes hero-line-reveal {
  from { opacity: 0; transform: translateY(110%); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes hero-fade-up {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

.hero-line {
  display: block;
  animation: hero-line-reveal 0.65s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.hero-line-1 { animation-delay: 0.2s; }
.hero-line-2 { animation-delay: 0.38s; }

.hero-fade { animation: hero-fade-up 0.55s cubic-bezier(0.22, 1, 0.36, 1) both; }
.hero-fade-subtitle { animation-delay: 0.58s; }
.hero-fade-form { animation-delay: 0.72s; }

@media (prefers-reduced-motion: reduce) {
  .hero-line, .hero-fade {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
```

- [ ] **Step 2: Replace the framer-motion title lines with CSS-animated spans**

In `components/Hero.tsx`, replace the `<h1>` block (lines 60-84):

```tsx
            <h1 className="relative z-10 font-display text-[2.35rem] font-extrabold leading-[1.06] tracking-tight text-[var(--text-primary)] sm:text-5xl lg:text-[3rem] lg:leading-[1.08] xl:text-[3.5rem]">
              {site.hero.tituloLineas.map((line, i) => (
                <span key={line} className="block overflow-hidden">
                  <span className={`hero-line ${i === 0 ? "hero-line-1" : "hero-line-2"}`}>
                    {line}
                  </span>
                </span>
              ))}
            </h1>
```

- [ ] **Step 3: Replace the framer-motion subtitle with a CSS-animated paragraph**

Replace the `motion.p` block (lines 95-102):

```tsx
          <p className="hero-fade hero-fade-subtitle mt-5 max-w-md text-base leading-relaxed text-[var(--text-secondary)] md:mt-6 md:text-lg">
            {site.hero.subtitulo}
          </p>
```

- [ ] **Step 4: Replace the framer-motion form wrapper with a CSS-animated div**

Replace the `motion.div` block (lines 104-116):

```tsx
          <div className="hero-fade hero-fade-form mt-7 md:mt-8">
            <WaitlistForm origen="hero" onStepChange={setFormStep} />
            {formStep === "email" && (
              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                {site.hero.nota}
              </p>
            )}
          </div>
```

- [ ] **Step 5: Verify `reduce` is still used (bronze underline + ring + particles + dashboard keep framer motion) — no unused-variable lint error**

Run: `pnpm lint`
Expected: no errors. `reduce` is still read at lines 41, 65 (ring `!reduce` check — now only guards the SVG ring, title lines no longer reference it), 97-99 (bronze underline), 122-133 (dashboard). If `reduce` becomes unused anywhere, remove that specific dead branch — do not delete the `useReducedMotion()` call itself since the ring/dashboard still need it.

- [ ] **Step 6: Build and typecheck**

Run: `pnpm tsc --noEmit && pnpm build`
Expected: both succeed, no errors.

- [ ] **Step 7: Manual check — view source shows visible hero text**

Run: `pnpm build && pnpm start` (or `pnpm dev`), then `curl -s http://localhost:3000 | grep -o 'hero-line[^"]*'` to confirm the classes are present in the raw (non-hydrated) HTML output, proving the text is not gated behind an `opacity:0` inline style.

- [ ] **Step 8: Commit**

```bash
git add app/globals.css components/Hero.tsx
git commit -m "perf(hero): anima titulo/subtitulo/form con CSS en vez de framer-motion

El contenido LCP quedaba con opacity:0 en el HTML servido hasta que
React hidrataba. Con animacion CSS pura el navegador la corre sin
esperar JS."
```

---

### Task 2: Security — cover PATCH with BotID, warn on missing rate limiter

**Problem (Fable audit, MINOR x2):**
- `instrumentation-client.ts:6` only registers BotID challenge for `POST /api/waitlist`. The API's `PATCH` handler also calls `checkBotId()` (`app/api/waitlist/route.ts:116-118` via `runGuards`), but without the matching client-side challenge registration it silently no-ops.
- `lib/ratelimit.ts:24` returns `true` (unlimited) with no signal when Upstash env vars are missing/misconfigured in production — a misconfiguration would be invisible.

**Files:**
- Modify: `instrumentation-client.ts`
- Modify: `lib/ratelimit.ts`
- Test: `test/ratelimit.test.ts` (create)

**Interfaces:**
- Consumes: `process.env.UPSTASH_REDIS_REST_URL`, `process.env.UPSTASH_REDIS_REST_TOKEN`, `process.env.NODE_ENV`
- Produces: no signature change to `checkRateLimit(ip: string): Promise<boolean>` or `getClientIp(request: Request): string`

- [ ] **Step 1: Write the failing test for the warn-on-missing-config behavior**

Create `test/ratelimit.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("checkRateLimit", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env.NODE_ENV = "production";
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("warns once and allows the request when Upstash is not configured in production", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { checkRateLimit } = await import("@/lib/ratelimit");
    const allowed = await checkRateLimit("1.2.3.4");
    expect(allowed).toBe(true);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Upstash no configurado")
    );
  });

  it("does not warn in non-production when Upstash is not configured", async () => {
    process.env.NODE_ENV = "test";
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { checkRateLimit } = await import("@/lib/ratelimit");
    await checkRateLimit("1.2.3.4");
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run test/ratelimit.test.ts`
Expected: FAIL — `warnSpy` not called (current code has no warn).

- [ ] **Step 3: Add the warn to `getRatelimit()`**

In `lib/ratelimit.ts`, replace the body of `getRatelimit`:

```ts
function getRatelimit(): Ratelimit | null {
  if (ratelimit) return ratelimit;
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token || !url.startsWith("https")) {
    if (process.env.NODE_ENV === "production") {
      console.warn("[ratelimit] Upstash no configurado — /api/waitlist queda sin límite de tasa.");
    }
    return null;
  }
  ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(5, "60 s"),
    analytics: true,
    prefix: "waitlist",
  });
  return ratelimit;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run test/ratelimit.test.ts`
Expected: PASS (2/2).

- [ ] **Step 5: Register PATCH with BotID on the client**

In `instrumentation-client.ts`, change the `protect` array:

```ts
import { initBotId } from "botid/client/core";

// Register the endpoints BotID should challenge. Protection activates once
// deployed on Vercel; locally checkBotId() is permissive.
initBotId({
  protect: [
    { path: "/api/waitlist", method: "POST" },
    { path: "/api/waitlist", method: "PATCH" },
  ],
});
```

- [ ] **Step 6: Run full vitest suite and build**

Run: `pnpm vitest run && pnpm tsc --noEmit && pnpm build`
Expected: all green (existing suite + 2 new tests).

- [ ] **Step 7: Commit**

```bash
git add instrumentation-client.ts lib/ratelimit.ts test/ratelimit.test.ts
git commit -m "fix(security): cubre PATCH con BotID y avisa si Upstash no esta configurado

BotID solo challengeaba el POST del waitlist, dejando el PATCH sin
verificacion real en el cliente. El rate limiter fallaba abierto en
silencio si faltaban las env vars de Upstash en produccion."
```

---

### Task 3: PricingCard — remove redundant JS box-shadow animation

**Problem (Fable audit, MEDIUM):** `components/PricingCard.tsx:35-44` runs an infinite framer-motion `animate` loop on `boxShadow` (main-thread repaint, runs even off-screen). `app/globals.css:238-277` (`.gold-card-border`) already renders the same breathing gold halo via a CSS `::after` pseudo-element with `animation: gold-glow-pulse` — GPU-friendly and already applied via the sibling `<div className="gold-card-border ...">` at `PricingCard.tsx:28`. The JS animation is pure duplication.

**Files:**
- Modify: `components/PricingCard.tsx:29-45`

**Interfaces:**
- Consumes: nothing new
- Produces: no prop/behavior change — purely removes a redundant visual effect

- [ ] **Step 1: Remove the `animate`/`transition` boxShadow props, downgrade `motion.div` to a plain `div`**

Replace lines 29-45 in `components/PricingCard.tsx`:

```tsx
      <div
        className={`relative z-[1] overflow-hidden rounded-[var(--radius-lg)] p-8 transition-shadow duration-300 ${
          hl
            ? "bg-[var(--bg-navy)] shadow-xl"
            : "bg-[var(--bg-surface)]"
        }`}
      >
```

And its closing tag — change the final `</motion.div>` (line 155) to `</div>`. Leave the inner `motion.a` CTA (lines 132-154) untouched; that hover/tap interaction is real, JS-driven interactivity, not a duplicate of anything in CSS.

- [ ] **Step 2: Confirm `motion` import is still used elsewhere in the file**

Run: `pnpm lint`
Expected: no unused-import error — `motion.a` at line 132 and `motion.span` at line 144 still use the import.

- [ ] **Step 3: Build and typecheck**

Run: `pnpm tsc --noEmit && pnpm build`
Expected: both succeed.

- [ ] **Step 4: Commit**

```bash
git add components/PricingCard.tsx
git commit -m "perf(pricing): elimina animacion JS de box-shadow duplicada

.gold-card-border::after ya renderiza el mismo halo dorado respirando
via CSS (GPU). La animacion en JS del motion.div corria infinita en
el hilo principal incluso fuera de viewport."
```

---

### Task 4: Referral mechanism — capture `?ref=`, attribute signups, show a shareable link

**Problem (Fable audit, HIGH; user-approved to build for real):** `content/site.ts:180` (`finalCta.referido`) promises *"cada referido que se una te acerca más a un cupo temprano"* but nothing in the code generates a referral link or attributes a signup to a referrer. This task makes the promise true using only the existing `origen` column (no schema change): the row id already returned by `POST /api/waitlist` (the anti-IDOR ownership token, `app/api/waitlist/route.ts:103`) doubles as a shareable referral code, and a new signup arriving with `?ref=<code>` tags its `origen` as `<origen>:ref:<code>` so referrals are attributable by querying `origen` in Supabase.

**Files:**
- Modify: `components/WaitlistForm.tsx`
- Test: `e2e/waitlist.spec.ts` (add one test)

**Interfaces:**
- Consumes: `MAX_ORIGEN = 60` cap from `lib/validation.ts:14` (referral code is truncated to keep the tagged origen under this cap: `origen` (≤14 chars in practice: "hero"/"final") + `:ref:` (5 chars) + code (≤40 chars) = ≤59)
- Produces: no new exported symbols — `WaitlistStep` type and `WaitlistForm` props are unchanged

- [ ] **Step 1: Capture the `ref` query param on mount**

In `components/WaitlistForm.tsx`, change the import line and add state + effect inside `WaitlistForm`:

```tsx
"use client";
import { useEffect, useId, useState } from "react";
```

After the existing `useState` declarations (after line 30, before `function setStep`):

```tsx
  const [refCode, setRefCode] = useState("");

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) setRefCode(ref.trim().slice(0, 40));
  }, []);
```

- [ ] **Step 2: Tag `origen` with the referral code on submit**

In `onSubmit`, change the POST body (currently `body: JSON.stringify({ email, origen, [HONEYPOT_FIELD]: hp })`):

```tsx
        body: JSON.stringify({
          email,
          origen: refCode ? `${origen}:ref:${refCode}` : origen,
          [HONEYPOT_FIELD]: hp,
        }),
```

- [ ] **Step 3: Show a shareable referral link on the final "done" state**

Replace the `step === "done"` block (currently lines 64-70):

```tsx
  if (step === "done") {
    const shareLink =
      typeof window !== "undefined" && token
        ? `${window.location.origin}${window.location.pathname}?ref=${token}`
        : "";
    return (
      <div className="flex flex-col gap-2">
        <p role="status" className="text-[var(--emerald)] font-semibold">
          ¡Gracias! Te avisaremos apenas lancemos.
        </p>
        {shareLink && (
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
            <input
              readOnly
              aria-label="Tu link de invitación"
              value={shareLink}
              onFocus={(e) => e.currentTarget.select()}
              className="min-h-9 flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 text-sm text-[var(--text-primary)]"
            />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(shareLink).catch(() => {});
              }}
              className="min-h-9 rounded-lg border border-[var(--bronze)] px-3 text-sm font-semibold text-[var(--bronze)]"
            >
              Copiar link
            </button>
          </div>
        )}
      </div>
    );
  }
```

Note: `token` is the empty string on the duplicate-email path (`app/api/waitlist/route.ts:88-92` deliberately withholds it), so `shareLink` is empty and the share block simply doesn't render for that case — no broken/misleading link is ever shown.

- [ ] **Step 4: Add an e2e test for referral attribution and the share link**

In `e2e/waitlist.spec.ts`, add a new test (mirror the existing route-interception pattern already in that file):

```ts
test("captures ?ref= and shows a shareable link after signup", async ({ page }) => {
  let capturedBody: Record<string, unknown> | null = null;

  await page.route("**/api/waitlist", async (route) => {
    const request = route.request();
    if (request.method() === "POST") {
      capturedBody = request.postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, token: "11111111-2222-3333-4444-555555555555" }),
      });
    } else {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
    }
  });

  await page.goto("/?ref=abc123");
  await page.locator("#waitlist input[type=email]").fill("referido@example.com");
  await page.locator("#waitlist button[type=submit]").click();

  await expect(page.getByRole("status").first()).toContainText("cuéntanos un poco más");
  expect(capturedBody?.origen).toBe("hero:ref:abc123");

  await page.getByRole("button", { name: "Ahora no" }).click();
  await expect(page.getByRole("status").first()).toContainText("Te avisaremos apenas lancemos");
  await expect(page.getByLabel("Tu link de invitación")).toHaveValue(
    /ref=11111111-2222-3333-4444-555555555555$/
  );
});
```

- [ ] **Step 5: Run the e2e suite**

Run: `pnpm exec playwright test`
Expected: all tests pass (existing 3 + this new one = 4).

- [ ] **Step 6: Typecheck and build**

Run: `pnpm tsc --noEmit && pnpm build`
Expected: both succeed.

- [ ] **Step 7: Commit**

```bash
git add components/WaitlistForm.tsx e2e/waitlist.spec.ts
git commit -m "feat(waitlist): mecanismo de referidos real via origen + link compartible

Captura ?ref= al cargar, etiqueta el origen del signup como
<origen>:ref:<codigo> (sin migrar el schema), y muestra un link
compartible (usando el id de la fila propia) al terminar el flujo.
Antes el copy de finalCta prometia esto sin que existiera."
```

---

### Task 5: FoundersStory — real founder names

**Problem (Fable audit, HIGH; user-provided the missing fact):** `content/site.ts:70-74` (`fundadores`) is anonymous ("Empezamos porque…"), with no names. The user confirmed the real founders: **Leif Guy Florez** (CEO) and **Juan David Florez** (CEO).

**Files:**
- Modify: `content/site.ts:70-74`
- Modify: `components/FoundersStory.tsx`

**Interfaces:**
- Consumes: nothing new
- Produces: `site.fundadores.nombres: string` (new field, read by `FoundersStory.tsx`)

- [ ] **Step 1: Add founder names to the content object**

In `content/site.ts`, replace the `fundadores` object (lines 70-74):

```ts
  fundadores: {
    titulo: "Lo que aprendimos manejando stock de verdad.",
    texto: "Empezamos porque el inventario no cuadraba, el despacho era lento y las herramientas eran caras o incompletas. Aureo concentra POS, bodega y análisis en un solo sistema — pensado desde el piso del depósito.",
    nombres: "Leif Guy Florez y Juan David Florez, fundadores de Aureo.",
    socialProofPlaceholder: "Primeras implementaciones en curso.",
  },
```

- [ ] **Step 2: Render the founder names in FoundersStory**

In `components/FoundersStory.tsx`, add a line between the `texto` paragraph and the `socialProofPlaceholder` paragraph (after line 22, before line 24):

```tsx
        <motion.p
          className="mt-5 text-sm font-semibold text-[var(--text-primary)]"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {site.fundadores.nombres}
        </motion.p>
```

- [ ] **Step 3: Typecheck and build**

Run: `pnpm tsc --noEmit && pnpm build`
Expected: both succeed.

- [ ] **Step 4: Commit**

```bash
git add content/site.ts components/FoundersStory.tsx
git commit -m "feat(fundadores): agrega nombres reales de los fundadores

La seccion era anonima. Leif Guy Florez y Juan David Florez son los
fundadores/CEO reales de Aureo."
```

---

### Task 6: FAQ — cover the #1 real objection (Siigo/Alegra), sync JSON-LD

**Problem (Fable audit, MEDIUM):** `content/site.ts:169-175` (`faq`) has 5 soft questions but skips the top real objection documented in `.agents/product-marketing.md:71` (Habit: *"Siigo ya instalado"*) — a prospect already paying for accounting software has no answer on this page for "why switch." `app/layout.tsx:191-228` hand-duplicates the FAQ into JSON-LD `mainEntity` and must stay in sync.

**Files:**
- Modify: `content/site.ts:169-175`
- Modify: `app/layout.tsx:191-228`

**Interfaces:**
- Consumes: `FaqItem = { pregunta: string; respuesta: string }` (`content/site.ts:9`, unchanged)
- Produces: `site.faq` grows from 5 to 7 items; `jsonLd`'s `FAQPage.mainEntity` grows to match 1:1

- [ ] **Step 1: Add two objection-handling FAQ items**

In `content/site.ts`, replace the `faq` array (lines 169-175):

```ts
  faq: [
    { pregunta: "¿Necesito conocimientos técnicos?", respuesta: "No. Aureo está pensado para que cualquier persona del negocio lo use desde el primer día." },
    { pregunta: "¿Funciona en la nube?", respuesta: "Sí. Accedes desde cualquier dispositivo, sin instalar nada, con tus datos siempre respaldados." },
    { pregunta: "¿Sirve solo para ferreterías?", respuesta: "No. Aureo es para cualquier negocio con inventario físico, ventas y bodega: distribuidoras, materiales de construcción, repuestos, agroinsumos y más." },
    { pregunta: "Ya uso Siigo o Alegra, ¿para qué cambiar?", respuesta: "Siigo y Alegra son software contable — te ayudan a facturar y declarar. Aureo se enfoca en tu bodega: mapa de calor, qué rota y qué no, picking guiado. Muchos negocios usan Aureo junto a su contabilidad, no en reemplazo." },
    { pregunta: "¿Es difícil migrar mi inventario?", respuesta: "No. Cargas tu inventario actual (por Excel o uno por uno) y Aureo lo organiza por ti. No necesitas empezar de cero." },
    { pregunta: "¿Qué pasa con mis datos?", respuesta: "Tus datos son tuyos. Los protegemos y nunca los compartimos." },
    { pregunta: "¿Cuándo estará disponible?", respuesta: "Estamos en desarrollo. Únete a la lista de espera para tener acceso anticipado y precio de fundador." },
  ] as FaqItem[],
```

- [ ] **Step 2: Sync the JSON-LD FAQPage block**

In `app/layout.tsx`, replace the `mainEntity` array inside the `FAQPage` object (lines 194-227) with 7 entries matching Step 1 verbatim, in the same order:

```tsx
      mainEntity: [
        {
          "@type": "Question",
          name: "¿Necesito conocimientos técnicos para usar Aureo?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. Aureo está pensado para que cualquier persona del negocio lo use desde el primer día.",
          },
        },
        {
          "@type": "Question",
          name: "¿Aureo funciona en la nube?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Sí. Accedes desde cualquier dispositivo, sin instalar nada, con tus datos siempre respaldados.",
          },
        },
        {
          "@type": "Question",
          name: "¿Para qué tipo de negocio es Aureo?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Aureo es para cualquier negocio con inventario físico, ventas y bodega: ferreterías, distribuidoras, materiales de construcción, repuestos, agroinsumos y más.",
          },
        },
        {
          "@type": "Question",
          name: "Ya uso Siigo o Alegra, ¿para qué cambiar a Aureo?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Siigo y Alegra son software contable — ayudan a facturar y declarar. Aureo se enfoca en la bodega: mapa de calor, qué rota y qué no, picking guiado. Muchos negocios usan Aureo junto a su contabilidad, no en reemplazo.",
          },
        },
        {
          "@type": "Question",
          name: "¿Es difícil migrar mi inventario a Aureo?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. El inventario actual se carga por Excel o uno por uno y Aureo lo organiza automáticamente. No hace falta empezar de cero.",
          },
        },
        {
          "@type": "Question",
          name: "¿Cuándo estará disponible Aureo?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Estamos en desarrollo. Únete a la lista de espera para tener acceso anticipado y precio de fundador.",
          },
        },
      ],
```

- [ ] **Step 3: Typecheck and build**

Run: `pnpm tsc --noEmit && pnpm build`
Expected: both succeed.

- [ ] **Step 4: Manual check — JSON-LD question count matches the array written in Step 2**

Run: `pnpm build && pnpm start`, then `curl -s http://localhost:3000 | grep -o '"@type":"Question"' | wc -l`
Expected: the count equals the number of entries in the `mainEntity` array from Step 2 (6, as written above). If it doesn't match, the JSON-LD array in `app/layout.tsx` and the count here have drifted — fix the array, not this check.

- [ ] **Step 5: Commit**

```bash
git add content/site.ts app/layout.tsx
git commit -m "content(faq): cubre la objecion 'ya uso Siigo/Alegra' y migracion de inventario

Eran las dos objeciones reales del ICP sin respuesta en la pagina
(.agents/product-marketing.md). JSON-LD FAQPage actualizado en paralelo."
```

---

### Task 7: Comparativa — name the real competitor, add the WMS differentiator row

**Problem (Fable audit, MEDIUM):** `content/site.ts:53` (`comparativa.columnas`) uses the generic label "Otro software" when the actual wedge (per `.agents/product-marketing.md:45`, "aquí sangran los gigantes") is against Siigo/Alegra-style accounting software. None of the 6 comparison rows mention the warehouse map (WMS) — the one capability the audit and the product doc both flag as the actual differentiator.

**Files:**
- Modify: `content/site.ts:51-62`

**Interfaces:**
- Consumes: `ComparativaValor = "si" | "no" | "parcial"`, `ComparativaFila = { criterio: string; valores: ComparativaValor[] }` (`content/site.ts:10-11`, unchanged)
- Produces: `site.comparativa.columnas[1]` renamed; `site.comparativa.filas` grows from 6 to 7 rows (all row arrays must keep exactly 3 values, matching the 3 columns)

- [ ] **Step 1: Rename the column and add the WMS row**

In `content/site.ts`, replace the `comparativa` object (lines 51-62):

```ts
  comparativa: {
    titulo: "Por qué Aureo gana donde el cuaderno y el Excel se quedan cortos.",
    columnas: ["Cuaderno o Excel", "Software contable (Siigo, Alegra…)", "Aureo"],
    filas: [
      { criterio: "Ubicar productos sin perder tiempo", valores: ["no", "no", "si"] },
      { criterio: "Mapa de calor y picking guiado de bodega", valores: ["no", "no", "si"] },
      { criterio: "Saber qué rota y qué no", valores: ["no", "parcial", "si"] },
      { criterio: "Despacho rápido y guiado", valores: ["no", "no", "si"] },
      { criterio: "Inventario que siempre cuadra", valores: ["no", "parcial", "si"] },
      { criterio: "Precio para negocio pequeño", valores: ["si", "no", "si"] },
      { criterio: "Empieza a usarse en minutos", valores: ["si", "no", "si"] },
    ] as ComparativaFila[],
  },
```

Note: the "Software contable (Siigo, Alegra…)" column is marked `"no"` for "Ubicar productos" and the new WMS row (not `"parcial"`) because accounting software has no warehouse-location feature at all — this is a correction from the old generic "Otro software" row, not just a rename.

- [ ] **Step 2: Typecheck and build**

Run: `pnpm tsc --noEmit && pnpm build`
Expected: both succeed.

- [ ] **Step 3: Manual check — ComparisonSection renders 7 rows × 3 columns without layout break**

Run: `pnpm dev`, open `http://localhost:3000`, scroll to "LA COMPARACIÓN", confirm all 7 criteria rows render with 3 icon cells each (no `undefined`/missing cell — `ComparisonSection.tsx` maps `valores` positionally, so a row with fewer than 3 entries would silently render fewer icons).

- [ ] **Step 4: Commit**

```bash
git add content/site.ts
git commit -m "content(comparativa): nombra el competidor real (Siigo/Alegra) y agrega fila de WMS

'Otro software' era generico cuando el wedge real es contra software
contable. Ninguna fila mencionaba el mapa de calor, el diferenciador
que solo tiene Aureo."
```

---

### Task 8: Hero — secondary demo CTA, dead code cleanup

**Problem (Fable audit, HIGH + LOW):**
- `components/DemoSection.tsx:120` (the "Explora la demo tú mismo" CTA) only appears in section 6 of the page. `NEXT_PUBLIC_DEMO_URL` is confirmed set in Vercel production, so the CTA already renders — it's just buried below Problem/Comparativa/HowItWorks/Modules before a visitor sees it. A secondary, low-commitment link in the hero lets a not-ready-to-give-email visitor try the product anyway.
- `lib/motion.ts:11-27` (`fadeLeft`, `fadeRight`) and `lib/motion.ts:72-85` (`heroDashboardEnter`) are unused exports. `content/site.ts:22` (`hero.cta`) is defined but never rendered (the real button text lives in `WaitlistForm.tsx`).

**Files:**
- Modify: `components/Hero.tsx`
- Modify: `lib/motion.ts`
- Modify: `content/site.ts:22` (remove)

**Interfaces:**
- Consumes: `process.env.NEXT_PUBLIC_DEMO_URL` (same pattern as `DemoSection.tsx:13`)
- Produces: no new exports; removes `fadeLeft`, `fadeRight`, `heroDashboardEnter` from `lib/motion.ts` (confirm nothing else imports them before removing — see Step 1)

- [ ] **Step 1: Confirm no other file imports the dead exports**

Run: `grep -rn "fadeLeft\|fadeRight\|heroDashboardEnter" --include="*.tsx" --include="*.ts" components lib app`
Expected: only the declarations in `lib/motion.ts` itself. If any other file imports them, drop this step's removal for that specific export and note it in the task report instead of deleting a used export.

- [ ] **Step 2: Remove the dead exports from lib/motion.ts**

Delete lines 11-27 (`fadeLeft`, `fadeRight`) and lines 72-85 (`heroDashboardEnter`) from `lib/motion.ts`.

- [ ] **Step 3: Remove the unused `hero.cta` field**

In `content/site.ts`, delete line 22 (`cta: "Unirme a la lista de espera",`) from the `hero` object.

- [ ] **Step 4: Add a secondary demo CTA link to the hero**

In `components/Hero.tsx`, add a constant near the top of the file (after the imports, before `export function Hero()`):

```tsx
const DEMO_URL = process.env.NEXT_PUBLIC_DEMO_URL || "";
```

Then, inside the `hero-fade hero-fade-form` div added in Task 1 Step 4, after the `{formStep === "email" && (...)}` block, add:

```tsx
            {formStep === "email" && DEMO_URL && (
              <a
                href={DEMO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--bronze)] underline underline-offset-2 hover:text-[var(--bronze)]/80"
              >
                o explora la demo sin registrarte →
              </a>
            )}
```

- [ ] **Step 5: Typecheck and build**

Run: `pnpm tsc --noEmit && pnpm build`
Expected: both succeed. Confirm `lib/motion.ts` and `content/site.ts` changes don't break any importer (build failure would surface a missed usage from Step 1).

- [ ] **Step 6: Manual check — demo link only shows on the email step**

Run: `pnpm dev`, open `http://localhost:3000`, confirm the "o explora la demo sin registrarte →" link appears under the hero form, then submit the email step and confirm the link disappears once `formStep !== "email"` (matching the existing `site.hero.nota` visibility pattern already in the component).

- [ ] **Step 7: Commit**

```bash
git add components/Hero.tsx lib/motion.ts content/site.ts
git commit -m "feat(hero): agrega CTA secundario a la demo, limpia exports muertos

La demo interactiva (mejor argumento de venta) solo aparecia en la
seccion 6. Se agrega un link de bajo compromiso en el hero. Tambien
se retiran fadeLeft/fadeRight/heroDashboardEnter (lib/motion.ts) y
hero.cta (content/site.ts), sin uso en el codebase."
```

---

### Task 9: DemoSection — make it feel like a show, not a video embed

**Problem (user feedback, explicit):** the demo is the single strongest sales argument (per the Fable audit and `.agents/product-marketing.md`) but today it reads as a plain video in a thin shimmer border. The user asked for a more dramatic presentation: bigger presence, framed like a real product, visual proof it's not a mockup.

**Files:**
- Modify: `content/site.ts` (`demo` object, lines 63-69)
- Modify: `components/DemoSection.tsx`
- Modify: `app/globals.css` (reuse existing keyframes; add one new bloom keyframe if not already present — check `animate-breathe` first)

**Interfaces:**
- Consumes: `fadeUp`, `VIEWPORT` from `lib/motion.ts` (unchanged), existing `shimmer-border` CSS class (`app/globals.css:188-200`)
- Produces: `site.demo.eyebrow: string`, `site.demo.badges: string[]` (new fields read only by `DemoSection.tsx`)

- [ ] **Step 1: Confirm the `animate-breathe` utility already used in FinalCTA is available for reuse**

Run: `grep -n "animate-breathe" app/globals.css`
Expected: one `@keyframes` + one `.animate-breathe` (or `@utility`) definition exists (already used at `components/FinalCTA.tsx:31`). Reuse it — do not redefine.

- [ ] **Step 2: Add eyebrow + badges content**

In `content/site.ts`, replace the `demo` object (lines 63-69):

```ts
  demo: {
    eyebrow: "Producto real, no un mockup.",
    titulo: "Mira la inteligencia logística en acción.",
    texto: "El mapa de calor y el análisis ABC son lo que separa a Aureo de un POS común.",
    badges: ["Mapa de calor en vivo", "Picking guiado", "Análisis ABC / Pareto"],
    placeholder: "Demo en video — próximamente.",
    ctaExplorar: "Explora la demo tú mismo",
    ctaExplorarNota: "No es un video — es Aureo funcionando. Recorre el inventario, el mapa de calor y el picking con datos reales, sin registrarte.",
  },
```

- [ ] **Step 3: Widen the frame, add an eyebrow pill, a browser-chrome header bar, and a breathing glow bloom behind the video**

Replace the section content in `components/DemoSection.tsx` from the `<SectionHeading light>` line through the closing of the `shimmer-border` `motion.div` (the video + mute button block). The full replacement for the JSX between `<div className="relative z-10 mx-auto max-w-6xl px-5 text-center">` and the `{DEMO_URL && (...)}` block:

```tsx
      <div className="relative z-10 mx-auto max-w-6xl px-5 text-center">
        <motion.span
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--bronze)]/40 bg-[var(--bronze)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--bronze)]"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--emerald)]" aria-hidden />
          {site.demo.eyebrow}
        </motion.span>

        <div className="mt-4">
          <SectionHeading light>{site.demo.titulo}</SectionHeading>
        </div>

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
          className="relative mx-auto mt-12 max-w-5xl"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          {/* Breathing glow bloom behind the frame */}
          <div className="pointer-events-none absolute -inset-10 -z-10" aria-hidden>
            <div
              className="h-full w-full animate-breathe"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(168,116,43,0.16) 0%, transparent 65%)",
              }}
            />
          </div>

          {/* Floating feature badges — hidden on small screens to avoid overlap */}
          <div className="pointer-events-none absolute -top-5 left-6 z-20 hidden gap-2 sm:flex sm:flex-wrap sm:max-w-[70%]">
            {site.demo.badges.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-[var(--bronze)]/50 bg-[var(--bg-navy)]/90 px-3 py-1 text-xs font-semibold text-[var(--text-cream)] shadow-[0_4px_16px_-4px_rgba(0,0,0,0.4)] backdrop-blur-sm"
              >
                {badge}
              </span>
            ))}
          </div>

          <div className="shimmer-border relative overflow-hidden rounded-[var(--radius-lg)] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.55)]">
            {/* Browser-chrome header bar — signals a real running product */}
            <div className="flex items-center gap-2 border-b border-white/10 bg-[var(--bg-navy)] px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" aria-hidden />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" aria-hidden />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" aria-hidden />
              <span className="ml-3 truncate rounded-md bg-white/10 px-3 py-1 text-xs text-[var(--text-cream)]/70">
                app.aureo.com
              </span>
            </div>

            <video
              ref={videoRef}
              className="w-full"
              src={VIDEO_SRC}
              poster="/aureo-video-poster.jpg"
              muted
              playsInline
              loop
              preload="metadata"
            />

            <motion.button
              className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/70"
              onClick={muted ? handleUnmute : handleMute}
              aria-label={muted ? "Activar sonido" : "Silenciar"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {muted ? (
                <>
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                    <path d="M16.5 12A4.5 4.5 0 0014 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0017.73 18l2 2L21 18.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                  </svg>
                  Activar sonido
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                  Silenciar
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
```

Leave the trailing `{DEMO_URL && (...)}` block (the "Explora la demo tú mismo" CTA) exactly as it is, immediately after this replaced block, still inside the same outer `<div className="relative z-10 mx-auto max-w-6xl px-5 text-center">...</div>`.

- [ ] **Step 4: Typecheck and build**

Run: `pnpm tsc --noEmit && pnpm build`
Expected: both succeed.

- [ ] **Step 5: Manual check — frame reads as a real app window, badges don't overlap on mobile**

Run: `pnpm dev`, open `http://localhost:3000`, scroll to "LA COMPARACIÓN" → next section. Confirm: (a) the eyebrow pill + browser-chrome bar render above the video, (b) at desktop width the 3 floating badges sit above the frame without overlapping the eyebrow/heading, (c) at a narrow mobile width (375px) the badges are hidden (`hidden sm:flex`) and the frame doesn't overflow horizontally.

- [ ] **Step 6: Commit**

```bash
git add content/site.ts components/DemoSection.tsx
git commit -m "feat(demo): presentacion mas dramatica — marco tipo navegador, badges flotantes, glow

La demo es el mejor argumento de venta pero se veia como un video
suelto. Ahora tiene chrome de navegador (senal de 'producto real'),
badges de features flotando y un bloom de luz detras del marco."
```

---

## Post-implementation

After all 8 tasks are complete and individually reviewed, run the full verification suite once more (`pnpm lint && pnpm tsc --noEmit && pnpm vitest run && pnpm exec playwright test && pnpm build`), then request a final whole-branch review (opus model) covering the full diff from the pre-Task-1 commit to HEAD before committing... — this repo's convention (per `.superpowers/sdd/progress.md`) is direct commits to `main`, already consented to by the user for prior passes; confirm this still holds before the first commit of this plan, since no feature branch is being created.
