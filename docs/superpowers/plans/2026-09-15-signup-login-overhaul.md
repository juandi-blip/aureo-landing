# Signup/Login Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every landing-page waitlist entry point with the real signup/login flow, redesign `/login` into a two-column layout, add Google OAuth, a required terms checkbox, and password show/hide toggles.

**Architecture:** Landing components (`Nav`, `Hero`, `FinalCTA`, `PricingCard`, `SecuritySection`) retarget their CTAs from the waitlist form/anchor to `/registro` and `/login`; `WaitlistForm.tsx` and its now-dead e2e spec are deleted while the `waitlist` table/API stay untouched. `/login` gains a new two-column layout (`AuthSplitPanel` + existing form). Google OAuth uses Supabase's native `signInWithOAuth`, landing on a new `/auth/oauth-callback` page that branches to a new `/auth/complete-profile` screen when the Postgres trigger flags a business as needing real name/plan data (`needs_onboarding`).

**Tech Stack:** Next.js 16 App Router, Supabase Auth (`@supabase/supabase-js` OAuth + Postgres RLS/triggers), Vitest, Playwright, `lucide-react` icons.

**Spec:** `docs/superpowers/specs/2026-09-15-signup-login-overhaul-design.md`

## Global Constraints

- Every new password field must show/hide via the same `PasswordInput` component — no ad-hoc duplicate toggle logic per form.
- The `waitlist` table and `/api/waitlist` route are never modified or deleted in this plan — only code that *calls* them changes.
- Any new public-facing POST/PATCH route must be added to `instrumentation-client.ts`'s BotID `protect` list unless it authenticates via bearer token instead of a public form (this project has been bitten twice by a guarded route missing its BotID registration).
- Every async action that can fail on network error must be wrapped in try/catch with a "Revisa tu conexión e intenta de nuevo." fallback.
- The module-scoped `getSupabaseAnon()` client in `lib/supabase.ts` is a cached singleton with no per-request auth header — never attach a caller's bearer token to it. Any route that must act as the calling user (not anonymously) creates its own `createClient()` call with that token in `global.headers.Authorization`.
- The OAuth browser client needs `persistSession: true` (Supabase's default) — this is a different client than the ephemeral `persistSession: false` one used by `ConfirmAccount.tsx`/`ResetPasswordForm.tsx`, because the OAuth redirect flow depends on session persistence across the full-page navigation to Google and back.

---

### Task 1: Landing copy — retire waitlist language in `content/site.ts`

**Files:**
- Modify: `content/site.ts:14-17` (the `Plan` type), `:119,134,150` (each plan's `nombre` sits beside where `id` is added), `:131,147,164` (each plan's `cta`), `:168` (`preciosNota`), `:221-222` (two FAQ items), `:224-229` (`finalCta`), `:31` (`hero.nota`)

**Interfaces:**
- Produces: `Plan.id: "starter" | "pro" | "logistica"` — consumed by Task 4 (`PricingCard`'s link).
- Consumes: nothing new.

- [ ] **Step 1: Add `id` to the `Plan` type**

In `content/site.ts`, find:

```ts
export type Plan = {
  nombre: string; resumen: string; destacado: boolean;
  precios: PlanPrecios; precioRegular: PlanPrecios; features: string[]; cta: string;
};
```

Replace with:

```ts
export type Plan = {
  id: "starter" | "pro" | "logistica";
  nombre: string; resumen: string; destacado: boolean;
  precios: PlanPrecios; precioRegular: PlanPrecios; features: string[]; cta: string;
};
```

- [ ] **Step 2: Add `id` to each plan object and update each `cta`**

Find the `nombre: "Starter",` line (currently line 119) and add `id: "starter",` immediately before it:

```ts
    {
      id: "starter",
      nombre: "Starter",
```

Find `nombre: "Pro",` (currently line 134) and add `id: "pro",` immediately before it:

```ts
    {
      id: "pro",
      nombre: "Pro",
```

Find `nombre: "Logística",` (currently line 150) and add `id: "logistica",` immediately before it:

```ts
    {
      id: "logistica",
      nombre: "Logística",
```

Then replace all three occurrences of `cta: "Unirme a la lista de espera",` with `cta: "Iniciar prueba gratis",`.

- [ ] **Step 3: Update `preciosNota`**

Find:

```ts
  preciosNota: "Precio de fundador de por vida para quienes entran por la lista de espera — nunca sube para ti, aunque suba después del lanzamiento.",
```

Replace with:

```ts
  preciosNota: "Precio de fundador de por vida para quienes se registren ahora — nunca sube para ti, aunque suba después.",
```

- [ ] **Step 4: Update the two FAQ items about the waitlist**

Find:

```ts
    { pregunta: "¿Cuándo estará disponible?", respuesta: "Estamos en desarrollo. Únete a la lista de espera para tener acceso anticipado y precio de fundador." },
    { pregunta: "¿Qué pasa si me uno a la lista de espera y el lanzamiento tarda?", respuesta: "No arriesgas nada: anotarte no cuesta nada ni pide tarjeta. Mientras tanto tu precio de fundador queda reservado y congelado para cuando lancemos — cuanto antes te unas, mejor precio aseguras." },
```

Replace with:

```ts
    { pregunta: "¿Cuándo puedo empezar?", respuesta: "Ya puedes crear tu cuenta y probar Aureo gratis por 14 días, sin tarjeta." },
    { pregunta: "¿Qué pasa cuando termina mi prueba gratuita?", respuesta: "Nada se pierde: tus datos quedan guardados. Activas tu plan cuando quieras, con tu precio de fundador ya asegurado." },
```

- [ ] **Step 5: Update `finalCta`**

Find:

```ts
  finalCta: {
    titulo: "Sé de los primeros en tener el control.",
    texto: "Únete a la lista de espera y asegura tu precio de fundador.",
    cta: "Unirme ahora",
    referido: "¿Conoces a alguien con ferretería, distribuidora o bodega? Comparte tu invitación — cada referido que se una te acerca más a un cupo temprano.",
  },
```

Replace with:

```ts
  finalCta: {
    titulo: "Toma el control de tu inventario hoy.",
    texto: "Crea tu cuenta gratis y asegura tu precio de fundador.",
    cta: "Empieza gratis",
    referido: "¿Conoces a alguien con ferretería, distribuidora o bodega? Compártele Aureo — juntos pueden mejorar cómo manejan su inventario.",
  },
```

- [ ] **Step 6: Update `hero.nota`**

Find:

```ts
    nota: "Acceso anticipado y precio de fundador para los primeros negocios.",
```

(this is the first occurrence in the file, inside the `hero` object — do not touch the other two `nota:` fields elsewhere in the file, they belong to unrelated sections). Replace with:

```ts
    nota: "14 días gratis, sin tarjeta. Precio de fundador asegurado desde el día uno.",
```

- [ ] **Step 7: Update the `earlyBird` badge copy**

Find:

```ts
  earlyBird: {
    badge: "Fundador temprano",
    titulo: "Los primeros en la lista se llevan el mejor precio.",
    texto: "Quienes se unan en esta primera etapa acceden a un descuento extra sobre el precio de fundador. Cuanto antes entres, mejor cupo aseguras.",
  },
```

Replace with:

```ts
  earlyBird: {
    badge: "Precio de lanzamiento",
    titulo: "Precio de fundador, por tiempo limitado.",
    texto: "Los primeros negocios en registrarse consiguen un precio que nunca sube — sin importar cuándo actives tu plan pago.",
  },
```

- [ ] **Step 8: Type-check and run the existing content test**

Run: `npx tsc --noEmit`
Expected: no errors (this confirms every plan object now has the required `id` field).

Run: `npx vitest run test/site-content.test.ts`
Expected: PASS (this file doesn't assert on `cta`/copy text, only structural counts — confirms nothing broke).

- [ ] **Step 9: Commit**

```bash
git add content/site.ts
git commit -m "feat: retire waitlist copy across pricing, FAQ and CTAs"
```

---

### Task 2: `Nav.tsx` — add login link, retarget CTA

**Files:**
- Modify: `components/Nav.tsx:83-95` (the CTA `motion.a`)

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing consumed by later tasks (this is a leaf UI change).

- [ ] **Step 1: Add the login link and retarget the CTA**

In `components/Nav.tsx`, add this import at the top (after the existing imports):

```tsx
import Link from "next/link";
```

Replace the final `motion.a` block (currently lines 83-95):

```tsx
        <motion.a
          href="#waitlist"
          className="shimmer-btn relative overflow-hidden rounded-[var(--radius-md)] bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
          initial={{ opacity: 0, x: reduce ? 0 : 16, scale: reduce ? 1 : 0.92 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={
            reduce
              ? { duration: 0 }
              : { type: "spring", damping: 18, stiffness: 200, delay: 0.35 }
          }
        >
          Unirme
        </motion.a>
```

with:

```tsx
        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0, x: reduce ? 0 : 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={
            reduce
              ? { duration: 0 }
              : { type: "spring", damping: 22, stiffness: 180, delay: 0.3 }
          }
        >
          <Link
            href="/login"
            className="hidden text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--primary)] sm:inline"
          >
            Iniciar sesión
          </Link>
          <motion.a
            href="/registro"
            className="shimmer-btn relative overflow-hidden rounded-[var(--radius-md)] bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 350, damping: 20 }}
          >
            Empieza gratis
          </motion.a>
        </motion.div>
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual check**

Run: `npm run dev`, open `http://localhost:3000/`, confirm "Iniciar sesión" and "Empieza gratis" render in the Nav (on a screen ≥640px wide for the login link) and navigate to `/login`/`/registro` respectively.

- [ ] **Step 4: Commit**

```bash
git add components/Nav.tsx
git commit -m "feat: add login link and retarget Nav CTA to /registro"
```

---

### Task 3: Remove the embedded waitlist form from `Hero`/`FinalCTA`, delete `WaitlistForm`

**Files:**
- Modify: `components/Hero.tsx` (remove `WaitlistForm` usage, replace with a CTA button)
- Modify: `components/FinalCTA.tsx` (same)
- Delete: `components/WaitlistForm.tsx`
- Delete: `e2e/waitlist.spec.ts` (tests the exact embedded flow this task removes)

**Interfaces:**
- Consumes: `site.hero.nota` (Task 1, already updated), `site.finalCta.cta` (Task 1, already updated).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Replace `Hero.tsx`'s embedded form with a CTA button**

In `components/Hero.tsx`, remove this import:

```tsx
import { WaitlistForm, type WaitlistStep } from "@/components/WaitlistForm";
```

Remove the now-unused `useState` import of `WaitlistStep` state — replace:

```tsx
import { useState } from "react";
```

with nothing (delete the line — `useState` is no longer used anywhere else in this file once the form step state is gone). Also remove this line from inside the component body:

```tsx
  const [formStep, setFormStep] = useState<WaitlistStep>("email");
```

Change the section's `id` from `"waitlist"` to `"inicio"` (it's no longer a waitlist section):

```tsx
    <section
      id="inicio"
```

Replace this block:

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

with:

```tsx
          <div className="hero-fade hero-fade-form mt-7 md:mt-8">
            <motion.a
              href="/registro"
              className="shimmer-btn glow-btn relative inline-block overflow-hidden rounded-[var(--radius-md)] bg-[var(--primary)] px-8 py-3.5 text-center font-semibold text-white transition-colors hover:bg-[var(--primary-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 350, damping: 20 }}
            >
              Empieza tu prueba gratis
            </motion.a>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              {site.hero.nota}
            </p>
          </div>
```

- [ ] **Step 2: Replace `FinalCTA.tsx`'s embedded form with a CTA button**

In `components/FinalCTA.tsx`, remove this import:

```tsx
import { WaitlistForm } from "@/components/WaitlistForm";
```

Replace:

```tsx
        <motion.div
          className="mt-10 flex justify-center"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          <WaitlistForm origen="final" />
        </motion.div>
```

with:

```tsx
        <motion.div
          className="mt-10 flex justify-center"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          <motion.a
            href="/registro"
            className="glow-btn relative inline-block overflow-hidden rounded-[var(--radius-md)] bg-[var(--bronze)] px-8 py-3.5 text-center font-semibold text-white transition-colors hover:bg-[var(--bronze)]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bronze)] focus-visible:ring-offset-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 350, damping: 20 }}
          >
            {site.finalCta.cta}
          </motion.a>
        </motion.div>
```

- [ ] **Step 3: Delete the now-unused files**

```bash
git rm components/WaitlistForm.tsx e2e/waitlist.spec.ts
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors — this also confirms no other file still imports `WaitlistForm`.

- [ ] **Step 5: Run the full test suite**

Run: `npx vitest run`
Expected: all pass (the deleted `e2e/waitlist.spec.ts` was Playwright, not Vitest, so it doesn't appear in this run — Playwright is checked in Task 13).

- [ ] **Step 6: Manual check**

Run: `npm run dev`, open `http://localhost:3000/`, confirm the Hero section shows "Empieza tu prueba gratis" (no form fields), and scrolling to the final CTA section shows "Empieza gratis", both linking to `/registro`.

- [ ] **Step 7: Commit**

```bash
git add components/Hero.tsx components/FinalCTA.tsx
git commit -m "feat: replace embedded waitlist form with direct signup CTAs"
```

---

### Task 4: Retarget `PricingCard`/`SecuritySection`, verify no other `#waitlist` references remain

**Files:**
- Modify: `components/PricingCard.tsx:122-123`
- Modify: `components/SecuritySection.tsx:132-133`

**Interfaces:**
- Consumes: `Plan.id` (Task 1).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Retarget `PricingCard`'s CTA link**

In `components/PricingCard.tsx`, find:

```tsx
        <motion.a
          href="#waitlist"
```

Replace with:

```tsx
        <motion.a
          href={`/registro?plan=${plan.id}`}
```

- [ ] **Step 2: Retarget `SecuritySection`'s link**

In `components/SecuritySection.tsx`, find:

```tsx
          <motion.a
            href="#waitlist"
```

Replace with:

```tsx
          <motion.a
            href="/registro"
```

(This component isn't currently rendered in `app/page.tsx` — see the comment there — but fixing the link now avoids a stale reference resurfacing broken if it's ever re-enabled.)

- [ ] **Step 3: Confirm no `#waitlist` references remain anywhere**

Run: `grep -rn "#waitlist" --include="*.tsx" --include="*.ts" . --exclude-dir=node_modules`
Expected: no output (empty). If anything remains, it's a file this plan missed — stop and report it rather than proceeding.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/PricingCard.tsx components/SecuritySection.tsx
git commit -m "feat: retarget pricing and security CTAs from waitlist to /registro"
```

---

### Task 5: Password show/hide toggle

**Files:**
- Create: `components/ui/PasswordInput.tsx`
- Modify: `components/LoginForm.tsx` (swap the password `Input` for `PasswordInput`)
- Modify: `components/SignupForm.tsx` (same)
- Modify: `components/ResetPasswordForm.tsx` (same, both password fields)

**Interfaces:**
- Produces: `PasswordInput` component, props = same as `Input` minus `type` (it manages `type` internally). Used by Task 6 (`SignupForm`, already using it) and Task 7 (no direct dependency, but both touch the same forms).
- Consumes: `Input` (`@/components/ui/input`), `cn` (`@/lib/utils`).

- [ ] **Step 1: Create `PasswordInput`**

Create `components/ui/PasswordInput.tsx`:

```tsx
"use client";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, "type">;

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input type={visible ? "text" : "password"} className={cn("pr-10", className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Use it in `LoginForm.tsx`**

Replace the import:

```tsx
import { Input } from "@/components/ui/input";
```

with:

```tsx
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/PasswordInput";
```

Replace the password field:

```tsx
        <Input
          type="password"
          required
          placeholder="Contraseña"
          aria-label="Contraseña"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`min-h-11 ${inputGlow}`}
        />
```

with:

```tsx
        <PasswordInput
          required
          placeholder="Contraseña"
          aria-label="Contraseña"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`min-h-11 ${inputGlow}`}
        />
```

- [ ] **Step 3: Use it in `SignupForm.tsx`**

Add the import next to the existing `Input` import, and replace the single password field the same way (same prop shape, `placeholder="Contraseña (8+ caracteres, mayúscula, minúscula y número)"`, `autoComplete="new-password"`).

- [ ] **Step 4: Use it in `ResetPasswordForm.tsx`**

Add the import, and replace both password `Input`s (the "Nueva contraseña" and "Confirma la contraseña" fields) with `PasswordInput`, keeping each field's own `placeholder`/`aria-label`/`value`/`onChange`.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Manual check**

Run: `npm run dev`, open `/login`, `/registro`, and `/auth/reset?token_hash=x&type=recovery` (a fake token is fine — you're only checking the toggle renders, not submitting). Click the eye icon on each password field, confirm the text becomes visible and the icon swaps.

- [ ] **Step 7: Commit**

```bash
git add components/ui/PasswordInput.tsx components/LoginForm.tsx components/SignupForm.tsx components/ResetPasswordForm.tsx
git commit -m "feat: add show/hide toggle to all password fields"
```

---

### Task 6: Required terms checkbox on signup

**Files:**
- Modify: `components/SignupForm.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Reorder the heading so the free-trial line leads**

In `components/SignupForm.tsx`, find the heading block:

```tsx
      <motion.div variants={fadeUp} className="mb-2">
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
          Crea tu cuenta
        </h1>
        <div className="mt-2 h-0.5 w-10 rounded-full bg-[var(--bronze)]" aria-hidden />
        <p className="mt-3 text-[var(--text-secondary)]">
          14 días gratis, sin tarjeta. Empieza a controlar tu inventario hoy mismo.
        </p>
      </motion.div>
```

Replace with (the trial benefit becomes the headline; "Crea tu cuenta" becomes a smaller supporting line above it):

```tsx
      <motion.div variants={fadeUp} className="mb-2">
        <p className="text-sm font-semibold text-[var(--bronze)]">Crea tu cuenta</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-[var(--text-primary)]">
          14 días gratis, sin tarjeta.
        </h1>
        <div className="mt-2 h-0.5 w-10 rounded-full bg-[var(--bronze)]" aria-hidden />
        <p className="mt-3 text-[var(--text-secondary)]">
          Empieza a controlar tu inventario hoy mismo.
        </p>
      </motion.div>
```

- [ ] **Step 2: Add checkbox state and gate the submit button**

In `components/SignupForm.tsx`, add a new state next to the existing ones:

```tsx
  const [acceptedTerms, setAcceptedTerms] = useState(false);
```

Add `Link` to the imports:

```tsx
import Link from "next/link";
```

In `onSubmit`, add a guard right after the `e.preventDefault();` line, before the existing `try`:

```tsx
    if (!acceptedTerms) {
      setState("error");
      setMsg("Debes aceptar los Términos y la Política de Privacidad.");
      return;
    }
```

- [ ] **Step 3: Render the checkbox**

Add this block right before the plan-selector `motion.div` (i.e. between the password field's `motion.div` and the `PLAN_OPTIONS.map` block):

```tsx
      <motion.div variants={fadeUp} className="flex items-start gap-2">
        <input
          type="checkbox"
          id="accept-terms"
          checked={acceptedTerms}
          onChange={(e) => setAcceptedTerms(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 rounded border-[var(--border-subtle)] text-[var(--bronze)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bronze)]"
        />
        <label htmlFor="accept-terms" className="text-sm text-[var(--text-secondary)]">
          Acepto los{" "}
          <Link href="/terminos" className="text-[var(--bronze)] underline underline-offset-2" target="_blank">
            Términos y Condiciones
          </Link>{" "}
          y la{" "}
          <Link href="/privacidad" className="text-[var(--bronze)] underline underline-offset-2" target="_blank">
            Política de Privacidad
          </Link>
          .
        </label>
      </motion.div>
```

- [ ] **Step 4: Disable the submit button until checked**

Find:

```tsx
          <Button
            type="submit"
            disabled={state === "loading"}
            aria-busy={state === "loading"}
            className="min-h-11 w-full"
          >
```

Replace with:

```tsx
          <Button
            type="submit"
            disabled={state === "loading" || !acceptedTerms}
            aria-busy={state === "loading"}
            className="min-h-11 w-full"
          >
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Manual check**

Run: `npm run dev`, open `/registro`, confirm the heading now leads with "14 días gratis, sin tarjeta." (with "Crea tu cuenta" as the smaller line above it), that the submit button is disabled until the checkbox is checked, and that the Términos/Privacidad links open the right pages in a new tab.

- [ ] **Step 7: Commit**

```bash
git add components/SignupForm.tsx
git commit -m "feat: lead signup with free-trial headline, require terms acceptance"
```

---

### Task 7: Persistent browser Supabase client + `GoogleAuthButton`

**Files:**
- Create: `lib/supabase-browser.ts`
- Create: `components/GoogleAuthButton.tsx`
- Modify: `components/LoginForm.tsx` (add the button)
- Modify: `components/SignupForm.tsx` (add the button)

**Interfaces:**
- Produces: `getBrowserSupabase(): SupabaseClient` (from `lib/supabase-browser.ts` — a **new, separate** helper from any local `getBrowserSupabase` already inlined in `ConfirmAccount.tsx`/`ResetPasswordForm.tsx`, which use `persistSession: false` and stay untouched). This new one is consumed by Task 11 (`/auth/oauth-callback`) and Task 10 (`/auth/complete-profile`).
- `GoogleAuthButton` component, no props, used by `LoginForm` and `SignupForm`.

- [ ] **Step 1: Create the persistent browser client**

Create `lib/supabase-browser.ts`:

```ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente de navegador con persistencia de sesión (a diferencia del cliente
// efímero que usan ConfirmAccount.tsx/ResetPasswordForm.tsx): el flujo de
// OAuth redirige la página completa a Google y de vuelta, así que la sesión
// tiene que sobrevivir esa navegación — se apoya en el storage por defecto
// de supabase-js (persistSession/detectSessionInUrl ambos true).
let client: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    client = createClient(url, key);
  }
  return client;
}
```

- [ ] **Step 2: Create `GoogleAuthButton`**

Create `components/GoogleAuthButton.tsx`:

```tsx
"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aureo.com.co";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.48c-.28 1.5-1.13 2.78-2.4 3.63v3.02h3.89c2.28-2.1 3.55-5.2 3.55-8.84z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.89-3.02c-1.08.72-2.46 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.94H1.28v3.11C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.29 14.29A7.2 7.2 0 0 1 4.9 12c0-.8.14-1.57.39-2.29V6.6H1.28A11.98 11.98 0 0 0 0 12c0 1.93.46 3.76 1.28 5.4z" />
      <path fill="#EA4335" d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.28 6.6l4.01 3.11C6.23 6.87 8.88 4.75 12 4.75z" />
    </svg>
  );
}

export function GoogleAuthButton() {
  const reduce = useReducedMotion();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    const supabase = getBrowserSupabase();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${SITE_URL}/auth/oauth-callback` },
    });
    // No further state update needed on success — signInWithOAuth navigates
    // the whole page away to Google. `loading` only matters if it fails
    // without navigating, which the browser surfaces as a normal rejection
    // Supabase already logs; nothing actionable to show the user here that
    // a retry click wouldn't already fix.
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-busy={loading}
      whileHover={reduce ? undefined : { scale: 1.02 }}
      whileTap={reduce ? undefined : { scale: 0.98 }}
      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-subtle)] disabled:opacity-60"
    >
      <GoogleIcon />
      Continuar con Google
    </motion.button>
  );
}
```

- [ ] **Step 3: Wire it into `LoginForm.tsx`**

Add the import:

```tsx
import { GoogleAuthButton } from "@/components/GoogleAuthButton";
```

Add this block right after the opening `motion.form` tag's first child (i.e. as the new first `motion.div`, before the email field), so the divider reads naturally above the form fields:

```tsx
      <motion.div variants={fadeUp}>
        <GoogleAuthButton />
      </motion.div>
      <motion.div variants={fadeUp} className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
        <div className="h-px flex-1 bg-[var(--border-subtle)]" />
        o
        <div className="h-px flex-1 bg-[var(--border-subtle)]" />
      </motion.div>
```

- [ ] **Step 4: Wire it into `SignupForm.tsx`**

Same import and same two blocks, placed right after the heading `motion.div` (before the honeypot `label`/`input` pair) so the divider sits above the business-name field.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Manual check**

Run: `npm run dev`, open `/login` and `/registro`, confirm "Continuar con Google" renders above the email/password fields with an "o" divider. Clicking it will currently error or redirect to a Supabase error page since the Google provider isn't configured yet in Supabase — that's expected at this point in the plan; Task 14 covers the manual setup and end-to-end verification.

- [ ] **Step 7: Commit**

```bash
git add lib/supabase-browser.ts components/GoogleAuthButton.tsx components/LoginForm.tsx components/SignupForm.tsx
git commit -m "feat: add Google OAuth button to login and signup"
```

---

### Task 8: Supabase schema — `needs_onboarding` + trigger + RLS update policy

**Files:**
- Modify: `supabase/schema.sql` (append the migration; this file is a running log of SQL already run against the project, not applied automatically — the corresponding SQL also has to be run by hand against Supabase, same as every prior entry in this file)

**Interfaces:**
- Produces: `businesses.needs_onboarding boolean` column, an `update` RLS policy named `"Users update their own business"` — consumed by Task 9's route (relies on the policy) and Task 11's callback page (reads the column).
- Consumes: nothing new.

- [ ] **Step 1: Append the migration to `supabase/schema.sql`**

Add this at the end of the file:

```sql

-- ============================================================
-- Signup/login overhaul: Google OAuth first-login needs a business
-- name/plan the provider never supplies. The trigger below still fires
-- for every new auth.users row (OAuth included) and still inserts a
-- businesses row with placeholder defaults — this just flags rows that
-- need those placeholders corrected via a post-login screen.
-- Ejecutar en el SQL Editor de Supabase (mismo procedimiento que las
-- migraciones de arriba).
-- ============================================================

alter table public.businesses
  add column if not exists needs_onboarding boolean not null default false;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_business_id uuid;
  is_oauth boolean;
begin
  is_oauth := coalesce(new.raw_app_meta_data->>'provider', 'email') <> 'email';

  insert into public.businesses (name, plan_id, needs_onboarding)
  values (
    coalesce(new.raw_user_meta_data->>'business_name', 'Mi negocio'),
    coalesce(new.raw_user_meta_data->>'plan_id', 'starter'),
    is_oauth
  )
  returning id into new_business_id;

  insert into public.profiles (user_id, business_id, role)
  values (new.id, new_business_id, 'admin');

  return new;
end;
$$;

create policy "Users update their own business"
  on public.businesses for update
  using (id in (select business_id from public.profiles where user_id = auth.uid()))
  with check (id in (select business_id from public.profiles where user_id = auth.uid()));
```

- [ ] **Step 2: Run it against Supabase**

Go to the Supabase dashboard SQL Editor for this project and run exactly the SQL block from Step 1 (not the whole file — the earlier parts already ran in previous work). Confirm no errors.

- [ ] **Step 3: Verify the column and policy exist**

In the Supabase dashboard, open Table Editor → `businesses` and confirm a `needs_onboarding` column exists (type `bool`, default `false`). Open Authentication → Policies (or Database → Policies) for the `businesses` table and confirm an `UPDATE` policy named "Users update their own business" is listed alongside the existing `SELECT` one.

- [ ] **Step 4: Commit the schema file change**

```bash
git add supabase/schema.sql
git commit -m "feat: add needs_onboarding flag for Google OAuth first-login"
```

---

### Task 9: `PATCH /api/auth/complete-profile`

**Files:**
- Create: `app/api/auth/complete-profile/route.ts`
- Modify: `lib/auth-validation.ts` (add `parseCompleteProfilePayload`)
- Test: `test/auth-complete-profile-route.test.ts` (new file)

**Interfaces:**
- Consumes: `isValidPlanId` (private helper already in `lib/auth-validation.ts`), `PlanId` type (already exported).
- Produces: `parseCompleteProfilePayload(body: unknown): { ok: true; data: { businessName: string; planId: PlanId } } | { ok: false; error: string }`. `PATCH` handler at this route, expecting `Authorization: Bearer <access_token>`; on success updates the caller's `businesses` row (`name`, `plan_id`, `needs_onboarding = false`) and responds `{ ok: true }`. Used by Task 10's `CompleteProfileForm`.

This route does **not** go through `runGuards()`/BotID — same reasoning as `notify-password-changed`: it's never hit by a public form, only by our own frontend with a real session's bearer token, and it self-authenticates via that token.

- [ ] **Step 1: Add `parseCompleteProfilePayload` to `lib/auth-validation.ts`**

Append to the end of the file:

```ts

export function parseCompleteProfilePayload(
  body: unknown
): { ok: true; data: { businessName: string; planId: PlanId } } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Solicitud inválida." };
  }
  const b = body as Record<string, unknown>;

  const businessName =
    typeof b.businessName === "string" ? b.businessName.trim().slice(0, MAX_BUSINESS_NAME) : "";
  if (!businessName) {
    return { ok: false, error: "Ingresa el nombre de tu negocio." };
  }

  if (!isValidPlanId(b.planId)) {
    return { ok: false, error: "Selecciona un plan válido." };
  }

  return { ok: true, data: { businessName, planId: b.planId } };
}
```

- [ ] **Step 2: Write the failing test**

Create `test/auth-complete-profile-route.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";

const getUserMock = vi.fn();
const singleMock = vi.fn();
const eqSelectMock = vi.fn(() => ({ single: singleMock }));
const selectMock = vi.fn(() => ({ eq: eqSelectMock }));
const eqUpdateMock = vi.fn();
const updateMock = vi.fn(() => ({ eq: eqUpdateMock }));
const fromMock = vi.fn((table: string) => {
  if (table === "profiles") return { select: selectMock };
  if (table === "businesses") return { update: updateMock };
  throw new Error(`unexpected table ${table}`);
});

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: getUserMock },
    from: fromMock,
  })),
}));

import { PATCH } from "@/app/api/auth/complete-profile/route";

function makeRequest(body: unknown, token: string | null = "valid-token") {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  return new Request("http://localhost/api/auth/complete-profile", {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/auth/complete-profile", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    singleMock.mockReset();
    eqUpdateMock.mockReset();
    fromMock.mockClear();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  it("updates the business and returns ok", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    singleMock.mockResolvedValue({ data: { business_id: "biz-1" }, error: null });
    eqUpdateMock.mockResolvedValue({ error: null });

    const res = await PATCH(makeRequest({ businessName: "Ferretería El Tornillo", planId: "pro" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(updateMock).toHaveBeenCalledWith({
      name: "Ferretería El Tornillo",
      plan_id: "pro",
      needs_onboarding: false,
    });
  });

  it("returns 401 without a token", async () => {
    const res = await PATCH(makeRequest({ businessName: "X", planId: "pro" }, null));
    expect(res.status).toBe(401);
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid payload without calling Supabase", async () => {
    const res = await PATCH(makeRequest({ businessName: "", planId: "pro" }));
    expect(res.status).toBe(400);
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("returns 401 for an invalid token", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: { message: "invalid" } });
    const res = await PATCH(makeRequest({ businessName: "X", planId: "pro" }));
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 3: Run it to see it fail**

Run: `npx vitest run test/auth-complete-profile-route.test.ts`
Expected: FAIL — the route module doesn't exist yet.

- [ ] **Step 4: Implement the route**

Create `app/api/auth/complete-profile/route.ts`:

```ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseCompleteProfilePayload } from "@/lib/auth-validation";

export async function PATCH(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
  }

  const parsed = parseCompleteProfilePayload(body);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ ok: false, error: "Error del servidor." }, { status: 500 });
  }

  try {
    // Cliente propio de esta request, con el token del usuario en el header —
    // NUNCA el singleton de getSupabaseAnon() (lib/supabase.ts), que no lleva
    // ningún header por request y es compartido entre requests concurrentes.
    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("business_id")
      .eq("user_id", userData.user.id)
      .single();
    if (profileError || !profile) {
      return NextResponse.json({ ok: false, error: "No encontramos tu negocio." }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from("businesses")
      .update({
        name: parsed.data.businessName,
        plan_id: parsed.data.planId,
        needs_onboarding: false,
      })
      .eq("id", (profile as { business_id: string }).business_id);

    if (updateError) {
      return NextResponse.json({ ok: false, error: "No pudimos actualizar tu negocio." }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("complete-profile route error", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: "Error del servidor." }, { status: 500 });
  }
}
```

- [ ] **Step 5: Run the test again to see it pass**

Run: `npx vitest run test/auth-complete-profile-route.test.ts`
Expected: PASS.

- [ ] **Step 6: Type-check and run the full suite**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx vitest run`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add lib/auth-validation.ts app/api/auth/complete-profile/route.ts test/auth-complete-profile-route.test.ts
git commit -m "feat: add PATCH /api/auth/complete-profile"
```

---

### Task 10: `/auth/complete-profile` page

**Files:**
- Create: `components/CompleteProfileForm.tsx`
- Create: `app/auth/complete-profile/page.tsx`

**Interfaces:**
- Consumes: `getBrowserSupabase` (Task 7, `lib/supabase-browser.ts`), `PATCH /api/auth/complete-profile` (Task 9), `AuthCard`/`AuthAmbient`.
- Produces: nothing consumed by later tasks — Task 11 only navigates here via `window.location.href`, it doesn't import anything from this page.

- [ ] **Step 1: Implement `CompleteProfileForm`**

Create `components/CompleteProfileForm.tsx`:

```tsx
"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fadeUp, staggerContainer, reducedTransition } from "@/lib/motion";
import { getBrowserSupabase } from "@/lib/supabase-browser";

type State = "idle" | "loading" | "error";

const PLAN_OPTIONS: { id: "starter" | "pro" | "logistica"; label: string }[] = [
  { id: "starter", label: "Starter" },
  { id: "pro", label: "Pro" },
  { id: "logistica", label: "Logística" },
];

const inputGlow =
  "focus-visible:shadow-[0_0_0_4px_var(--bronze-glow)] focus-visible:border-[var(--bronze)]";

export function CompleteProfileForm() {
  const reduce = useReducedMotion();
  const [businessName, setBusinessName] = useState("");
  const [planId, setPlanId] = useState<string>("pro");
  const [state, setState] = useState<State>("idle");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setMsg("");
    try {
      const supabase = getBrowserSupabase();
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) {
        setState("error");
        setMsg("Tu sesión expiró. Vuelve a iniciar sesión.");
        return;
      }

      const res = await fetch("/api/auth/complete-profile", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ businessName, planId }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setState("error");
        setMsg(json.error ?? "No pudimos guardar tu negocio.");
        return;
      }

      const appUrl = process.env.NEXT_PUBLIC_AUREO_APP_URL;
      const { access_token, refresh_token } = sessionData.session!;
      window.location.href = `${appUrl}/index.html#access_token=${encodeURIComponent(
        access_token
      )}&refresh_token=${encodeURIComponent(refresh_token)}`;
    } catch {
      setState("error");
      setMsg("Revisa tu conexión e intenta de nuevo.");
    }
  }

  return (
    <motion.form
      onSubmit={onSubmit}
      className="flex w-full max-w-md flex-col gap-3"
      noValidate
      variants={staggerContainer}
      initial={reduce ? false : "hidden"}
      animate="visible"
    >
      <motion.div variants={fadeUp} className="mb-2">
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
          Un último paso
        </h1>
        <div className="mt-2 h-0.5 w-10 rounded-full bg-[var(--bronze)]" aria-hidden />
        <p className="mt-3 text-[var(--text-secondary)]">
          Cuéntanos de tu negocio para configurar tu cuenta.
        </p>
      </motion.div>
      <motion.div variants={fadeUp}>
        <Input
          type="text"
          required
          placeholder="Nombre de tu negocio"
          aria-label="Nombre de tu negocio"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className={`min-h-11 ${inputGlow}`}
        />
      </motion.div>
      <motion.div variants={fadeUp} className="flex gap-2">
        {PLAN_OPTIONS.map((p) => (
          <motion.button
            key={p.id}
            type="button"
            onClick={() => setPlanId(p.id)}
            aria-pressed={planId === p.id}
            whileHover={reduce ? undefined : { scale: 1.03 }}
            whileTap={reduce ? undefined : { scale: 0.97 }}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
              planId === p.id
                ? "border-[var(--bronze)] bg-[var(--bronze)]/10 text-[var(--bronze)]"
                : "border-[var(--border-subtle)] text-[var(--text-secondary)]"
            }`}
          >
            {p.label}
          </motion.button>
        ))}
      </motion.div>
      <motion.div variants={fadeUp}>
        <motion.div
          whileHover={reduce ? undefined : { scale: 1.02 }}
          whileTap={reduce ? undefined : { scale: 0.98 }}
        >
          <Button
            type="submit"
            disabled={state === "loading"}
            aria-busy={state === "loading"}
            className="min-h-11 w-full"
          >
            {state === "loading" ? "Guardando…" : "Entrar a Aureo"}
          </Button>
        </motion.div>
      </motion.div>
      <motion.p
        role="alert"
        aria-live="polite"
        animate={state === "error" && !reduce ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
        transition={reducedTransition(reduce, 0, 0.4)}
        className="min-h-5 text-sm text-[var(--terracotta)]"
      >
        {state === "error" ? msg : ""}
      </motion.p>
    </motion.form>
  );
}
```

- [ ] **Step 2: Implement the page**

Create `app/auth/complete-profile/page.tsx`:

```tsx
import { CompleteProfileForm } from "@/components/CompleteProfileForm";
import { AuthCard } from "@/components/ui/AuthCard";
import { AuthAmbient } from "@/components/ui/AuthAmbient";

export const metadata = {
  title: "Completa tu perfil · Aureo",
  robots: { index: false },
};

export default function CompleteProfilePage() {
  return (
    <AuthAmbient>
      <AuthCard>
        <CompleteProfileForm />
      </AuthCard>
    </AuthAmbient>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/CompleteProfileForm.tsx app/auth/complete-profile/page.tsx
git commit -m "feat: add /auth/complete-profile page"
```

---

### Task 11: `/auth/oauth-callback` page

**Files:**
- Create: `app/auth/oauth-callback/page.tsx`

**Interfaces:**
- Consumes: `getBrowserSupabase` (Task 7), `businesses.needs_onboarding` (Task 8), `/auth/complete-profile` (Task 10, navigated to via `window.location.href`, not imported).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Implement the page**

Create `app/auth/oauth-callback/page.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { AuthCard } from "@/components/ui/AuthCard";
import { AuthAmbient } from "@/components/ui/AuthAmbient";

type BusinessRow = { needs_onboarding: boolean };

export default function OAuthCallbackPage() {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const supabase = getBrowserSupabase();
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (cancelled) return;
        if (sessionError || !sessionData.session) {
          setFailed(true);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("businesses(needs_onboarding)")
          .eq("user_id", sessionData.session.user.id)
          .single();
        if (cancelled) return;
        if (profileError || !profile) {
          setFailed(true);
          return;
        }

        const business = (profile as { businesses: BusinessRow | BusinessRow[] }).businesses;
        const needsOnboarding = Array.isArray(business) ? business[0]?.needs_onboarding : business?.needs_onboarding;

        if (needsOnboarding) {
          window.location.href = "/auth/complete-profile";
          return;
        }

        const appUrl = process.env.NEXT_PUBLIC_AUREO_APP_URL;
        const { access_token, refresh_token } = sessionData.session;
        window.location.href = `${appUrl}/index.html#access_token=${encodeURIComponent(
          access_token
        )}&refresh_token=${encodeURIComponent(refresh_token)}`;
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    return (
      <AuthAmbient>
        <AuthCard>
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
              No pudimos iniciar sesión
            </h1>
            <p className="text-[var(--text-secondary)]">
              Intenta de nuevo o usa tu correo y contraseña.
            </p>
            <a href="/login" className="text-sm text-[var(--bronze)] underline underline-offset-2">
              Volver a iniciar sesión
            </a>
          </div>
        </AuthCard>
      </AuthAmbient>
    );
  }

  return (
    <AuthAmbient>
      <AuthCard>
        <div role="status" className="flex flex-col items-center gap-3 py-4 text-center">
          <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">Entrando…</h1>
        </div>
      </AuthCard>
    </AuthAmbient>
  );
}
```

Note: the `profiles(businesses(needs_onboarding))` embed relies on the `profiles.business_id → businesses.id` foreign key already in `supabase/schema.sql` and both tables' existing `select` RLS policies — no new policy needed for this read (only the `update` policy from Task 8 was new).

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/auth/oauth-callback/page.tsx
git commit -m "feat: add /auth/oauth-callback page"
```

---

### Task 12: Two-column `/login`

**Files:**
- Create: `components/ui/AuthSplitPanel.tsx`
- Modify: `app/login/page.tsx`

**Interfaces:**
- Consumes: `DashboardMock` (`@/components/ui/DashboardMock`, existing), `AuthCard` (existing).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Implement `AuthSplitPanel`**

Create `components/ui/AuthSplitPanel.tsx`:

```tsx
"use client";
import { motion, useReducedMotion } from "motion/react";
import { DashboardMock } from "@/components/ui/DashboardMock";
import { fadeUp, staggerContainer, reducedTransition } from "@/lib/motion";

const BENEFITS = [
  "14 días gratis, sin tarjeta",
  "Control de inventario en tiempo real",
  "Precio de fundador asegurado desde el día uno",
];

export function AuthSplitPanel() {
  const reduce = useReducedMotion();

  return (
    <div className="relative hidden flex-col justify-center overflow-hidden bg-[var(--bg-navy)] px-10 py-16 lg:flex lg:w-1/2">
      <motion.div
        className="mx-auto w-full max-w-md"
        variants={staggerContainer}
        initial={reduce ? false : "hidden"}
        animate="visible"
      >
        <motion.h2
          variants={fadeUp}
          className="font-display text-2xl font-bold text-[var(--text-cream)]"
        >
          Todo tu inventario, bajo control.
        </motion.h2>
        <motion.ul variants={fadeUp} className="mt-6 space-y-3">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-center gap-2 text-sm text-[var(--text-cream)]/80">
              <svg className="h-4 w-4 flex-shrink-0 text-[var(--emerald)]" viewBox="0 0 16 16" fill="none">
                <path d="M3 8L6.5 11.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {b}
            </li>
          ))}
        </motion.ul>
        <motion.div
          variants={fadeUp}
          initial={reduce ? false : { opacity: 0, y: 12 }}
          transition={reducedTransition(reduce, 0.2, 0.6)}
          className="mt-8"
        >
          <DashboardMock className="w-full" />
        </motion.div>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Restructure `app/login/page.tsx`**

Replace the current contents:

```tsx
import { LoginForm } from "@/components/LoginForm";
import { AuthCard } from "@/components/ui/AuthCard";
import { AuthAmbient } from "@/components/ui/AuthAmbient";

export const metadata = {
  title: "Inicia sesión · Aureo",
};

export default function LoginPage() {
  return (
    <AuthAmbient>
      <AuthCard>
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
          Inicia sesión
        </h1>
        <div className="mt-2 h-0.5 w-10 rounded-full bg-[var(--bronze)]" aria-hidden />
        <div className="mt-6">
          <LoginForm />
        </div>
      </AuthCard>
    </AuthAmbient>
  );
}
```

with:

```tsx
import { LoginForm } from "@/components/LoginForm";
import { AuthCard } from "@/components/ui/AuthCard";
import { AuthSplitPanel } from "@/components/ui/AuthSplitPanel";

export const metadata = {
  title: "Inicia sesión · Aureo",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      <AuthSplitPanel />
      <div className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="w-full max-w-md">
          <AuthCard>
            <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
              Inicia sesión
            </h1>
            <div className="mt-2 h-0.5 w-10 rounded-full bg-[var(--bronze)]" aria-hidden />
            <div className="mt-6">
              <LoginForm />
            </div>
          </AuthCard>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual check**

Run: `npm run dev`, open `/login` at a desktop width (≥1024px, the `lg:` breakpoint) — confirm the left panel (dark background, headline, benefits list, `DashboardMock`) and the right column (login card) both render side by side. Resize below 1024px and confirm the left panel disappears, leaving only the centered login card.

- [ ] **Step 5: Commit**

```bash
git add components/ui/AuthSplitPanel.tsx app/login/page.tsx
git commit -m "feat: two-column layout for /login"
```

---

### Task 13: Playwright e2e for landing CTAs

**Files:**
- Create: `e2e/landing-ctas.spec.ts`

**Interfaces:**
- Consumes: nothing new — this is a black-box test of the rendered pages from Tasks 1-4.

- [ ] **Step 1: Write the test**

Create `e2e/landing-ctas.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("Nav CTAs llevan a /login y /registro", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Iniciar sesión" })).toHaveAttribute("href", "/login");
  await expect(page.getByRole("link", { name: "Empieza gratis" })).toHaveAttribute("href", "/registro");
});

test("Hero CTA lleva a /registro", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Empieza tu prueba gratis" })).toHaveAttribute("href", "/registro");
});

test("cada tarjeta de precio lleva a /registro con su plan", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Iniciar prueba gratis" }).first().scrollIntoViewIfNeeded();
  const links = page.getByRole("link", { name: "Iniciar prueba gratis" });
  await expect(links).toHaveCount(3);
  const hrefs = await links.evaluateAll((els) => els.map((el) => el.getAttribute("href")));
  expect(hrefs.sort()).toEqual([
    "/registro?plan=logistica",
    "/registro?plan=pro",
    "/registro?plan=starter",
  ]);
});
```

- [ ] **Step 2: Run it**

Run: `npx playwright test e2e/landing-ctas.spec.ts`
Expected: PASS. If the "Iniciar sesión" link doesn't match (it's `hidden sm:inline` in `Nav.tsx` — Playwright's default viewport is wider than the `sm` breakpoint, so this should be visible and pass; if it fails on visibility, check the configured Playwright viewport in `playwright.config.ts` before changing the component).

- [ ] **Step 3: Commit**

```bash
git add e2e/landing-ctas.spec.ts
git commit -m "test: add e2e coverage for landing CTA targets"
```

---

### Task 14: Google OAuth manual setup + full manual E2E pass

**Files:** none (Google Cloud Console + Supabase dashboard configuration, plus verification)

**Interfaces:** none — this task turns on the Google provider this plan's code has been assuming is available, and proves the whole feature end-to-end.

- [ ] **Step 1: Create Google OAuth credentials**

In Google Cloud Console (console.cloud.google.com):
1. Create a new project (or pick an existing one for Aureo).
2. Go to "APIs & Services" → "OAuth consent screen". Choose "External", fill in the app name ("Aureo"), support email, and add the Supabase callback domain if prompted. Publish it (or leave in testing with your own email added as a test user, for initial verification).
3. Go to "APIs & Services" → "Credentials" → "Create Credentials" → "OAuth client ID". Application type: "Web application".
4. Under "Authorized redirect URIs", add the Supabase callback URL: `https://ihqbjwnznuxdpihzajhp.supabase.co/auth/v1/callback` (this exact URL — Supabase, not `aureo-landing.vercel.app` — is what receives Google's redirect before Supabase forwards to our `redirectTo`).
5. Save. Copy the generated **Client ID** and **Client Secret**.

- [ ] **Step 2: Enable the provider in Supabase**

Go to `https://supabase.com/dashboard/project/ihqbjwnznuxdpihzajhp/auth/providers`, find "Google", toggle it on, paste the Client ID and Client Secret from Step 1, save.

- [ ] **Step 3: Deploy**

```bash
git push
```

Wait for the Vercel deployment to reach `READY` (use the Vercel MCP tools' `list_deployments`/`get_deployment`, same as prior deploys in this project).

- [ ] **Step 4: Manual E2E — Google sign-in, first time**

1. On the deployed site, go to `/login`, click "Continuar con Google", complete the Google sign-in with an account that has never signed into Aureo before.
2. Confirm you land on `/auth/complete-profile` (not directly in `aureo`).
3. Fill in a business name, pick a plan, submit.
4. Confirm you land in `aureo` with a working session.
5. In the Supabase dashboard Table Editor, check the `businesses` row for that user: `needs_onboarding` should be `false`, `name`/`plan_id` should match what you entered.

- [ ] **Step 5: Manual E2E — Google sign-in, second time**

Log out of `aureo`, go back to `/login`, click "Continuar con Google" again with the same account. Confirm it goes straight to `aureo` — no `/auth/complete-profile` detour.

- [ ] **Step 6: Manual E2E — email signup regression**

Sign up normally with email/password on `/registro`. After confirming the email and logging in, check that account's `businesses` row: `needs_onboarding` should be `false` from the start (proves the trigger change didn't affect the existing email flow).

- [ ] **Step 7: Manual E2E — terms checkbox and password toggles**

On `/registro`, confirm the submit button stays disabled until the terms checkbox is checked. On `/login`, `/registro`, and `/auth/reset` (use a real reset link from the forgot-password flow), confirm each password field's eye icon toggles visibility.

- [ ] **Step 8: Manual E2E — landing CTAs on the live site**

Click through Nav ("Iniciar sesión", "Empieza gratis"), the Hero button, the final CTA button, and each pricing card's button — confirm each lands on the right page/plan, matching Task 13's automated coverage but against production.
