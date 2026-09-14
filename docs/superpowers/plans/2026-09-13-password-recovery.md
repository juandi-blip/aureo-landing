# Password Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users who forgot their password recover access via a secure, click-gated email flow, and require stronger passwords (upper+lower+digit) everywhere a password is set.

**Architecture:** Two new pages (`/forgot-password`, `/auth/reset`) plus two new API routes, reusing the existing auth UI components (`AuthCard`, `AuthAmbient`, `lib/motion.ts`) and the click-gated verification pattern already proven in `components/ConfirmAccount.tsx` (the recovery link only does something once the user submits a form — never on a bare page load, so an email scanner visiting the link can't burn the one-time token).

**Tech Stack:** Next.js 16 App Router, Supabase Auth (`@supabase/supabase-js` 2.108.2, client-side `verifyOtp`/`updateUser`/`signOut`), Resend (transactional email), Vitest (unit/route tests), Playwright (one e2e smoke test).

**Spec:** `docs/superpowers/specs/2026-09-13-password-recovery-design.md`

## Global Constraints

- Password rule (applies to signup AND reset): min 8 chars, max 72, at least 1 uppercase, 1 lowercase, 1 digit. No symbol required.
- `/api/auth/forgot-password` always responds `{ ok: true }` with the same generic message — never reveals whether an email has an account.
- Any new public-facing POST route must be added to `instrumentation-client.ts`'s BotID `protect` list, or real users get falsely blocked (this bit us twice already in this project).
- Every async action that can fail on network error must be wrapped in try/catch with a "Revisa tu conexión e intenta de nuevo." fallback — a bare `await` left the confirm-account button stuck on "Confirmando…" forever in an earlier bug.
- Best-effort steps (closing other sessions, sending the change-notice email) must never block the user from reaching `/login` after a successful password change.

---

### Task 1: Shared password-strength validator

**Files:**
- Modify: `lib/auth-validation.ts:1-27` (the `MIN_PASSWORD`/`MAX_PASSWORD` constants and `isValidPassword` function, plus the error message in `parseSignupPayload`)
- Modify: `test/auth-validation.test.ts:6-18` (existing "accepts a valid payload" test uses an all-lowercase password that will start failing)
- Modify: `test/auth-signup-route.test.ts` (three tests use the same all-lowercase fixture password)

**Interfaces:**
- Produces: `isValidPassword(password: unknown): password is string` (exported — currently NOT exported, needed by Task 6's client component), `PASSWORD_REQUIREMENT_MSG: string` (exported constant, the shared error copy).
- Consumes: nothing new.

- [ ] **Step 1: Update the existing password test to use a fixture that will need to pass the new rule, and add two new failing cases**

Edit `test/auth-validation.test.ts`. Replace the `"accepts a valid payload"` test's password and add two new tests right after it:

```ts
  it("accepts a valid payload", () => {
    const result = parseSignupPayload({
      email: "Test@Example.com",
      password: "Correcthorse1",
      businessName: "Ferretería El Tornillo",
      planId: "pro",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.email).toBe("test@example.com");
      expect(result.data.planId).toBe("pro");
    }
  });

  it("rejects a password with no uppercase letter", () => {
    const result = parseSignupPayload({
      email: "test@example.com",
      password: "correcthorse1",
      businessName: "Negocio",
      planId: "starter",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a password with no digit", () => {
    const result = parseSignupPayload({
      email: "test@example.com",
      password: "Correcthorse",
      businessName: "Negocio",
      planId: "starter",
    });
    expect(result.ok).toBe(false);
  });
```

- [ ] **Step 2: Run the tests to see the new/changed ones fail**

Run: `npx vitest run test/auth-validation.test.ts`
Expected: the "accepts a valid payload" test and the two new tests FAIL (current `isValidPassword` only checks length, so `"correcthorse1"` and `"Correcthorse"` both currently pass — they shouldn't after this task).

- [ ] **Step 3: Update the fixture passwords in the signup route test**

Edit `test/auth-signup-route.test.ts`. Replace every occurrence of `"correcthorsebattery"` with `"Correcthorse1"` (three occurrences, in the three `makeRequest({...})` calls inside the `it(...)` blocks — do not touch the 400-validation test, it doesn't use that fixture).

- [ ] **Step 4: Implement the stronger password rule**

Edit `lib/auth-validation.ts`. Replace lines 1-27 with:

```ts
import { HONEYPOT_FIELD, isValidEmail } from "@/lib/validation";

const MIN_PASSWORD = 8;
const MAX_PASSWORD = 72; // bcrypt/Supabase practical cap
const MAX_BUSINESS_NAME = 80;
const PLAN_IDS = ["starter", "pro", "logistica"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export const PASSWORD_REQUIREMENT_MSG = `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres, con mayúscula, minúscula y número.`;

export type SignupInput = {
  email: string;
  password: string;
  businessName: string;
  planId: PlanId;
};

export type LoginInput = {
  email: string;
  password: string;
};

export function isValidPassword(password: unknown): password is string {
  return (
    typeof password === "string" &&
    password.length >= MIN_PASSWORD &&
    password.length <= MAX_PASSWORD &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}
```

Then find the `parseSignupPayload` function further down and replace its password-check block:

```ts
  if (!isValidPassword(b.password)) {
    return { ok: false, error: `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.` };
  }
```

with:

```ts
  if (!isValidPassword(b.password)) {
    return { ok: false, error: PASSWORD_REQUIREMENT_MSG };
  }
```

- [ ] **Step 5: Run the tests again to see them pass**

Run: `npx vitest run test/auth-validation.test.ts test/auth-signup-route.test.ts`
Expected: all PASS.

- [ ] **Step 6: Type-check the whole project**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add lib/auth-validation.ts test/auth-validation.test.ts test/auth-signup-route.test.ts
git commit -m "feat: require uppercase, lowercase and digit in passwords"
```

---

### Task 2: Password-changed notification email

**Files:**
- Modify: `lib/email.ts` (append a new exported function after the existing `notifyNewSignup`)
- Test: `test/email.test.ts` (new file)

**Interfaces:**
- Consumes: nothing new (reuses the module's existing `getResend()` helper and `escapeHtml()`).
- Produces: `notifyPasswordChanged(rawEmail: string): Promise<void>` — used by Task 4's route.

- [ ] **Step 1: Write the failing test**

Create `test/email.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";

const sendMock = vi.fn();
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({ emails: { send: sendMock } })),
}));

import { notifyPasswordChanged } from "@/lib/email";

describe("notifyPasswordChanged", () => {
  beforeEach(() => {
    sendMock.mockReset();
    process.env.RESEND_API_KEY = "re_test_key";
  });

  it("sends a notice to the user's own email", async () => {
    sendMock.mockResolvedValue({ data: { id: "1" }, error: null });

    await notifyPasswordChanged("user@example.com");

    expect(sendMock).toHaveBeenCalledTimes(1);
    const call = sendMock.mock.calls[0][0];
    expect(call.to).toBe("user@example.com");
    expect(call.subject).toContain("contraseña");
  });

  it("does nothing when RESEND_API_KEY is not configured", async () => {
    delete process.env.RESEND_API_KEY;

    await notifyPasswordChanged("user@example.com");

    expect(sendMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run test/email.test.ts`
Expected: FAIL — `notifyPasswordChanged` is not exported from `@/lib/email` yet.

- [ ] **Step 3: Implement `notifyPasswordChanged`**

Append to `lib/email.ts` (after the closing brace of `notifyNewSignup`):

```ts

export async function notifyPasswordChanged(rawEmail: string): Promise<void> {
  const client = getResend();
  if (!client) return; // Silently skip if not configured

  const email = escapeHtml(rawEmail);
  const fromDomain = process.env.RESEND_FROM_DOMAIN ?? "onboarding@resend.dev";

  await client.emails.send({
    from: `Aureo <${fromDomain}>`,
    to: rawEmail,
    subject: "Tu contraseña de Aureo cambió",
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #F7F3EA; border-radius: 12px;">
        <h1 style="color: #2E4A6E; font-size: 22px; margin: 0 0 8px;">Tu contraseña cambió</h1>
        <p style="color: #6E6354; margin: 0 0 16px; font-size: 15px;">
          Confirmamos que la contraseña de tu cuenta (${email}) en Aureo fue actualizada hace un momento.
        </p>
        <p style="color: #6E6354; margin: 0; font-size: 14px;">
          Si no fuiste tú, contáctanos de inmediato — alguien más podría tener acceso a tu cuenta.
        </p>
      </div>
    `,
  });
}
```

- [ ] **Step 4: Run the test again to see it pass**

Run: `npx vitest run test/email.test.ts`
Expected: PASS.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/email.ts test/email.test.ts
git commit -m "feat: add password-changed notification email"
```

---

### Task 3: `POST /api/auth/forgot-password`

**Files:**
- Create: `app/api/auth/forgot-password/route.ts`
- Modify: `instrumentation-client.ts` (add the route to BotID's `protect` list)
- Test: `test/auth-forgot-password-route.test.ts` (new file)

**Interfaces:**
- Consumes: `parseResendPayload` from `@/lib/auth-validation` (already exists — it validates a bare `{ email }` payload and is already used by `/api/auth/resend`; reused here rather than duplicated, since the shape is identical), `runGuards` from `@/lib/api-guards`, `getSupabaseAnon` from `@/lib/supabase`.
- Produces: `POST` handler at this route, always responding `{ ok: true, message: string }` with status 200 on any well-formed request (the no-enumeration guarantee), or `{ ok: false, error: string }` with 400 only for a malformed email / bot / guard rejection.

- [ ] **Step 1: Write the failing test**

Create `test/auth-forgot-password-route.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/api-guards", () => ({ runGuards: vi.fn(async () => null) }));

const resetMock = vi.fn();
vi.mock("@/lib/supabase", () => ({
  getSupabaseAnon: () => ({ auth: { resetPasswordForEmail: resetMock } }),
}));

import { POST } from "@/app/api/auth/forgot-password/route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/forgot-password", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    resetMock.mockReset();
  });

  it("returns ok and calls Supabase for a well-formed email", async () => {
    resetMock.mockResolvedValue({ data: {}, error: null });
    const res = await POST(makeRequest({ email: "test@example.com" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(resetMock).toHaveBeenCalledWith(
      "test@example.com",
      expect.objectContaining({ redirectTo: expect.stringContaining("/auth/reset") })
    );
  });

  it("returns the same ok response even when Supabase errors (no enumeration)", async () => {
    resetMock.mockRejectedValue(new Error("boom"));
    const res = await POST(makeRequest({ email: "nonexistent@example.com" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  it("returns 400 for an invalid email without calling Supabase", async () => {
    const res = await POST(makeRequest({ email: "not-an-email" }));
    expect(res.status).toBe(400);
    expect(resetMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run test/auth-forgot-password-route.test.ts`
Expected: FAIL — the route module doesn't exist yet.

- [ ] **Step 3: Implement the route**

Create `app/api/auth/forgot-password/route.ts`:

```ts
import { NextResponse } from "next/server";
import { parseResendPayload } from "@/lib/auth-validation";
import { getSupabaseAnon } from "@/lib/supabase";
import { runGuards } from "@/lib/api-guards";

const GENERIC_MESSAGE =
  "Si el correo existe, te enviamos un enlace para restablecer tu contraseña.";

export async function POST(request: Request) {
  const guardResponse = await runGuards(request);
  if (guardResponse) return guardResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
  }

  const parsed = parseResendPayload(body);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aureo.com.co";

  try {
    const supabase = getSupabaseAnon();
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${SITE_URL}/auth/reset`,
    });
  } catch (e) {
    // Nunca se refleja al cliente: revelar el error filtraría si el correo existe.
    console.error("forgot-password route error", e instanceof Error ? e.message : e);
  }

  return NextResponse.json({ ok: true, message: GENERIC_MESSAGE }, { status: 200 });
}
```

- [ ] **Step 4: Run the test again to see it pass**

Run: `npx vitest run test/auth-forgot-password-route.test.ts`
Expected: PASS.

- [ ] **Step 5: Register the route with BotID**

Edit `instrumentation-client.ts`. Add one entry to the `protect` array (after the `/api/auth/resend` entry):

```ts
    { path: "/api/auth/resend", method: "POST" },
    { path: "/api/auth/forgot-password", method: "POST" },
```

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add app/api/auth/forgot-password/route.ts instrumentation-client.ts test/auth-forgot-password-route.test.ts
git commit -m "feat: add POST /api/auth/forgot-password"
```

---

### Task 4: `POST /api/auth/notify-password-changed`

**Files:**
- Create: `app/api/auth/notify-password-changed/route.ts`
- Test: `test/auth-notify-password-changed-route.test.ts` (new file)

**Interfaces:**
- Consumes: `getSupabaseAnon` from `@/lib/supabase`, `notifyPasswordChanged` from `@/lib/email` (Task 2).
- Produces: `POST` handler expecting `Authorization: Bearer <access_token>`; responds `{ ok: true }` (200) after sending the notice, `{ ok: false, error }` (401) for a missing/invalid token, `{ ok: false, error }` (500) on unexpected failure. Used by Task 6's `ResetPasswordForm`.

- [ ] **Step 1: Write the failing test**

Create `test/auth-notify-password-changed-route.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";

const getUserMock = vi.fn();
vi.mock("@/lib/supabase", () => ({
  getSupabaseAnon: () => ({ auth: { getUser: getUserMock } }),
}));

const notifyMock = vi.fn();
vi.mock("@/lib/email", () => ({ notifyPasswordChanged: notifyMock }));

import { POST } from "@/app/api/auth/notify-password-changed/route";

function makeRequest(token: string | null) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  return new Request("http://localhost/api/auth/notify-password-changed", {
    method: "POST",
    headers,
  });
}

describe("POST /api/auth/notify-password-changed", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    notifyMock.mockReset();
  });

  it("sends the notice for a valid token", async () => {
    getUserMock.mockResolvedValue({ data: { user: { email: "user@example.com" } }, error: null });
    const res = await POST(makeRequest("valid-token"));
    expect(res.status).toBe(200);
    expect(notifyMock).toHaveBeenCalledWith("user@example.com");
  });

  it("returns 401 without a token", async () => {
    const res = await POST(makeRequest(null));
    expect(res.status).toBe(401);
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("returns 401 for an invalid token", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: { message: "invalid" } });
    const res = await POST(makeRequest("bad-token"));
    expect(res.status).toBe(401);
    expect(notifyMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run test/auth-notify-password-changed-route.test.ts`
Expected: FAIL — the route module doesn't exist yet.

- [ ] **Step 3: Implement the route**

Create `app/api/auth/notify-password-changed/route.ts`:

```ts
import { NextResponse } from "next/server";
import { getSupabaseAnon } from "@/lib/supabase";
import { notifyPasswordChanged } from "@/lib/email";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAnon();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user?.email) {
      return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
    }

    await notifyPasswordChanged(data.user.email);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("notify-password-changed route error", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: "Error del servidor." }, { status: 500 });
  }
}
```

Note: this route intentionally does **not** call `runGuards()` — it's never hit by a public form, only by `ResetPasswordForm` right after a real Supabase session was established, and it self-authenticates via the bearer token instead.

- [ ] **Step 4: Run the test again to see it pass**

Run: `npx vitest run test/auth-notify-password-changed-route.test.ts`
Expected: PASS.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/api/auth/notify-password-changed/route.ts test/auth-notify-password-changed-route.test.ts
git commit -m "feat: add POST /api/auth/notify-password-changed"
```

---

### Task 5: `/forgot-password` page

**Files:**
- Create: `components/ForgotPasswordForm.tsx`
- Create: `app/forgot-password/page.tsx`
- Test: `e2e/forgot-password.spec.ts` (new file)

**Interfaces:**
- Consumes: `Button` (`@/components/ui/button`), `Input` (`@/components/ui/input`), `fadeUp`/`staggerContainer`/`reducedTransition` (`@/lib/motion`), `AuthCard`/`AuthAmbient` (`@/components/ui/AuthCard`, `@/components/ui/AuthAmbient`). Posts to `/api/auth/forgot-password` (Task 3).
- Produces: `ForgotPasswordForm` component, mounted at route `/forgot-password`. Task 7 links to this route.

- [ ] **Step 1: Write the failing e2e test**

Create `e2e/forgot-password.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("usuario pide un enlace de recuperación", async ({ page }) => {
  await page.route("**/api/auth/forgot-password", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, message: "Si el correo existe, te enviamos un enlace." }),
    })
  );

  await page.goto("/forgot-password");
  await page.getByLabel("Correo electrónico").fill("prueba@aureo.app");
  await page.getByRole("button", { name: /enviar enlace/i }).click();

  await expect(page.getByRole("status")).toContainText(/revisa tu correo/i);
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx playwright test e2e/forgot-password.spec.ts`
Expected: FAIL — `/forgot-password` doesn't exist yet (404 or missing form elements).

- [ ] **Step 3: Implement `ForgotPasswordForm.tsx`**

Create `components/ForgotPasswordForm.tsx`:

```tsx
"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fadeUp, staggerContainer, reducedTransition } from "@/lib/motion";

type State = "idle" | "loading" | "error" | "sent";

const inputGlow =
  "focus-visible:shadow-[0_0_0_4px_var(--bronze-glow)] focus-visible:border-[var(--bronze)]";

export function ForgotPasswordForm() {
  const reduce = useReducedMotion();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setMsg("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setState("error");
        setMsg(json.error ?? "No pudimos procesar la solicitud.");
        return;
      }
      setState("sent");
    } catch {
      setState("error");
      setMsg("Revisa tu conexión e intenta de nuevo.");
    }
  }

  if (state === "sent") {
    return (
      <motion.div
        role="status"
        className="flex flex-col items-center gap-3 py-4 text-center"
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reducedTransition(reduce, 0, 0.45)}
      >
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
          Revisa tu correo
        </h1>
        <p className="text-[var(--text-secondary)]">
          Si ese correo tiene una cuenta en Aureo, te enviamos un enlace para
          restablecer tu contraseña.
        </p>
      </motion.div>
    );
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
          ¿Olvidaste tu contraseña?
        </h1>
        <div className="mt-2 h-0.5 w-10 rounded-full bg-[var(--bronze)]" aria-hidden />
        <p className="mt-3 text-[var(--text-secondary)]">
          Escribe tu correo y te enviamos un enlace para restablecerla.
        </p>
      </motion.div>
      <motion.div variants={fadeUp}>
        <Input
          type="email"
          required
          placeholder="Tu correo"
          aria-label="Correo electrónico"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`min-h-11 ${inputGlow}`}
        />
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
            {state === "loading" ? "Enviando…" : "Enviar enlace"}
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

- [ ] **Step 4: Implement the page**

Create `app/forgot-password/page.tsx`:

```tsx
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";
import { AuthCard } from "@/components/ui/AuthCard";
import { AuthAmbient } from "@/components/ui/AuthAmbient";

export const metadata = {
  title: "Recuperar contraseña · Aureo",
};

export default function ForgotPasswordPage() {
  return (
    <AuthAmbient>
      <AuthCard>
        <ForgotPasswordForm />
      </AuthCard>
    </AuthAmbient>
  );
}
```

- [ ] **Step 5: Run the e2e test again to see it pass**

Run: `npx playwright test e2e/forgot-password.spec.ts`
Expected: PASS. (If Playwright needs a dev server and none is running, `playwright.config.ts` already handles this the same way `e2e/waitlist.spec.ts` does — no extra setup needed.)

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add components/ForgotPasswordForm.tsx app/forgot-password/page.tsx e2e/forgot-password.spec.ts
git commit -m "feat: add /forgot-password page"
```

---

### Task 6: `/auth/reset` page

**Files:**
- Create: `components/ResetPasswordForm.tsx`
- Create: `app/auth/reset/page.tsx`

**Interfaces:**
- Consumes: `isValidPassword`/`PASSWORD_REQUIREMENT_MSG` from `@/lib/auth-validation` (Task 1), `Button`/`Input`, `fadeUp`/`staggerContainer`/`reducedTransition`, `AuthCard`/`AuthAmbient`. Calls Supabase directly client-side (`verifyOtp`, `updateUser`, `signOut`) and posts to `/api/auth/forgot-password` (Task 3, for the "send a new link" retry) and `/api/auth/notify-password-changed` (Task 4).
- Produces: `ResetPasswordForm` component mounted at `/auth/reset`. No other task depends on its internals.

No automated test for this task — it drives Supabase's real auth endpoints directly from the browser (`verifyOtp`/`updateUser`/`signOut`), which nothing in this repo currently mocks at the network layer (unlike our own `/api/*` routes, which the Playwright tests intercept with `page.route`). Verify with `npx tsc --noEmit` plus the full manual E2E pass in Task 8.

- [ ] **Step 1: Implement `ResetPasswordForm.tsx`**

Create `components/ResetPasswordForm.tsx`:

```tsx
"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fadeUp, staggerContainer, reducedTransition } from "@/lib/motion";
import { isValidPassword, PASSWORD_REQUIREMENT_MSG } from "@/lib/auth-validation";

type State = "idle" | "loading" | "success" | "error" | "expired" | "resent";

const inputGlow =
  "focus-visible:shadow-[0_0_0_4px_var(--bronze-glow)] focus-visible:border-[var(--bronze)]";

// Mismo patrón que ConfirmAccount.tsx: el link de recuperación no hace nada
// hasta que el usuario escribe su nueva contraseña y envía el formulario —
// así un escáner de correo que visite el link no gasta el token.
function getBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export function ResetPasswordForm() {
  const reduce = useReducedMotion();
  const searchParams = useSearchParams();
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, setState] = useState<State>("idle");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");

    if (!tokenHash || type !== "recovery") {
      setState("expired");
      return;
    }
    if (!isValidPassword(password)) {
      setState("error");
      setMsg(PASSWORD_REQUIREMENT_MSG);
      return;
    }
    if (password !== confirm) {
      setState("error");
      setMsg("Las contraseñas no coinciden.");
      return;
    }

    setState("loading");
    const supabase = getBrowserSupabase();
    try {
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "recovery",
      });
      if (verifyError || !verifyData.session) {
        setState("expired");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setState("error");
        setMsg(PASSWORD_REQUIREMENT_MSG);
        return;
      }

      try {
        await supabase.auth.signOut({ scope: "others" });
      } catch {
        // best-effort: no bloquea el flujo si falla
      }
      try {
        await fetch("/api/auth/notify-password-changed", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${verifyData.session.access_token}`,
          },
        });
      } catch {
        // best-effort: no bloquea el flujo si falla
      }

      setState("success");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1400);
    } catch {
      setState("error");
      setMsg("Revisa tu conexión e intenta de nuevo.");
    }
  }

  async function onResend() {
    if (!email) return;
    setState("loading");
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setState("resent");
    } catch {
      setState("error");
      setMsg("Revisa tu conexión e intenta de nuevo.");
    }
  }

  if (state === "success") {
    return (
      <motion.div
        role="status"
        className="flex flex-col items-center gap-3 py-4 text-center"
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reducedTransition(reduce, 0, 0.45)}
      >
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
          ¡Contraseña actualizada!
        </h1>
        <p className="text-[var(--text-secondary)]">Te llevamos a iniciar sesión…</p>
      </motion.div>
    );
  }

  if (state === "expired") {
    return (
      <motion.div
        role="status"
        className="flex flex-col items-center gap-4 py-4 text-center"
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reducedTransition(reduce, 0, 0.45)}
      >
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
          Enlace expirado
        </h1>
        <p className="text-[var(--text-secondary)]">
          Este enlace ya expiró o fue usado. Pide uno nuevo para continuar.
        </p>
        {email && (
          <Button type="button" onClick={onResend} className="min-h-11 w-full">
            Enviar enlace nuevo
          </Button>
        )}
      </motion.div>
    );
  }

  if (state === "resent") {
    return (
      <motion.div
        role="status"
        className="flex flex-col items-center gap-3 py-4 text-center"
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reducedTransition(reduce, 0, 0.45)}
      >
        <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
          Te enviamos un nuevo enlace
        </h1>
        <p className="text-[var(--text-secondary)]">
          Revisa tu correo y sigue el enlace para continuar.
        </p>
      </motion.div>
    );
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
          Elige tu nueva contraseña
        </h1>
        <div className="mt-2 h-0.5 w-10 rounded-full bg-[var(--bronze)]" aria-hidden />
      </motion.div>
      <motion.div variants={fadeUp}>
        <Input
          type="password"
          required
          placeholder="Nueva contraseña"
          aria-label="Nueva contraseña"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`min-h-11 ${inputGlow}`}
        />
      </motion.div>
      <motion.div variants={fadeUp}>
        <Input
          type="password"
          required
          placeholder="Confirma la contraseña"
          aria-label="Confirma la contraseña"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={`min-h-11 ${inputGlow}`}
        />
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
            {state === "loading" ? "Cambiando…" : "Cambiar contraseña"}
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

Create `app/auth/reset/page.tsx`:

```tsx
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import { AuthCard } from "@/components/ui/AuthCard";
import { AuthAmbient } from "@/components/ui/AuthAmbient";

export const metadata = {
  title: "Restablecer contraseña · Aureo",
};

export default function ResetPasswordPage() {
  return (
    <AuthAmbient>
      <AuthCard>
        <Suspense fallback={null}>
          <ResetPasswordForm />
        </Suspense>
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
git add components/ResetPasswordForm.tsx app/auth/reset/page.tsx
git commit -m "feat: add /auth/reset page"
```

---

### Task 7: Link from `/login` to `/forgot-password`

**Files:**
- Modify: `components/LoginForm.tsx:1-6` (imports) and the password field block (currently lines 68-79)

**Interfaces:**
- Consumes: `Link` from `next/link` (already used elsewhere in this repo — `app/not-found.tsx`, `app/terminos/page.tsx`, `app/privacidad/page.tsx`).
- Produces: nothing consumed by other tasks — this is the last wiring step.

- [ ] **Step 1: Add the import**

Edit `components/LoginForm.tsx`. Add to the top imports (after the `"use client";` line's existing imports):

```tsx
import Link from "next/link";
```

- [ ] **Step 2: Add the link below the password field**

Find this block (currently lines 68-79):

```tsx
      <motion.div variants={fadeUp}>
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
      </motion.div>
```

Replace it with (adds a right-aligned link right after the password input):

```tsx
      <motion.div variants={fadeUp}>
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
        <div className="mt-1.5 text-right">
          <Link
            href="/forgot-password"
            className="text-sm text-[var(--bronze)] underline underline-offset-2"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </motion.div>
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual check**

Run: `npm run dev`, open `http://localhost:3000/login`, confirm the "¿Olvidaste tu contraseña?" link appears below the password field and navigates to `/forgot-password`.

- [ ] **Step 5: Commit**

```bash
git add components/LoginForm.tsx
git commit -m "feat: link /login to /forgot-password"
```

---

### Task 8: Supabase email template + full manual E2E pass

**Files:** none (Supabase dashboard configuration + verification only)

**Interfaces:** none — this task wires the last piece (the actual email Supabase sends) and proves the whole feature end-to-end.

- [ ] **Step 1: Update the "Reset password" email template in Supabase**

Go to `https://supabase.com/dashboard/project/ihqbjwnznuxdpihzajhp/auth/templates/recovery` (Authentication → Emails → Templates → "Reset password"). Replace the body (currently uses `{{ .ConfirmationURL }}`, the same auto-consuming link that caused the sign-up confirmation bug) with:

```html
<h2>Restablece tu contraseña</h2>

<p>Pediste restablecer tu contraseña en Aureo. Haz clic en el botón para elegir una nueva.</p>
<p><a href="{{ .SiteURL }}/auth/reset?token_hash={{ .TokenHash }}&type=recovery&email={{ .Email }}">Restablecer mi contraseña</a></p>
<p>Si no pediste esto, ignora este correo — tu contraseña actual sigue funcionando.</p>
```

Click **Save changes**.

- [ ] **Step 2: Deploy**

```bash
git push
```

Wait for the Vercel deployment to reach `READY` (same check used earlier in this project: `list_deployments`/`get_deployment` via the Vercel MCP tools, or just watch `https://vercel.com/juandiplib/aureo-landing`).

- [ ] **Step 3: Manual E2E — happy path**

Using your own real email (Resend's sandbox sender still only delivers to the account owner's address — same limitation as sign-up):
1. Go to `/login`, click "¿Olvidaste tu contraseña?".
2. Submit your email on `/forgot-password` — confirm the generic "Revisa tu correo" message appears.
3. Open the email, click "Restablecer mi contraseña".
4. On `/auth/reset`, set a new password meeting the new rule (e.g. `Newpass123`) and confirm it.
5. Confirm the "¡Contraseña actualizada!" screen appears and you land on `/login`.
6. Log in with the new password — confirm it works.
7. Check Supabase Auth Logs (`.../logs/auth-logs`) for the `/recover` and `/user` (password update) entries, and confirm `Updated at` moved on the Users page for that account.

- [ ] **Step 4: Manual E2E — no-enumeration check**

Submit a clearly nonexistent email (e.g. `no-existe-de-verdad@aureo-test.invalid`) on `/forgot-password`. Confirm the response message is identical to the happy-path one (open browser DevTools → Network tab and compare the raw JSON body of both requests).

- [ ] **Step 5: Manual E2E — expired/reused link**

Click the same reset link from Step 3 a second time (after already using it once). Confirm it shows "Enlace expirado" with a "Enviar enlace nuevo" button, and that clicking that button successfully requests a new email.

- [ ] **Step 6: Manual E2E — weak password rejected**

On a fresh reset link, try submitting `alllowercase1` (no uppercase) and `NoDigitsHere` (no digit). Confirm both are rejected with the password-requirement message, and that the link still works afterward (i.e. the token wasn't burned by the failed attempt) by then submitting a valid password successfully.

- [ ] **Step 7: Update the SDD context (if applicable)**

If this feature is tracked anywhere else in `.superpowers/sdd/` alongside the auth-multitenant-foundation work, add a short note there that password recovery shipped, with the commit range. (Skip if there's no active ledger for this — this feature has its own spec/plan, it isn't part of sub-project B.)
