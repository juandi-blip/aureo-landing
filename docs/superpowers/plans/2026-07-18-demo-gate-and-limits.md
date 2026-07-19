# Demo Gate and Limits Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gate the public `aureo-demo` behind an email capture on the landing, issue a 30-minute signed session, and enforce it inside the demo app itself (not just as a landing-side funnel), with a visible countdown and sensitive modules blocked.

**Architecture:** `aureo-landing` (Next.js, Vercel) captures the lead via the existing `/api/waitlist` endpoint, then mints an HMAC-signed, time-limited token via a new `/api/demo-token` endpoint. The browser is redirected to `aureo-demo` (a separate static Vercel project, no shared database) with that token in the URL. `aureo-demo` validates the token against its own new serverless function using the same shared secret (`DEMO_TOKEN_SECRET`, set identically in both Vercel projects), resets `localStorage` to a clean demo state, and enforces a 30-minute session client-side with a persistent countdown banner and expiry redirect.

**Tech Stack:** Next.js App Router (route handlers), Node `crypto` (HMAC-SHA256), Vercel serverless functions (`aureo-demo/api/*.js`, no build step), Vitest, Playwright.

## Global Constraints

- Design source: `docs/superpowers/specs/2026-07-18-demo-gate-and-limits-design.md`.
- Session length: exactly 30 minutes (`30 * 60 * 1000` ms) from token issuance.
- No shared database between `aureo-landing` and `aureo-demo` — the only shared state is the `DEMO_TOKEN_SECRET` env var, set to the **same value** in both Vercel projects.
- `aureo-demo` has no build system and no npm dependencies in its serverless functions (matches existing `api/melyor-chat.js`) — plain Node `crypto`, CommonJS `module.exports`.
- `aureo-demo` is **not** a git repository (no `.git` — verified). Tasks there are plain file edits with manual browser verification; no `git commit` steps for that side. `aureo-landing` **is** a git repo — commit after each task there as usual.
- Reuse existing guards (`origin` check, content-type, payload size, BotID, rate limit) for every new landing API route — never re-implement them ad hoc.
- Token format: `base64url(\`${email}.${exp}.${sig}\`)` where `sig = HMAC-SHA256(\`${email}.${exp}\`, DEMO_TOKEN_SECRET)` in hex. Identical algorithm on both sides — verified by cross-checking Tasks 2 and 7 produce/consume the same bytes.

---

### Task 1: Extract shared API guards into `lib/api-guards.ts`

**Files:**
- Create: `aureo-landing/lib/api-guards.ts`
- Modify: `aureo-landing/app/api/waitlist/route.ts`
- Test: `aureo-landing/test/waitlist-route.test.ts` (must still pass unchanged — no new test file for this task)

**Interfaces:**
- Produces: `runGuards(request: Request): Promise<Response | null>` — used by Task 3's new route.

- [ ] **Step 1: Create `lib/api-guards.ts` with the extracted guard logic**

```ts
import { NextResponse } from "next/server";
import { checkBotId } from "botid/server";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";

const MAX_BODY_BYTES = 10_000;

function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // Same-origin form posts may omit Origin on some browsers
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

// Guardas comunes a los endpoints públicos de la landing: origen,
// content-type, tamaño, bot y rate limit. Devuelve la respuesta a retornar
// si alguna guarda bloquea la solicitud, o null si puede continuar.
export async function runGuards(request: Request): Promise<Response | null> {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ ok: false, error: "Origen no permitido." }, { status: 403 });
  }

  const ct = request.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 415 });
  }

  const len = Number(request.headers.get("content-length") ?? "0");
  if (!Number.isFinite(len) || len > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 413 });
  }

  // BotID: active on Vercel. Locally throws (no OIDC token) — fail open so
  // a BotID outage never blocks real users; rate limiter still applies.
  try {
    const bot = await checkBotId();
    if (bot.isBot) {
      return NextResponse.json({ ok: false, error: "Acceso denegado." }, { status: 403 });
    }
  } catch {
    // intentional: botid unavailable locally or on cold start
  }

  const allowed = await checkRateLimit(getClientIp(request));
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: "Demasiados intentos. Espera un momento." },
      { status: 429 }
    );
  }

  return null;
}
```

- [ ] **Step 2: Update `app/api/waitlist/route.ts` to import the extracted guard**

Delete the local `isAllowedOrigin` function and the local `runGuards` function
(currently lines 9–59, per the file as read during design) and replace with:

```ts
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { parseWaitlistPayload } from "@/lib/validation";
import { getSupabaseAdmin } from "@/lib/supabase";
import { runGuards } from "@/lib/api-guards";
import { notifyNewSignup } from "@/lib/email";
```

Remove the now-unused imports (`checkBotId`, `checkRateLimit`, `getClientIp`)
from this file — they live in `lib/api-guards.ts` now. Everything below the
import block (the `POST` and `PATCH` handlers) stays exactly as-is; they
already call `await runGuards(request)` at the top, which now resolves to
the imported function instead of the local one.

- [ ] **Step 3: Run the existing waitlist tests to confirm the refactor is behavior-preserving**

Run: `pnpm vitest run test/waitlist-route.test.ts`
Expected: PASS (all 11 existing test cases, unchanged)

- [ ] **Step 4: Commit**

```bash
git add aureo-landing/lib/api-guards.ts aureo-landing/app/api/waitlist/route.ts
git commit -m "refactor: extract shared API request guards into lib/api-guards.ts"
```

(Run from the `aureo-landing` directory if `git` isn't resolving paths — it's its own repo.)

---

### Task 2: `lib/demo-token.ts` — sign and verify demo session tokens

**Files:**
- Create: `aureo-landing/lib/demo-token.ts`
- Test: `aureo-landing/test/demo-token.test.ts`

**Interfaces:**
- Produces: `signDemoToken(email: string): { token: string; exp: number }` and
  `verifyDemoToken(token: string): { ok: true; email: string; exp: number } | { ok: false }`
  — used by Task 3's route.

- [ ] **Step 1: Write the failing tests**

Create `aureo-landing/test/demo-token.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

beforeEach(() => {
  process.env.DEMO_TOKEN_SECRET = "test-secret";
});

afterEach(() => {
  vi.useRealTimers();
});

import { signDemoToken, verifyDemoToken } from "@/lib/demo-token";

describe("signDemoToken / verifyDemoToken", () => {
  it("firma un token que verifica válido con el mismo secreto", () => {
    const { token, exp } = signDemoToken("a@b.com");
    const result = verifyDemoToken(token);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.email).toBe("a@b.com");
      expect(result.exp).toBe(exp);
    }
  });

  it("exp queda 30 minutos en el futuro", () => {
    const before = Date.now();
    const { exp } = signDemoToken("a@b.com");
    expect(exp).toBeGreaterThanOrEqual(before + 29 * 60 * 1000);
    expect(exp).toBeLessThanOrEqual(before + 31 * 60 * 1000);
  });

  it("rechaza un token con el email cambiado (firma ya no coincide)", () => {
    const { token } = signDemoToken("a@b.com");
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [, expStr, sig] = decoded.split(".");
    const tampered = Buffer.from(`c@d.com.${expStr}.${sig}`, "utf8").toString("base64url");
    expect(verifyDemoToken(tampered).ok).toBe(false);
  });

  it("rechaza un token expirado", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const { token } = signDemoToken("a@b.com");
    vi.setSystemTime(new Date("2026-01-01T00:31:00Z"));
    expect(verifyDemoToken(token).ok).toBe(false);
  });

  it("rechaza basura que no decodifica como token válido", () => {
    expect(verifyDemoToken("no-es-un-token").ok).toBe(false);
  });

  it("lanza si DEMO_TOKEN_SECRET no está configurado", () => {
    delete process.env.DEMO_TOKEN_SECRET;
    expect(() => signDemoToken("a@b.com")).toThrow();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run test/demo-token.test.ts`
Expected: FAIL with "Cannot find module '@/lib/demo-token'" (or similar)

- [ ] **Step 3: Write `lib/demo-token.ts`**

```ts
import { createHmac, timingSafeEqual } from "node:crypto";

const SESSION_MS = 30 * 60 * 1000;

function getSecret(): string {
  const secret = process.env.DEMO_TOKEN_SECRET;
  if (!secret) throw new Error("DEMO_TOKEN_SECRET no configurado.");
  return secret;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function signDemoToken(email: string): { token: string; exp: number } {
  const exp = Date.now() + SESSION_MS;
  const payload = `${email}.${exp}`;
  const sig = sign(payload, getSecret());
  const token = Buffer.from(`${payload}.${sig}`, "utf8").toString("base64url");
  return { token, exp };
}

export function verifyDemoToken(
  token: string
): { ok: true; email: string; exp: number } | { ok: false } {
  let decoded: string;
  try {
    decoded = Buffer.from(token, "base64url").toString("utf8");
  } catch {
    return { ok: false };
  }

  const parts = decoded.split(".");
  if (parts.length !== 3) return { ok: false };
  const [email, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!email || !Number.isFinite(exp)) return { ok: false };

  let expected: string;
  try {
    expected = sign(`${email}.${exp}`, getSecret());
  } catch {
    return { ok: false };
  }

  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false };
  if (Date.now() > exp) return { ok: false };

  return { ok: true, email, exp };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm vitest run test/demo-token.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add aureo-landing/lib/demo-token.ts aureo-landing/test/demo-token.test.ts
git commit -m "feat: add HMAC sign/verify helpers for demo session tokens"
```

---

### Task 3: `POST /api/demo-token` route

**Files:**
- Create: `aureo-landing/app/api/demo-token/route.ts`
- Test: `aureo-landing/test/demo-token-route.test.ts`

**Interfaces:**
- Consumes: `runGuards` from Task 1 (`@/lib/api-guards`), `isValidEmail` from
  `@/lib/validation` (already exists), `signDemoToken` from Task 2
  (`@/lib/demo-token`).
- Produces: `POST` handler returning `{ ok: true, token: string }` (200) or
  `{ ok: false, error: string }` (400/403/413/415/429/500) — consumed by
  Task 5's `DemoGateModal`.

- [ ] **Step 1: Write the failing tests**

Create `aureo-landing/test/demo-token-route.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";

beforeEach(() => {
  process.env.DEMO_TOKEN_SECRET = "test-secret";
});

import { POST } from "@/app/api/demo-token/route";

function req(body: unknown) {
  return new Request("http://localhost/api/demo-token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/demo-token", () => {
  it("responde 200 con un token para un email válido", async () => {
    const res = await POST(req({ email: "a@b.com" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(typeof json.token).toBe("string");
  });

  it("normaliza el email (trim, minúsculas) antes de firmar", async () => {
    const res = await POST(req({ email: "  A@B.com  " }));
    expect(res.status).toBe(200);
  });

  it("responde 400 con email inválido", async () => {
    const res = await POST(req({ email: "malo" }));
    expect(res.status).toBe(400);
  });

  it("responde 400 si falta el email", async () => {
    const res = await POST(req({}));
    expect(res.status).toBe(400);
  });

  it("responde 500 si falta DEMO_TOKEN_SECRET en el entorno", async () => {
    delete process.env.DEMO_TOKEN_SECRET;
    const res = await POST(req({ email: "a@b.com" }));
    expect(res.status).toBe(500);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run test/demo-token-route.test.ts`
Expected: FAIL with "Cannot find module '@/app/api/demo-token/route'"

- [ ] **Step 3: Write `app/api/demo-token/route.ts`**

```ts
import { NextResponse } from "next/server";
import { runGuards } from "@/lib/api-guards";
import { isValidEmail } from "@/lib/validation";
import { signDemoToken } from "@/lib/demo-token";

export async function POST(request: Request) {
  const guardResponse = await runGuards(request);
  if (guardResponse) return guardResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
  }

  const b = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const email =
    typeof b.email === "string" ? b.email.normalize("NFC").trim().toLowerCase() : "";
  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "Correo inválido." }, { status: 400 });
  }

  try {
    const { token } = signDemoToken(email);
    return NextResponse.json({ ok: true, token }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "Error del servidor." }, { status: 500 });
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm vitest run test/demo-token-route.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add aureo-landing/app/api/demo-token/route.ts aureo-landing/test/demo-token-route.test.ts
git commit -m "feat: add POST /api/demo-token to mint signed demo session tokens"
```

---

### Task 4: Gate copy in `content/site.ts` + env var documentation

**Files:**
- Modify: `aureo-landing/content/site.ts:106-114` (the `demo` object)
- Modify: `aureo-landing/.env.local.example`
- Modify: `aureo-landing/.env.local` (local secret, not committed — see Step 3)

**Interfaces:**
- Produces: `site.demo.gateTitulo`, `site.demo.gateTexto`, `site.demo.gateBoton`,
  `site.demo.gateExpiradoTitulo`, `site.demo.gateExpiradoTexto` — consumed by
  Task 5's `DemoGateModal`.

- [ ] **Step 1: Update the `demo` object in `content/site.ts`**

Replace the existing `demo: { ... }` block (lines 106–114) with:

```ts
  demo: {
    eyebrow: "Producto real, no un mockup.",
    titulo: "Mira la inteligencia logística en acción.",
    texto: "El mapa de calor y el análisis ABC son lo que separa a Aureo de un POS común.",
    badges: ["Mapa de calor en vivo", "Picking guiado", "Análisis ABC / Pareto"],
    placeholder: "Demo en video — próximamente.",
    ctaExplorar: "Explora la demo tú mismo",
    ctaExplorarNota: "No es un video — es Aureo funcionando. Dejanos tu correo y recorré el inventario, el mapa de calor y el picking con datos reales durante 30 minutos.",
    gateTitulo: "Antes de entrar, dejanos tu correo",
    gateTexto: "Te damos acceso a una sesión de demo de 30 minutos con datos de ejemplo — sin compromiso.",
    gateBoton: "Entrar a la demo",
    gateExpiradoTitulo: "Tu sesión de demo expiró",
    gateExpiradoTexto: "Dejanos tu correo de nuevo para volver a entrar por 30 minutos más.",
  },
```

(Only `ctaExplorarNota` changes text — it previously said "sin registrarte",
which is no longer true. Everything else in this block is additive.)

- [ ] **Step 2: Add `DEMO_TOKEN_SECRET` to `.env.local.example`**

Append to the end of `aureo-landing/.env.local.example`:

```
# Secreto compartido con el proyecto aureo-demo (misma env var, mismo valor,
# configurada en ambos proyectos Vercel) para firmar/verificar el token de
# acceso a la demo pública. Generar con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
DEMO_TOKEN_SECRET=un-secreto-largo-y-aleatorio-compartido-con-aureo-demo
```

- [ ] **Step 3: Add a real secret to local `.env.local` for dev/e2e**

Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

Append the output to `aureo-landing/.env.local` as `DEMO_TOKEN_SECRET=<generated value>`.
This file is gitignored — do not commit it. (This same value will later need
to be set in both Vercel projects' environment variables before the gate
works in production — that's a deploy-time action for the user, not part of
this plan's automated steps.)

- [ ] **Step 4: Run the existing content test suite to confirm nothing broke**

Run: `pnpm vitest run test/site-content.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add aureo-landing/content/site.ts aureo-landing/.env.local.example
git commit -m "content: add demo gate copy and document DEMO_TOKEN_SECRET"
```

(`.env.local` is gitignored and won't show up in `git status` — nothing to add there.)

---

### Task 5: `DemoGateModal` component

**Files:**
- Create: `aureo-landing/components/DemoGateModal.tsx`

**Interfaces:**
- Consumes: `site.demo.*` from Task 4, `HONEYPOT_FIELD` from
  `@/lib/validation` (existing), `Button`/`Input` from `@/components/ui/*`
  (existing), `Dialog` from `@base-ui/react/dialog` (already an installed
  dependency — used by no other component yet, but the package is present).
- Produces: `DemoGateModal({ open, onOpenChange, demoUrl, reason })` —
  consumed by Task 6's `DemoSection.tsx`. `reason` is
  `"required" | "expired" | null`.

- [ ] **Step 1: Create the component**

```tsx
"use client";
import { useId, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { track } from "@vercel/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HONEYPOT_FIELD } from "@/lib/validation";
import { site } from "@/content/site";

type GateState = "idle" | "loading" | "error";
export type GateReason = "required" | "expired" | null;

export function DemoGateModal({
  open,
  onOpenChange,
  demoUrl,
  reason,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  demoUrl: string;
  reason: GateReason;
}) {
  const honeypotId = useId();
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [hp, setHp] = useState("");
  const [state, setState] = useState<GateState>("idle");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setMsg("");
    try {
      const waitlistRes = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, nombre, origen: "demo", [HONEYPOT_FIELD]: hp }),
      });
      const waitlistJson = await waitlistRes.json();
      if (!waitlistRes.ok || !waitlistJson.ok) {
        setState("error");
        setMsg(waitlistJson.error ?? "No pudimos registrarte. Intenta de nuevo.");
        return;
      }

      const tokenRes = await fetch("/api/demo-token", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const tokenJson = await tokenRes.json();
      if (!tokenRes.ok || !tokenJson.ok || typeof tokenJson.token !== "string") {
        setState("error");
        setMsg("No pudimos generar tu acceso a la demo. Intenta de nuevo.");
        return;
      }

      track("demo_gate_unlocked");
      window.location.href = `${demoUrl}/login.html?token=${encodeURIComponent(tokenJson.token)}`;
    } catch {
      setState("error");
      setMsg("Revisa tu conexión e intenta de nuevo.");
    }
  }

  const heading = reason === "expired" ? site.demo.gateExpiradoTitulo : site.demo.gateTitulo;
  const texto = reason === "expired" ? site.demo.gateExpiradoTexto : site.demo.gateTexto;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-navy)] p-6 text-[var(--text-cream)] shadow-2xl">
          <Dialog.Title className="text-lg font-semibold">{heading}</Dialog.Title>
          <p className="mt-1.5 text-sm text-[var(--text-cream)]/70">{texto}</p>
          <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3" noValidate>
            <label htmlFor={honeypotId} className="sr-only">
              Deja este campo vacío
            </label>
            <input
              id={honeypotId}
              type="text"
              name={HONEYPOT_FIELD}
              value={hp}
              onChange={(e) => setHp(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              className="absolute left-[-9999px] h-0 w-0 opacity-0"
            />
            <Input
              type="email"
              required
              placeholder="Tu correo"
              aria-label="Correo electrónico"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-h-11 bg-[var(--bg-base)] text-[var(--text-primary)] border-[var(--border-subtle)]"
            />
            <Input
              type="text"
              placeholder="Tu nombre (opcional)"
              aria-label="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="min-h-11 bg-[var(--bg-base)] text-[var(--text-primary)] border-[var(--border-subtle)]"
            />
            <Button
              type="submit"
              disabled={state === "loading"}
              aria-busy={state === "loading"}
              className="min-h-11"
            >
              {state === "loading" ? "Entrando…" : site.demo.gateBoton}
            </Button>
            <p role="alert" aria-live="polite" className="min-h-5 text-sm text-[var(--terracotta)]">
              {state === "error" ? msg : ""}
            </p>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm tsc --noEmit`
Expected: no new errors introduced by this file (pre-existing errors, if
any, are unrelated — check the file list in the output only mentions files
you didn't touch).

- [ ] **Step 3: Commit**

```bash
git add aureo-landing/components/DemoGateModal.tsx
git commit -m "feat: add DemoGateModal — email gate before entering the public demo"
```

---

### Task 6: Wire `DemoGateModal` into `DemoSection`

**Files:**
- Modify: `aureo-landing/components/DemoSection.tsx`
- Test: `aureo-landing/e2e/demo-gate.spec.ts` (new)

**Interfaces:**
- Consumes: `DemoGateModal`, `GateReason` from Task 5.

- [ ] **Step 1: Modify `DemoSection.tsx`**

In `components/DemoSection.tsx`, add the import and two pieces of state near
the top of the component (after the existing `spotlight` hook, around line
18):

```tsx
import { DemoGateModal, type GateReason } from "@/components/DemoGateModal";
```

```tsx
  const [gateOpen, setGateOpen] = useState(false);
  const [gateReason, setGateReason] = useState<GateReason>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const demoParam = new URLSearchParams(window.location.search).get("demo");
    if (demoParam === "required" || demoParam === "expired") {
      setGateReason(demoParam);
      setGateOpen(true);
    }
  }, []);
```

Replace the entire `{DEMO_URL && ( ... )}` block (lines 167–200, the `<a
href={DEMO_URL}>` CTA and its note) with:

```tsx
        {DEMO_URL && (
          <motion.div
            className="mt-9 flex flex-col items-center gap-3.5"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
          >
            <button
              type="button"
              onClick={() => {
                setGateReason(null);
                setGateOpen(true);
              }}
              className="group inline-flex items-center gap-2.5 rounded-full border border-[var(--bronze)]/50 bg-gradient-to-r from-[var(--bronze)]/15 via-[var(--bronze)]/10 to-[var(--bronze)]/15 px-7 py-3 text-sm font-semibold text-[var(--text-cream)] shadow-[0_0_26px_-10px_var(--bronze-glow)] transition-all hover:border-[var(--bronze)]/80 hover:shadow-[0_0_34px_-8px_var(--bronze-glow)]"
            >
              {site.demo.ctaExplorar}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-[var(--bronze)] transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
            <p className="max-w-sm text-sm leading-relaxed text-[var(--text-cream)]/60">
              {site.demo.ctaExplorarNota}
            </p>
          </motion.div>
        )}
        <DemoGateModal
          open={gateOpen}
          onOpenChange={setGateOpen}
          demoUrl={DEMO_URL}
          reason={gateReason}
        />
```

(The `<a>` becomes a `<button>` — same classes, same visible label and icon,
different element and `onClick` instead of `href`/`target`.)

- [ ] **Step 2: Write the e2e test**

Create `aureo-landing/e2e/demo-gate.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("el CTA de la demo pide email y redirige con token a aureo-demo", async ({ page }) => {
  await page.route("**/api/waitlist", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) })
  );
  await page.route("**/api/demo-token", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, token: "fake-token-123" }),
    })
  );
  // Evita una navegación real fuera del entorno de test: intercepta la URL
  // de aureo-demo y la sirve localmente en vez de golpear la red real.
  await page.route("**/aureo-demo-six.vercel.app/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<html><body>demo</body></html>" })
  );

  await page.goto("/");
  await page.getByRole("button", { name: /explora la demo tú mismo/i }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Correo electrónico").fill("prueba@aureo.app");
  await dialog.getByRole("button", { name: /entrar a la demo/i }).click();

  await page.waitForURL(/aureo-demo-six\.vercel\.app\/login\.html\?token=fake-token-123/);
});

test("?demo=expired abre el gate automáticamente con el mensaje de expiración", async ({ page }) => {
  await page.goto("/?demo=expired");
  await expect(page.getByRole("dialog")).toContainText(/tu sesión de demo expiró/i);
});
```

- [ ] **Step 3: Run the e2e tests**

Run: `pnpm playwright test e2e/demo-gate.spec.ts`
Expected: PASS (2 tests). If `NEXT_PUBLIC_DEMO_URL` isn't set in
`.env.local`, the CTA button won't render and the first test will fail to
find it — confirm the var is set (Task 4 assumed it already is, per the
existing `.env.local`).

- [ ] **Step 4: Run the full test suite once to catch regressions**

Run: `pnpm vitest run && pnpm playwright test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add aureo-landing/components/DemoSection.tsx aureo-landing/e2e/demo-gate.spec.ts
git commit -m "feat: gate the demo CTA behind DemoGateModal and handle ?demo= redirects"
```

---

### Task 7: `aureo-demo/api/verify-demo-token.js`

**Files:**
- Create: `aureo-demo/api/verify-demo-token.js`

**Interfaces:**
- Produces: `GET /api/verify-demo-token?token=...` → `{ ok: true, exp: number }`
  (200) or `{ ok: false }` (400/401/405/500) — consumed by Task 8's
  `demo-gate.js`. Must decode/verify tokens byte-identically to Task 2's
  `signDemoToken`/`verifyDemoToken`.

- [ ] **Step 1: Create the serverless function**

```js
// AUREO — Vercel serverless function: valida el token firmado que la landing
// emite tras capturar el email del visitante (gate de la demo pública).
//
// Mismo algoritmo que aureo-landing/lib/demo-token.ts: HMAC-SHA256 sobre
// `${email}.${exp}` con el secreto compartido DEMO_TOKEN_SECRET (env var
// idéntica en ambos proyectos Vercel). Sin dependencias npm — mismo criterio
// que api/melyor-chat.js: ninguno de los dos proyectos tiene hoy un flujo de
// build.

const crypto = require("crypto");

module.exports = async (req, res) => {
    if (req.method !== "GET") {
        res.status(405).json({ ok: false });
        return;
    }

    const secret = process.env.DEMO_TOKEN_SECRET;
    if (!secret) {
        res.status(500).json({ ok: false });
        return;
    }

    const token = typeof req.query.token === "string" ? req.query.token : "";
    if (!token) {
        res.status(400).json({ ok: false });
        return;
    }

    let decoded;
    try {
        decoded = Buffer.from(token, "base64url").toString("utf8");
    } catch (e) {
        res.status(401).json({ ok: false });
        return;
    }

    const parts = decoded.split(".");
    if (parts.length !== 3) {
        res.status(401).json({ ok: false });
        return;
    }
    const [email, expStr, sig] = parts;
    const exp = Number(expStr);
    if (!email || !Number.isFinite(exp)) {
        res.status(401).json({ ok: false });
        return;
    }

    const expected = crypto
        .createHmac("sha256", secret)
        .update(`${email}.${exp}`)
        .digest("hex");
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    const validSig = a.length === b.length && crypto.timingSafeEqual(a, b);

    if (!validSig || Date.now() > exp) {
        res.status(401).json({ ok: false });
        return;
    }

    res.status(200).json({ ok: true, exp });
};
```

- [ ] **Step 2: Manual verification with `vercel dev`**

Run: `cd aureo-demo && vercel dev` (from the `aureo-demo` directory; requires
the project's `.vercel` link, already present)

In another terminal, with `DEMO_TOKEN_SECRET` set to the same value in
`aureo-demo`'s local env (add it via `vercel env pull .env.local` if it's
already set on the linked Vercel project, or add it directly with `vercel
env add DEMO_TOKEN_SECRET development` and paste the same value generated in
Task 4 Step 3):

```bash
node -e "
const crypto = require('crypto');
const secret = process.env.DEMO_TOKEN_SECRET;
const exp = Date.now() + 30*60*1000;
const payload = 'test@example.com.' + exp;
const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
console.log(Buffer.from(payload + '.' + sig).toString('base64url'));
"
```

Copy the printed token, then:

Run: `curl "http://localhost:3000/api/verify-demo-token?token=<token>"`
Expected: `{"ok":true,"exp":<number>}`

Run: `curl "http://localhost:3000/api/verify-demo-token?token=garbage"`
Expected: `{"ok":false}` with HTTP 401

- [ ] **Step 3: No commit** (`aureo-demo` has no git repository — see Global Constraints)

---

### Task 8: `aureo-demo/demo-gate.js` — the gate itself

**Files:**
- Create: `aureo-demo/demo-gate.js`
- Modify: `aureo-demo/index.html` (head)
- Modify: `aureo-demo/login.html` (head)

**Interfaces:**
- Consumes: `GET /api/verify-demo-token` from Task 7.
- Produces: `window.AURA_DEMO_MODE` (boolean), `window.AURA_DEMO_EXP`
  (number, ms epoch), `window.__auraDemoRedirect(reason: string): void` —
  consumed by Task 9's `demo-banner.js` and `auth.js` change.

- [ ] **Step 1: Create `demo-gate.js`**

```js
// AUREO — GATE de la demo pública: exige un token válido (emitido por la
// landing tras capturar el email del visitante) antes de dejar cargar la
// app, y limita cada sesión a 30 minutos.
//
// Se carga como el PRIMER <script> del <head>, antes que cualquier otro
// (incluido auth.js, que hoy auto-loguea como admin sin pedir nada). Usa
// XHR síncrona para la verificación porque este script debe decidir "dejar
// pasar o redirigir" antes de que el resto del documento se parsee —
// ninguno de los dos proyectos tiene un flujo de build (ver comentario en
// api/melyor-chat.js), así que no hay forma de reestructurar la carga de
// scripts sin introducir uno solo para esto. La llamada solo ocurre una vez
// por sesión de 30 min: los reloads dentro de la ventana usan el fast-path
// de sessionStorage de abajo, sin red.

(function () {
    "use strict";

    var SESSION_KEY = "aura_demo_session";
    var LANDING_URL = "https://aureo-landing.vercel.app"; // actualizar si se activa un dominio propio

    function clearDemoStorage() {
        try { localStorage.clear(); } catch (e) {}
        try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
    }

    function redirectToLanding(reason) {
        clearDemoStorage();
        window.location.replace(LANDING_URL + "/?demo=" + reason);
    }
    // Expuesto para que demo-banner.js redirija con la misma lógica al expirar.
    window.__auraDemoRedirect = redirectToLanding;

    function readSession() {
        try {
            var raw = sessionStorage.getItem(SESSION_KEY);
            if (!raw) return null;
            var s = JSON.parse(raw);
            if (!s || typeof s.exp !== "number") return null;
            return s;
        } catch (e) {
            return null;
        }
    }

    var session = readSession();
    if (session && session.exp > Date.now()) {
        window.AURA_DEMO_MODE = true;
        window.AURA_DEMO_EXP = session.exp;
        return;
    }

    var params = new URLSearchParams(window.location.search);
    var token = params.get("token");
    if (!token) {
        redirectToLanding("required");
        return;
    }

    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/api/verify-demo-token?token=" + encodeURIComponent(token), false);
    try {
        xhr.send(null);
    } catch (e) {
        redirectToLanding("required");
        return;
    }

    if (xhr.status !== 200) {
        redirectToLanding("expired");
        return;
    }

    var result = null;
    try {
        result = JSON.parse(xhr.responseText);
    } catch (e) {
        // result queda null, se maneja abajo
    }
    if (!result || result.ok !== true || typeof result.exp !== "number") {
        redirectToLanding("expired");
        return;
    }

    // Token válido: reset completo antes de que auth.js/core.js lean nada de
    // localStorage, para que cada visitante gateado arranque con datos limpios.
    clearDemoStorage();
    try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({ exp: result.exp }));
    } catch (e) {}

    window.AURA_DEMO_MODE = true;
    window.AURA_DEMO_EXP = result.exp;

    params.delete("token");
    var clean = window.location.pathname +
        (params.toString() ? "?" + params.toString() : "") +
        window.location.hash;
    window.history.replaceState({}, "", clean);
})();
```

- [ ] **Step 2: Wire it into `index.html`**

In `aureo-demo/index.html`, insert as the very first line inside `<head>`
(before `<meta charset="UTF-8">`, line 5):

```html
<head>
    <script src="demo-gate.js"></script>
    <meta charset="UTF-8">
```

- [ ] **Step 3: Wire it into `login.html`**

In `aureo-demo/login.html`, same insertion, before `<meta charset="UTF-8">`
(line 5):

```html
<head>
    <script src="demo-gate.js"></script>
    <meta charset="UTF-8">
```

- [ ] **Step 4: Manual verification with `vercel dev`**

With `aureo-demo`'s `vercel dev` running (from Task 7) and the same
`DEMO_TOKEN_SECRET`:

1. Open `http://localhost:3000/index.html` directly (no token, no session)
   in a browser. Expected: immediate redirect to
   `https://aureo-landing.vercel.app/?demo=required` (this will actually
   navigate to production landing since it's a hardcoded absolute URL — that
   is the intended behavior; confirm the redirect happens, then navigate
   back).
2. Using the token-generation snippet from Task 7 Step 2, open
   `http://localhost:3000/login.html?token=<valid token>`. Expected: no
   redirect; page loads normally; open DevTools → Application →
   Session Storage → confirm `aura_demo_session` holds `{"exp": ...}`; check
   Local Storage is empty (freshly cleared).
3. Reload the same page without the `?token=` param. Expected: still no
   redirect (fast path via `sessionStorage`), no new network call to
   `/api/verify-demo-token` (check DevTools Network tab).
4. Manually edit `sessionStorage.aura_demo_session` in DevTools to set
   `exp` to a past timestamp, then reload. Expected: redirect to
   `?demo=expired` (since there's no token in the URL) — this confirms the
   fallback works even without the banner from Task 9 in place yet.

- [ ] **Step 5: No commit** (`aureo-demo` has no git repository)

---

### Task 9: `aureo-demo/demo-banner.js` + demo-mode tab filtering + wire-up

**Files:**
- Create: `aureo-demo/demo-banner.js`
- Modify: `aureo-demo/auth.js:137-144` (`getAllowedTabs`)
- Modify: `aureo-demo/index.html` (body script list)

**Interfaces:**
- Consumes: `window.AURA_DEMO_MODE`, `window.AURA_DEMO_EXP`,
  `window.__auraDemoRedirect` from Task 8.

- [ ] **Step 1: Create `demo-banner.js`**

```js
// AUREO — banner persistente de "modo demo" con cuenta regresiva. Solo se
// activa si demo-gate.js (que corre antes, en <head>) autorizó la sesión.
// Al llegar a 0, limpia el estado y redirige de vuelta a la landing —
// reusa window.__auraDemoRedirect expuesto por demo-gate.js para no
// duplicar esa lógica.

(function () {
    "use strict";

    function start() {
        if (!window.AURA_DEMO_MODE || typeof window.AURA_DEMO_EXP !== "number") return;

        var bar = document.createElement("div");
        bar.id = "aura-demo-banner";
        bar.setAttribute("role", "status");
        bar.style.cssText =
            "position:fixed;top:0;left:0;right:0;z-index:9999;" +
            "background:#1B2230;color:#F4EFE6;font:600 13px/1.4 system-ui,sans-serif;" +
            "text-align:center;padding:6px 12px;letter-spacing:.02em;";
        document.body.prepend(bar);
        document.body.style.paddingTop = (bar.offsetHeight || 30) + "px";

        function render() {
            var remaining = window.AURA_DEMO_EXP - Date.now();
            if (remaining <= 0) {
                if (window.__auraDemoRedirect) window.__auraDemoRedirect("expired");
                return;
            }
            var totalSec = Math.floor(remaining / 1000);
            var mm = Math.floor(totalSec / 60);
            var ss = totalSec % 60;
            bar.textContent =
                "MODO DEMO · datos de ejemplo, se reinician al expirar · " +
                mm + ":" + (ss < 10 ? "0" : "") + ss;
        }

        render();
        setInterval(render, 1000);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
    } else {
        start();
    }
})();
```

- [ ] **Step 2: Wire it into `index.html`**

In `aureo-demo/index.html`, insert right before the existing
`<script src="auth.js"></script>` (line 1464):

```html
    <script src="demo-banner.js"></script>
    <script src="auth.js"></script>
```

- [ ] **Step 3: Filter the `settings` tab in demo mode**

In `aureo-demo/auth.js`, replace the `getAllowedTabs` function (lines
137–144):

```js
function getAllowedTabs(role) {
    const roles = getStoredRoles();
    const def = roles.find(r => r.id === role);
    // Fallback de seguridad si el rol no existe en el storage configurable
    // (p.ej. storage manipulado a mano): usar el mapa fijo original o Dashboard.
    let tabs = (def && Array.isArray(def.tabs)) ? def.tabs : (ROLE_TABS[role] || ["dashboard"]);
    // Modo demo: "settings" incluye el editor de roles/permisos (ver
    // permisos-card dentro de settings-view en index.html) — se oculta para
    // que un visitante gateado no pueda reconfigurar roles y romper la demo
    // dentro de su propia sesión de 30 min.
    if (window.AURA_DEMO_MODE) {
        tabs = tabs.filter(t => t !== "settings");
    }
    return tabs;
}
```

- [ ] **Step 4: Manual verification with `vercel dev`**

With the same setup as Task 8 Step 4:

1. Enter the demo via a valid `?token=` on `login.html`, pick the admin
   profile, land on `index.html`. Expected: a dark banner bar fixed at the
   top reading `MODO DEMO · datos de ejemplo, se reinician al expirar ·
   29:59` (or close to it), counting down every second; page content is not
   covered by the bar (check `padding-top` was applied to `<body>`).
2. Confirm the "Configuración" nav item is not visible in the sidebar for
   any of the 3 role profiles (log out via the sidebar button, sign back in
   as `warehouse` and `cashier` too — `settings` wasn't in their allowed
   tabs anyway, so this mainly confirms `admin` no longer sees it).
3. In DevTools console, run `window.AURA_DEMO_EXP = Date.now() + 2000;` to
   force near-expiry, wait ~2 seconds. Expected: automatic redirect to
   `https://aureo-landing.vercel.app/?demo=expired`, and `localStorage`/
   `sessionStorage` are empty afterward (check in DevTools before the
   landing page fully takes over, or check that a fresh `index.html?token=`
   load afterward starts from clean seeded data).

- [ ] **Step 5: No commit** (`aureo-demo` has no git repository — remind the
  user these file changes need to be deployed manually, e.g. via `vercel
  --prod` from the `aureo-demo` directory, once they've reviewed them and
  set `DEMO_TOKEN_SECRET` on both Vercel projects' production environments)

---

## Post-plan reminders (not automated tasks — flag to the user before deploying)

- Set `DEMO_TOKEN_SECRET` to the **same value** on both Vercel projects
  (`aureo-landing` and `aureo-demo`), for every environment that needs the
  gate to work (at minimum Production; Preview too if preview deploys are
  used for review).
- Deploying `aureo-demo` is a manual step (`vercel --prod` from that
  directory, or however the user currently ships it) — this plan never runs
  that command automatically, consistent with not taking irreversible/
  visible actions without confirmation.
