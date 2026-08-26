# Auth & Multi-Tenant Foundation (Sub-project B) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `aureo`'s fake access control (3 hardcoded demo users + auto-login-as-admin) with real Supabase Auth accounts. A visitor signs up on `aureo-landing` with email + password, picks a plan, and lands in `aureo` as the admin of their own business on a 14-day trial. No payment collected.

**Architecture:** `aureo-landing` (Next.js) owns signup/login via `@supabase/supabase-js`, using guarded API routes matching the existing `/api/waitlist` pattern. On success it redirects the browser to `aureo` with the Supabase session tokens in the URL fragment (never touches server logs). `aureo` (build-less SPA) loads `supabase-js` from a CDN `<script>` tag — the same pattern it already uses for SheetJS — calls `setSession()` with the fragment tokens, then lets `supabase-js` own session persistence/refresh. Role/tenant data comes from two new Postgres tables (`businesses`, `profiles`) protected by Row Level Security, populated by a trigger on `auth.users` insert.

**Tech Stack:** Next.js 16 / TypeScript / `@supabase/supabase-js` (already an `aureo-landing` dependency) for the landing side; `@supabase/supabase-js` via CDN + vanilla JS for `aureo`; Postgres (Supabase) for data + RLS.

**Spec:** `docs/superpowers/specs/2026-08-26-auth-multitenant-foundation-design.md`

**Supabase project:** `ihqbjwnznuxdpihzajhp` (confirmed live in production; `waitlist` table has real rows). Dashboard: Table Editor / SQL Editor at `https://supabase.com/dashboard/project/ihqbjwnznuxdpihzajhp`.

## Global Constraints

- Auth method is email + password only (Supabase Auth), with email verification — no magic link, no OAuth.
- One business = one admin user at signup. No multi-user-per-business invites in this plan.
- No shared cookies, no custom signed token scheme — session handoff is Supabase's own `access_token`/`refresh_token` in the URL fragment (`#access_token=...&refresh_token=...`), stripped immediately via `history.replaceState`.
- No per-plan feature gating — full product unlocked during trial regardless of chosen plan.
- No new fields on `businesses` beyond `name`, `plan_id`, `trial_started_at`, `trial_ends_at` — no NIT/phone/city yet.
- `aureo` has no build step: any new dependency there loads from a CDN `<script>` tag, and any config value (Supabase URL, anon key) is a hardcoded JS constant — there is no env-injection mechanism in that repo.
- The Supabase anon key is safe to hardcode client-side by design (public key, RLS is the real trust boundary) — do not treat it as a secret to hide.
- `plan_id` values are exactly `'starter'`, `'pro'`, `'logistica'` (matching `content/site.ts`'s `planes` array order).

---

### Task 1: Supabase schema — `businesses`, `profiles`, trigger, RLS

**Files:**
- Modify: `supabase/schema.sql` (append)

**Interfaces:**
- Produces: tables `public.businesses(id, name, plan_id, trial_started_at, trial_ends_at, created_at)` and `public.profiles(user_id, business_id, role, created_at)`, both RLS-enabled with a `select`-only-own-row policy; trigger `on_auth_user_created` that populates both from `auth.users` signup metadata (`raw_user_meta_data->>'business_name'`, `raw_user_meta_data->>'plan_id'`).

This project's `schema.sql` has always been applied manually via the Supabase SQL Editor (see the file's own header comment) — there is no migration CLI or DB connection string available in this environment. This task's SQL must be run there by a human before Task 3 onward can be tested end-to-end.

- [ ] **Step 1: Append the migration SQL**

Append this to the end of `supabase/schema.sql` (after the existing `waitlist` table block):

```sql

-- ============================================================
-- Sub-project B: auth & multi-tenant foundation
-- Ejecutar en el SQL Editor de Supabase (mismo procedimiento que
-- la tabla waitlist de arriba).
-- ============================================================

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan_id text not null check (plan_id in ('starter', 'pro', 'logistica')),
  trial_started_at timestamptz not null default now(),
  trial_ends_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

alter table public.businesses enable row level security;
alter table public.profiles enable row level security;

create policy "Users read their own business"
  on public.businesses for select
  using (id in (select business_id from public.profiles where user_id = auth.uid()));

create policy "Users read their own profile"
  on public.profiles for select
  using (user_id = auth.uid());

-- Trigger: al crear un auth.users nuevo, lee business_name/plan_id de
-- raw_user_meta_data (pasados en signUp) y crea business + profile.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_business_id uuid;
begin
  insert into public.businesses (name, plan_id)
  values (
    coalesce(new.raw_user_meta_data->>'business_name', 'Mi negocio'),
    coalesce(new.raw_user_meta_data->>'plan_id', 'starter')
  )
  returning id into new_business_id;

  insert into public.profiles (user_id, business_id, role)
  values (new.id, new_business_id, 'admin');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

- [ ] **Step 2: Commit**

```bash
cd "D:/juandiplay/aureoapp/aureo-landing"
git add supabase/schema.sql
git commit -m "$(cat <<'EOF'
feat(db): add businesses/profiles schema + signup trigger for auth foundation

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3: STOP — human action required before continuing**

This step cannot be done by an agent: it requires pasting SQL into the Supabase dashboard and reading a key from it. The controller running this plan must pause here and ask the human to:

1. Open `https://supabase.com/dashboard/project/ihqbjwnznuxdpihzajhp/sql/new`, paste the SQL block from Step 1, and run it.
2. Verify in Table Editor that `businesses` and `profiles` now exist (empty, 0 rows is correct).
3. Open Project Settings → API, and copy the **anon / public** key (NOT the service role key — that one must never leave the server). This key is needed for both Task 2 (landing) and Task 8 (`aureo`, hardcoded).

Do not proceed to Task 2 until the human confirms the SQL ran successfully and has provided the anon key value.

---

### Task 2: `aureo-landing` — Supabase anon client + auth validation helpers

**Files:**
- Modify: `lib/supabase.ts` (add `getSupabaseAnon`)
- Create: `lib/auth-validation.ts`
- Test: `test/auth-validation.test.ts`
- Modify: `.env.local.example` (add `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_AUREO_APP_URL`)

**Interfaces:**
- Produces: `getSupabaseAnon(): SupabaseClient` (lib/supabase.ts); `parseSignupPayload(body: unknown): { ok: true; data: { email: string; password: string; businessName: string; planId: 'starter'|'pro'|'logistica' } } | { ok: false; error: string } | { ok: false; bot: true }` and `parseLoginPayload(body: unknown): { ok: true; data: { email: string; password: string } } | { ok: false; error: string } | { ok: false; bot: true }` (lib/auth-validation.ts).
- Consumes: `HONEYPOT_FIELD`, `isValidEmail` from `lib/validation.ts` (existing).

- [ ] **Step 1: Add `getSupabaseAnon` to `lib/supabase.ts`**

Current file:

```typescript
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Faltan variables de entorno de Supabase.");
  }
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}
```

Change to:

```typescript
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;
let anonClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Faltan variables de entorno de Supabase.");
  }
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

// Cliente con la anon key: usado por las rutas de auth (signup/login) para
// llamar a supabase.auth.* — estas operaciones están diseñadas para correr
// con la anon key, no con la service role key (que bypasea Auth por completo).
export function getSupabaseAnon(): SupabaseClient {
  if (anonClient) return anonClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Faltan variables de entorno de Supabase (anon key).");
  }
  anonClient = createClient(url, key, { auth: { persistSession: false } });
  return anonClient;
}
```

- [ ] **Step 2: Write `lib/auth-validation.ts`**

```typescript
import { HONEYPOT_FIELD, isValidEmail } from "@/lib/validation";

const MIN_PASSWORD = 8;
const MAX_PASSWORD = 72; // bcrypt/Supabase practical cap
const MAX_BUSINESS_NAME = 80;
const PLAN_IDS = ["starter", "pro", "logistica"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

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

function isValidPassword(password: unknown): password is string {
  return (
    typeof password === "string" &&
    password.length >= MIN_PASSWORD &&
    password.length <= MAX_PASSWORD
  );
}

function isValidPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && (PLAN_IDS as readonly string[]).includes(value);
}

export function parseSignupPayload(
  body: unknown
): { ok: true; data: SignupInput } | { ok: false; error: string } | { ok: false; bot: true } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Solicitud inválida." };
  }
  const b = body as Record<string, unknown>;

  if (typeof b[HONEYPOT_FIELD] === "string" && b[HONEYPOT_FIELD].trim() !== "") {
    return { ok: false, bot: true };
  }

  const email = typeof b.email === "string" ? b.email.normalize("NFC").trim().toLowerCase() : "";
  if (!isValidEmail(email)) {
    return { ok: false, error: "Ingresa un correo válido." };
  }

  if (!isValidPassword(b.password)) {
    return { ok: false, error: `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.` };
  }

  const businessName =
    typeof b.businessName === "string" ? b.businessName.trim().slice(0, MAX_BUSINESS_NAME) : "";
  if (!businessName) {
    return { ok: false, error: "Ingresa el nombre de tu negocio." };
  }

  if (!isValidPlanId(b.planId)) {
    return { ok: false, error: "Selecciona un plan válido." };
  }

  return {
    ok: true,
    data: { email, password: b.password as string, businessName, planId: b.planId },
  };
}

export function parseLoginPayload(
  body: unknown
): { ok: true; data: LoginInput } | { ok: false; error: string } | { ok: false; bot: true } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Solicitud inválida." };
  }
  const b = body as Record<string, unknown>;

  if (typeof b[HONEYPOT_FIELD] === "string" && b[HONEYPOT_FIELD].trim() !== "") {
    return { ok: false, bot: true };
  }

  const email = typeof b.email === "string" ? b.email.normalize("NFC").trim().toLowerCase() : "";
  if (!isValidEmail(email)) {
    return { ok: false, error: "Ingresa un correo válido." };
  }

  if (typeof b.password !== "string" || b.password.length === 0) {
    return { ok: false, error: "Ingresa tu contraseña." };
  }

  return { ok: true, data: { email, password: b.password } };
}
```

- [ ] **Step 3: Write the failing tests first**

Create `test/auth-validation.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { parseSignupPayload, parseLoginPayload } from "@/lib/auth-validation";
import { HONEYPOT_FIELD } from "@/lib/validation";

describe("parseSignupPayload", () => {
  it("accepts a valid payload", () => {
    const result = parseSignupPayload({
      email: "Test@Example.com",
      password: "correcthorsebattery",
      businessName: "Ferretería El Tornillo",
      planId: "pro",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.email).toBe("test@example.com");
      expect(result.data.planId).toBe("pro");
    }
  });

  it("rejects a short password", () => {
    const result = parseSignupPayload({
      email: "test@example.com",
      password: "short",
      businessName: "Negocio",
      planId: "starter",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects an invalid plan id", () => {
    const result = parseSignupPayload({
      email: "test@example.com",
      password: "correcthorsebattery",
      businessName: "Negocio",
      planId: "enterprise",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a missing business name", () => {
    const result = parseSignupPayload({
      email: "test@example.com",
      password: "correcthorsebattery",
      businessName: "   ",
      planId: "starter",
    });
    expect(result.ok).toBe(false);
  });

  it("flags the honeypot as a bot without leaking which check failed", () => {
    const result = parseSignupPayload({
      email: "test@example.com",
      password: "correcthorsebattery",
      businessName: "Negocio",
      planId: "starter",
      [HONEYPOT_FIELD]: "filled-by-a-bot",
    });
    expect(result.ok).toBe(false);
    expect("bot" in result && result.bot).toBe(true);
  });
});

describe("parseLoginPayload", () => {
  it("accepts a valid payload", () => {
    const result = parseLoginPayload({ email: "test@example.com", password: "anything" });
    expect(result.ok).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = parseLoginPayload({ email: "not-an-email", password: "anything" });
    expect(result.ok).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = parseLoginPayload({ email: "test@example.com", password: "" });
    expect(result.ok).toBe(false);
  });
});
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm vitest run test/auth-validation.test.ts`
Expected: all pass (this is implementation-then-test since the brief already specifies the exact validation logic — write `lib/auth-validation.ts` from Step 2 first, then this test file, then run).

- [ ] **Step 5: Add the new env vars to `.env.local.example`**

Add these two lines (grouped near the existing `NEXT_PUBLIC_SUPABASE_URL` line):

```
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
NEXT_PUBLIC_AUREO_APP_URL=https://aureo-taupe.vercel.app
```

- [ ] **Step 6: Commit**

```bash
cd "D:/juandiplay/aureoapp/aureo-landing"
git add lib/supabase.ts lib/auth-validation.ts test/auth-validation.test.ts .env.local.example
git commit -m "$(cat <<'EOF'
feat: add Supabase anon client and auth payload validation

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: `aureo-landing` — `/api/auth/signup` route

**Files:**
- Create: `app/api/auth/signup/route.ts`
- Test: `test/auth-signup-route.test.ts`

**Interfaces:**
- Consumes: `parseSignupPayload` from `lib/auth-validation.ts` (Task 2), `getSupabaseAnon` from `lib/supabase.ts` (Task 2), `runGuards` from `lib/api-guards.ts` (existing).
- Produces: `POST /api/auth/signup` → `{ ok: true, session: { access_token: string, refresh_token: string } }` (200) on success, `{ ok: false, error: string }` (400/409/500) on failure.

- [ ] **Step 1: Write the route**

```typescript
import { NextResponse } from "next/server";
import { parseSignupPayload } from "@/lib/auth-validation";
import { getSupabaseAnon } from "@/lib/supabase";
import { runGuards } from "@/lib/api-guards";

export async function POST(request: Request) {
  const guardResponse = await runGuards(request);
  if (guardResponse) return guardResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
  }

  const parsed = parseSignupPayload(body);
  if (!parsed.ok) {
    if ("bot" in parsed) {
      // No delatamos la detección de bot: mismo shape de error genérico.
      return NextResponse.json({ ok: false, error: "No pudimos crear tu cuenta." }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const { email, password, businessName, planId } = parsed.data;

  try {
    const supabase = getSupabaseAnon();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { business_name: businessName, plan_id: planId } },
    });

    if (error) {
      const status = error.status === 422 || /already registered/i.test(error.message) ? 409 : 400;
      const message =
        status === 409
          ? "Ese correo ya tiene una cuenta. Intenta iniciar sesión."
          : "No pudimos crear tu cuenta. Verifica los datos e intenta de nuevo.";
      return NextResponse.json({ ok: false, error: message }, { status });
    }

    if (!data.session) {
      // Confirmación de correo requerida por la config del proyecto: no hay
      // sesión inmediata. El caller debe mostrar "revisa tu correo".
      return NextResponse.json(
        { ok: true, requiresEmailConfirmation: true },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        },
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("signup route error", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: "Error del servidor." }, { status: 500 });
  }
}
```

- [ ] **Step 2: Write the test**

Create `test/auth-signup-route.test.ts`. Mock `@/lib/supabase`'s `getSupabaseAnon` and `@/lib/api-guards`'s `runGuards` (follow the mocking pattern already used in `test/demo-token-route.test.ts` before it was deleted — check `git log -p -- test/demo-token-route.test.ts` in `aureo-landing` if you need a reference for how this repo mocks Next.js route handlers; otherwise use `vi.mock`):

```typescript
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/api-guards", () => ({ runGuards: vi.fn(async () => null) }));

const signUpMock = vi.fn();
vi.mock("@/lib/supabase", () => ({
  getSupabaseAnon: () => ({ auth: { signUp: signUpMock } }),
}));

import { POST } from "@/app/api/auth/signup/route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    signUpMock.mockReset();
  });

  it("returns session tokens on success", async () => {
    signUpMock.mockResolvedValue({
      data: { session: { access_token: "at", refresh_token: "rt" } },
      error: null,
    });
    const res = await POST(
      makeRequest({
        email: "test@example.com",
        password: "correcthorsebattery",
        businessName: "Negocio",
        planId: "starter",
      })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.session.access_token).toBe("at");
  });

  it("returns requiresEmailConfirmation when Supabase withholds the session", async () => {
    signUpMock.mockResolvedValue({ data: { session: null }, error: null });
    const res = await POST(
      makeRequest({
        email: "test@example.com",
        password: "correcthorsebattery",
        businessName: "Negocio",
        planId: "starter",
      })
    );
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.requiresEmailConfirmation).toBe(true);
  });

  it("returns 409 when the email is already registered", async () => {
    signUpMock.mockResolvedValue({
      data: { session: null },
      error: { status: 422, message: "User already registered" },
    });
    const res = await POST(
      makeRequest({
        email: "test@example.com",
        password: "correcthorsebattery",
        businessName: "Negocio",
        planId: "starter",
      })
    );
    expect(res.status).toBe(409);
  });

  it("returns 400 for an invalid payload without calling Supabase", async () => {
    const res = await POST(makeRequest({ email: "not-an-email", password: "x", businessName: "", planId: "starter" }));
    expect(res.status).toBe(400);
    expect(signUpMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run the tests**

Run: `pnpm vitest run test/auth-signup-route.test.ts`
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
cd "D:/juandiplay/aureoapp/aureo-landing"
git add app/api/auth/signup/route.ts test/auth-signup-route.test.ts
git commit -m "$(cat <<'EOF'
feat: add /api/auth/signup route

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: `aureo-landing` — `/api/auth/login` route

**Files:**
- Create: `app/api/auth/login/route.ts`
- Test: `test/auth-login-route.test.ts`

**Interfaces:**
- Consumes: `parseLoginPayload` from `lib/auth-validation.ts` (Task 2), `getSupabaseAnon` (Task 2), `runGuards` (existing).
- Produces: `POST /api/auth/login` → `{ ok: true, session: { access_token, refresh_token } }` (200) or `{ ok: false, error }` (400/401/500).

- [ ] **Step 1: Write the route**

```typescript
import { NextResponse } from "next/server";
import { parseLoginPayload } from "@/lib/auth-validation";
import { getSupabaseAnon } from "@/lib/supabase";
import { runGuards } from "@/lib/api-guards";

export async function POST(request: Request) {
  const guardResponse = await runGuards(request);
  if (guardResponse) return guardResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
  }

  const parsed = parseLoginPayload(body);
  if (!parsed.ok) {
    if ("bot" in parsed) {
      return NextResponse.json({ ok: false, error: "Credenciales inválidas." }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAnon();
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

    if (error || !data.session) {
      return NextResponse.json(
        { ok: false, error: "Correo o contraseña incorrectos." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        },
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("login route error", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: "Error del servidor." }, { status: 500 });
  }
}
```

- [ ] **Step 2: Write the test**

Create `test/auth-login-route.test.ts` following the same mocking shape as Task 3's test:

```typescript
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/api-guards", () => ({ runGuards: vi.fn(async () => null) }));

const signInMock = vi.fn();
vi.mock("@/lib/supabase", () => ({
  getSupabaseAnon: () => ({ auth: { signInWithPassword: signInMock } }),
}));

import { POST } from "@/app/api/auth/login/route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    signInMock.mockReset();
  });

  it("returns session tokens on success", async () => {
    signInMock.mockResolvedValue({
      data: { session: { access_token: "at", refresh_token: "rt" } },
      error: null,
    });
    const res = await POST(makeRequest({ email: "test@example.com", password: "correcthorsebattery" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.session.access_token).toBe("at");
  });

  it("returns 401 on wrong credentials", async () => {
    signInMock.mockResolvedValue({ data: { session: null }, error: { message: "Invalid login credentials" } });
    const res = await POST(makeRequest({ email: "test@example.com", password: "wrong" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for an invalid payload without calling Supabase", async () => {
    const res = await POST(makeRequest({ email: "not-an-email", password: "" }));
    expect(res.status).toBe(400);
    expect(signInMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run the tests**

Run: `pnpm vitest run test/auth-login-route.test.ts`
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
cd "D:/juandiplay/aureoapp/aureo-landing"
git add app/api/auth/login/route.ts test/auth-login-route.test.ts
git commit -m "$(cat <<'EOF'
feat: add /api/auth/login route

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: `aureo-landing` — signup page + form

**Files:**
- Create: `app/registro/page.tsx`
- Create: `components/SignupForm.tsx`

**Interfaces:**
- Consumes: `POST /api/auth/signup` (Task 3), `Button`/`Input` from `components/ui/*` (existing), `HONEYPOT_FIELD` from `lib/validation.ts` (existing), `site.planes` from `content/site.ts` (existing, for plan names/ids in the selector).
- Produces: route `/registro`, optionally pre-selecting a plan from a `?plan=starter|pro|logistica` query param.

- [ ] **Step 1: Write `components/SignupForm.tsx`**

```tsx
"use client";
import { useId, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HONEYPOT_FIELD } from "@/lib/validation";

type FormState = "idle" | "loading" | "error" | "check-email";

const PLAN_OPTIONS: { id: "starter" | "pro" | "logistica"; label: string }[] = [
  { id: "starter", label: "Starter" },
  { id: "pro", label: "Pro" },
  { id: "logistica", label: "Logística" },
];

export function SignupForm() {
  const honeypotId = useId();
  const searchParams = useSearchParams();
  const initialPlan = searchParams.get("plan");
  const validInitialPlan = PLAN_OPTIONS.some((p) => p.id === initialPlan) ? initialPlan! : "pro";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [planId, setPlanId] = useState<string>(validInitialPlan);
  const [hp, setHp] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setMsg("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, businessName, planId, [HONEYPOT_FIELD]: hp }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setState("error");
        setMsg(json.error ?? "No pudimos crear tu cuenta.");
        return;
      }
      if (json.requiresEmailConfirmation) {
        setState("check-email");
        return;
      }
      const appUrl = process.env.NEXT_PUBLIC_AUREO_APP_URL;
      const { access_token, refresh_token } = json.session;
      window.location.href = `${appUrl}/index.html#access_token=${encodeURIComponent(
        access_token
      )}&refresh_token=${encodeURIComponent(refresh_token)}`;
    } catch {
      setState("error");
      setMsg("Revisa tu conexión e intenta de nuevo.");
    }
  }

  if (state === "check-email") {
    return (
      <p role="status" className="text-[var(--emerald)] font-semibold">
        ¡Listo! Revisa tu correo para confirmar tu cuenta antes de entrar.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-3" noValidate>
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
        type="text"
        required
        placeholder="Nombre de tu negocio"
        aria-label="Nombre de tu negocio"
        value={businessName}
        onChange={(e) => setBusinessName(e.target.value)}
        className="min-h-11"
      />
      <Input
        type="email"
        required
        placeholder="Tu correo"
        aria-label="Correo electrónico"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="min-h-11"
      />
      <Input
        type="password"
        required
        placeholder="Contraseña (mínimo 8 caracteres)"
        aria-label="Contraseña"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="min-h-11"
      />
      <div className="flex gap-2">
        {PLAN_OPTIONS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPlanId(p.id)}
            aria-pressed={planId === p.id}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ${
              planId === p.id
                ? "border-[var(--bronze)] bg-[var(--bronze)]/10 text-[var(--bronze)]"
                : "border-[var(--border-subtle)] text-[var(--text-secondary)]"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <Button type="submit" disabled={state === "loading"} aria-busy={state === "loading"} className="min-h-11">
        {state === "loading" ? "Creando cuenta…" : "Iniciar prueba gratis"}
      </Button>
      <p role="alert" aria-live="polite" className="min-h-5 text-sm text-[var(--terracotta)]">
        {state === "error" ? msg : ""}
      </p>
    </form>
  );
}
```

- [ ] **Step 2: Write `app/registro/page.tsx`**

```tsx
import { Suspense } from "react";
import { SignupForm } from "@/components/SignupForm";

export const metadata = {
  title: "Crea tu cuenta · Aureo",
  description: "Inicia tu prueba gratuita de 14 días en Aureo.",
};

export default function RegistroPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-5 py-16">
      <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
        Crea tu cuenta
      </h1>
      <p className="text-[var(--text-secondary)]">
        14 días gratis, sin tarjeta. Empieza a controlar tu inventario hoy mismo.
      </p>
      <Suspense fallback={null}>
        <SignupForm />
      </Suspense>
    </main>
  );
}
```

(`Suspense` wraps the client form because it reads `useSearchParams()`, which Next.js requires to be inside a Suspense boundary for a statically-rendered page.)

- [ ] **Step 3: Manual verification (no automated test — this needs Task 1's live schema and Task 3's route)**

Run `pnpm dev`, visit `http://localhost:3001/registro?plan=logistica`, confirm the "Logística" plan button is pre-selected. Do not submit yet if Task 1's SQL hasn't been applied — submitting before that will succeed at Supabase Auth but fail to create the `businesses`/`profiles` rows (the trigger won't exist), leaving an orphaned `auth.users` row. If you need to test the form in isolation before Task 1 lands, stop after confirming the plan pre-selection renders correctly.

- [ ] **Step 4: Commit**

```bash
cd "D:/juandiplay/aureoapp/aureo-landing"
git add app/registro/page.tsx components/SignupForm.tsx
git commit -m "$(cat <<'EOF'
feat: add /registro signup page

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: `aureo-landing` — login page + form

**Files:**
- Create: `app/login/page.tsx`
- Create: `components/LoginForm.tsx`

**Interfaces:**
- Consumes: `POST /api/auth/login` (Task 4), `Button`/`Input` (existing).
- Produces: route `/login`.

- [ ] **Step 1: Write `components/LoginForm.tsx`**

```tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FormState = "idle" | "loading" | "error";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setMsg("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setState("error");
        setMsg(json.error ?? "Correo o contraseña incorrectos.");
        return;
      }
      const appUrl = process.env.NEXT_PUBLIC_AUREO_APP_URL;
      const { access_token, refresh_token } = json.session;
      window.location.href = `${appUrl}/index.html#access_token=${encodeURIComponent(
        access_token
      )}&refresh_token=${encodeURIComponent(refresh_token)}`;
    } catch {
      setState("error");
      setMsg("Revisa tu conexión e intenta de nuevo.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-3" noValidate>
      <Input
        type="email"
        required
        placeholder="Tu correo"
        aria-label="Correo electrónico"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="min-h-11"
      />
      <Input
        type="password"
        required
        placeholder="Contraseña"
        aria-label="Contraseña"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="min-h-11"
      />
      <Button type="submit" disabled={state === "loading"} aria-busy={state === "loading"} className="min-h-11">
        {state === "loading" ? "Entrando…" : "Iniciar sesión"}
      </Button>
      <p role="alert" aria-live="polite" className="min-h-5 text-sm text-[var(--terracotta)]">
        {state === "error" ? msg : ""}
      </p>
    </form>
  );
}
```

- [ ] **Step 2: Write `app/login/page.tsx`**

```tsx
import { LoginForm } from "@/components/LoginForm";

export const metadata = {
  title: "Inicia sesión · Aureo",
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-5 py-16">
      <h1 className="font-display text-2xl font-bold text-[var(--text-primary)]">
        Inicia sesión
      </h1>
      <LoginForm />
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd "D:/juandiplay/aureoapp/aureo-landing"
git add app/login/page.tsx components/LoginForm.tsx
git commit -m "$(cat <<'EOF'
feat: add /login page

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: `aureo` — `session-gate.js` replaces `demo-gate.js`

**Files:**
- Create: `session-gate.js`
- Delete: `demo-gate.js`
- Modify: `index.html` (head script tag)
- Modify: `login.html` (head script tag — this file's body is rewritten in Task 9, this task only touches the head)

**Interfaces:**
- Produces: on every page load, either a working `supabase-js` session (fragment consumed or restored from its own storage) or a redirect to `<landing>/login`. Exposes `window.__aureoSupabase` (the initialized client) for `auth.js` (Task 8) to reuse — creating the client twice would double-initialize `supabase-js`'s internal state.

This task needs the real Supabase URL and anon key from Task 1's Step 3 (human-provided). Do not guess placeholder values — ask the controller if they weren't carried into this dispatch.

- [ ] **Step 1: Write `session-gate.js`**

```javascript
// AUREO — GATE de sesión real (Supabase Auth). Reemplaza al antiguo
// demo-gate.js del sub-proyecto A1. Se carga como el PRIMER <script> del
// <head>, antes que cualquier otro (incluido auth.js), porque debe decidir
// "dejar pasar o redirigir" antes de que el resto del documento se parsee.
//
// A diferencia del viejo demo-gate.js (XHR síncrona bloqueante), este usa
// supabase-js cargado por CDN y opera de forma asíncrona: oculta el body
// con una clase hasta resolver la sesión, para no mostrar la app sin
// autenticar ni un flash de contenido.

(function () {
    "use strict";

    var SUPABASE_URL = "https://ihqbjwnznuxdpihzajhp.supabase.co";
    var SUPABASE_ANON_KEY = "REEMPLAZAR_CON_LA_ANON_KEY_REAL"; // pública por diseño, ver spec
    var LANDING_LOGIN_URL = "https://aureo-landing.vercel.app/login"; // actualizar si cambia el dominio

    document.documentElement.classList.add("aureo-auth-pending");

    function redirectToLogin() {
        window.location.replace(LANDING_LOGIN_URL);
    }

    // IMPORTANTE: este script NUNCA quita la clase aureo-auth-pending — solo
    // decide "hay sesión de Supabase, o no". Si hay sesión, auth.js (cargado
    // después) todavía tiene que resolver rol/negocio/trial y filtrar
    // pestañas antes de que sea seguro mostrar la página; es auth.js quien
    // quita la clase, al final de initAppSession(). Si este script la
    // quitara aquí, habría una carrera real: la UI sin filtrar por rol
    // podría verse brevemente antes de que auth.js termine su propio chequeo.
    var script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js";
    script.onload = function () {
        var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        window.__aureoSupabase = supabase;

        var hash = window.location.hash;
        if (hash && hash.indexOf("access_token=") !== -1) {
            var params = new URLSearchParams(hash.replace(/^#/, ""));
            var accessToken = params.get("access_token");
            var refreshToken = params.get("refresh_token");
            if (accessToken && refreshToken) {
                supabase.auth
                    .setSession({ access_token: accessToken, refresh_token: refreshToken })
                    .then(function (result) {
                        // Limpiar el fragmento SIEMPRE, éxito o no: nunca dejar el
                        // token colgando en la URL/historial del navegador.
                        var clean = window.location.pathname + window.location.search;
                        window.history.replaceState({}, "", clean);
                        if (result.error || !result.data.session) {
                            redirectToLogin();
                        }
                        // Éxito: no hacer nada más aquí — auth.js retoma desde
                        // supabase-js's ya-persistida sesión.
                    });
                return;
            }
        }

        supabase.auth.getSession().then(function (result) {
            if (!result.data.session) {
                redirectToLogin();
            }
            // Hay sesión: dejar que auth.js la resuelva y quite la clase.
        });
    };
    script.onerror = function () {
        // CDN caído: no dejamos pasar sin poder validar sesión.
        redirectToLogin();
    };
    document.head.appendChild(script);
})();
```

- [ ] **Step 2: Add the CSS that hides content while `aureo-auth-pending` is set**

In `styles.css`, add near the top (this is a new, small, self-contained rule — do not restructure surrounding CSS):

```css
html.aureo-auth-pending body {
    visibility: hidden;
}
```

- [ ] **Step 3: Delete `demo-gate.js`**

```bash
cd "D:/juandiplay/aureoapp/aureo"
rm demo-gate.js
```

- [ ] **Step 4: Update `index.html`'s head script tag**

Change:

```html
<head>
    <script src="demo-gate.js"></script>
```

to:

```html
<head>
    <script src="session-gate.js"></script>
```

- [ ] **Step 5: Update `login.html`'s head script tag (body rewritten in Task 9)**

Same change as Step 4, in `login.html`.

- [ ] **Step 6: Verify syntax**

```bash
cd "D:/juandiplay/aureoapp/aureo"
node --check session-gate.js
```

Expected: no output (exit 0).

- [ ] **Step 7: Commit**

```bash
git add session-gate.js styles.css index.html login.html
git rm demo-gate.js
git commit -m "$(cat <<'EOF'
feat: replace demo-gate.js with session-gate.js (real Supabase auth)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: `aureo` — rewrite `auth.js` for real sessions + trial gate

**Files:**
- Modify: `auth.js` (large rewrite — see below for exact replacement blocks)
- Modify: `picking.js` (see Step 6 — its top-level `PICKING_SESSION` constant
  breaks under the new async session load; must change in lockstep with this
  task, not deferred, since it's this rewrite that breaks it)

**Interfaces:**
- Consumes: `window.__aureoSupabase` (Task 7).
- Produces: `getAllowedTabs(role)` unchanged signature (still consumed by
  every domain module); session data available synchronously (once resolved)
  via `getVulcanSession()` as `{ email, role, name, trialEndsAt }` — `name`
  intentionally keeps the field name the rest of the codebase (`picking.js`,
  and previously `VULCAN_USERS`) already expects for a display name, now
  populated from the business name instead of a hardcoded user's name.
  `window.AUREO_SESSION` mirrors the same object for any future module that
  wants it.

**⚠️ Timing hazard other tasks must not reintroduce:** the old `auth.js` set
`getVulcanSession()`'s backing store synchronously, before `DOMContentLoaded`,
so any script loaded after it (all the domain modules) could safely read a
session at top-level/module-scope parse time. The new session load is
inherently asynchronous (it queries Supabase). `getVulcanSession()` returns
whatever is in `AUREO_SESSION_CACHE` **at the moment it's called** — `null`
until `loadAureoSession()` resolves. Only call it from inside a function
that runs in response to user interaction or after `initAppSession()` has
awaited (never at a script's top level / module scope). Step 6 below fixes
the one existing violation of this (`picking.js`); if you find another
while implementing, fix it the same way — don't leave a new top-level call.

- [ ] **Step 1: Remove `VULCAN_USERS` and the login-form logic**

Delete these blocks entirely from `auth.js`:
- The `VULCAN_USERS` array (lines 12-16 in the pre-change file).
- `initLoginForm()` and its helpers `setLoading`, `showLoginError`, `hideLoginError` (lines 230-342) — login only happens on the landing now, `aureo`'s own login form is gone (Task 9 replaces `login.html`'s body).
- The `AUTH_API` constant and its usage (lines 7-9) — no more backend login endpoint to call.
- `const VULCAN_IS_LOGIN_PAGE = !!document.getElementById("login-form");`
  (line 185) — dead once Task 9 removes `login.html`'s `#login-form`
  element and its `<script src="auth.js">` tag entirely; `auth.js` is only
  ever loaded from `index.html` from this point on, where it would always
  evaluate `false` anyway.

- [ ] **Step 2: Replace `guardImmediate()` and session helpers**

Change the session helpers and guard block from:

```javascript
// --- Configuración de sesión ---
const SESSION_KEY = "vulcan_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 horas
```

to:

```javascript
// --- Configuración de sesión ---
// La sesión real vive en supabase-js (su propio localStorage). Este objeto
// es solo una caché en memoria de los datos ya resueltos (perfil/negocio),
// para no re-consultar Supabase en cada getVulcanSession().
let AUREO_SESSION_CACHE = null;
```

Change `setVulcanSession`/`getVulcanSession`/`clearVulcanSession` from:

```javascript
function setVulcanSession(user, token = null) {
    const now = Date.now();
    const session = {
        username: user.username,
        role: user.role,
        name: user.name,
        loginAt: now,
        expiresAt: now + SESSION_TTL_MS,
        token: token
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
}

function getVulcanSession() {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        const session = JSON.parse(raw);
        if (!session || !session.expiresAt) return null;
        if (Date.now() > session.expiresAt) {
            // Sesión expirada
            localStorage.removeItem(SESSION_KEY);
            return null;
        }
        return session;
    } catch (e) {
        return null;
    }
}

function clearVulcanSession() {
    localStorage.removeItem(SESSION_KEY);
}
```

to:

```javascript
// Consulta profiles+businesses del usuario autenticado en Supabase. Devuelve
// null si no hay sesión de Supabase o el perfil no existe (no debería pasar:
// el trigger on_auth_user_created los crea juntos en el signup).
async function loadAureoSession() {
    const supabase = window.__aureoSupabase;
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile, error } = await supabase
        .from("profiles")
        .select("role, business_id, businesses(name, trial_ends_at)")
        .eq("user_id", user.id)
        .single();
    if (error || !profile) return null;

    AUREO_SESSION_CACHE = {
        email: user.email,
        role: profile.role,
        name: profile.businesses.name,
        trialEndsAt: profile.businesses.trial_ends_at,
    };
    window.AUREO_SESSION = AUREO_SESSION_CACHE;
    return AUREO_SESSION_CACHE;
}

function getVulcanSession() {
    return AUREO_SESSION_CACHE;
}

async function vulcanLogout() {
    const supabase = window.__aureoSupabase;
    if (supabase) await supabase.auth.signOut();
    window.location.replace("login.html");
}
```

(The old synchronous `vulcanLogout` becomes `async` — its one caller is the sidebar logout button's `onclick`; confirm in `index.html` that the handler doesn't rely on a synchronous return value. If it does, wrap the call site with `.catch(() => {})` rather than changing this function's shape.)

- [ ] **Step 3: Replace `guardImmediate()` and `initAppSession()` entry points**

Delete the entire `guardImmediate()` IIFE (the block with the "3. Sistema principal en escritorio: entrada sin fricción" comment and the auto-`setVulcanSession(adminUser, ...)` fallback) — `session-gate.js` (Task 7) now owns the "is there a session at all" decision. `auth.js` only needs to load the resolved session data and gate on the trial.

Replace the `DOMContentLoaded` handler from:

```javascript
document.addEventListener("DOMContentLoaded", () => {
    if (VULCAN_IS_LOGIN_PAGE) {
        initLoginForm();
    } else {
        initAppSession();
    }
});
```

to:

```javascript
document.addEventListener("DOMContentLoaded", () => {
    initAppSession();
});
```

And change `initAppSession` from a synchronous function reading `getVulcanSession()` cold, to one that awaits `loadAureoSession()` first and checks the trial:

```javascript
async function initAppSession() {
    const session = await loadAureoSession();
    if (!session) {
        window.location.replace("login.html");
        return;
    }

    if (new Date(session.trialEndsAt).getTime() < Date.now()) {
        renderTrialExpiredScreen(session);
        document.documentElement.classList.remove("aureo-auth-pending");
        return;
    }

    const allowed = getAllowedTabs(session.role);

    // 1. Mostrar datos del usuario en el sidebar
    const nameEl = document.getElementById("session-username");
    const roleEl = document.getElementById("session-userrole");
    if (nameEl) nameEl.innerText = session.name;
    if (roleEl) {
        const roleDef = getStoredRoles().find(r => r.id === session.role);
        roleEl.innerText = (roleDef && roleDef.name) || ROLE_LABELS[session.role] || session.role;
    }

    // 2. Ocultar módulos (pestañas) no permitidos para el rol
    const allTabs = ["dashboard", "inventory", "invoicing", "clientes", "logistics", "picking", "dataentry", "inventario", "reports", "purchasing", "movimientos", "settings"];
    allTabs.forEach(tab => {
        const link = document.getElementById(`nav-${tab}`);
        if (!link) return;
        const li = link.closest(".nav-item");
        if (li) li.style.display = allowed.includes(tab) ? "" : "none";
    });

    // 2b. Ocultar grupos del sidebar que quedaron sin módulos visibles para el rol
    document.querySelectorAll(".nav-group").forEach(grp => {
        const anyVisible = Array.from(grp.querySelectorAll(".nav-item"))
            .some(li => li.style.display !== "none");
        grp.style.display = anyVisible ? "" : "none";
    });

    // 3. Blindar switchTab: impedir navegación a módulos sin permiso
    if (typeof window.switchTab === "function") {
        const originalSwitch = window.switchTab;
        window.switchTab = function (tabId) {
            if (!allowed.includes(tabId)) {
                if (typeof triggerToast === "function") {
                    triggerToast("error", "No tienes permisos para acceder a este módulo.");
                }
                return;
            }
            return originalSwitch(tabId);
        };
    }

    // 4. Si la pestaña activa por defecto no está permitida, ir a la primera válida
    if (!allowed.includes("dashboard")) {
        const firstAllowed = allowed[0];
        if (firstAllowed && typeof window.switchTab === "function") {
            window.switchTab(firstAllowed);
        }
    }

    // 5. Recién ahora es seguro mostrar la página: las pestañas ya están
    // filtradas por rol. Ver la nota en session-gate.js — esa clase se
    // agrega ahí pero deliberadamente solo se quita aquí.
    document.documentElement.classList.remove("aureo-auth-pending");
}

// Pantalla de bloqueo simple cuando el trial venció. No hay integración de
// pagos todavía (fuera de alcance de este sub-proyecto) — solo un mensaje y
// un link de vuelta a precios en la landing.
function renderTrialExpiredScreen(session) {
    document.body.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:2rem;font-family:inherit;">
            <div>
                <h1>Tu prueba gratuita terminó</h1>
                <p>Gracias por probar Aureo, ${session.name}. Contáctanos para continuar con un plan pago.</p>
                <a href="https://aureo-landing.vercel.app/#planes">Ver planes</a>
            </div>
        </div>
    `;
}
```

Note `role` in `session.role` is always `'admin'` per this sub-project's scope (decision #2 in the spec) — `getAllowedTabs('admin')` already returns every tab via the existing `ROLE_TABS`/`getStoredRoles` machinery, unchanged.

- [ ] **Step 4: Verify syntax**

```bash
cd "D:/juandiplay/aureoapp/aureo"
node --check auth.js
```

Expected: no output.

- [ ] **Step 5: Fix `picking.js`'s top-level `PICKING_SESSION` constant**

This constant is assigned once, at module-parse time (`picking.js` loads
right after `auth.js` in `index.html`'s script order, synchronously, well
before `loadAureoSession()`'s promise can resolve) — under the old
synchronous-session design this was safe; under the new async one it would
permanently freeze `PICKING_SESSION` at `null`. Fix by reading the session
live at each use site instead of caching it at parse time.

Change:

```javascript
const PICKING_SESSION = (typeof getVulcanSession === 'function' && getVulcanSession()) || null;
```

to: delete this line entirely (no top-level replacement needed).

Change the three use sites. First, in `renderPickingDetailBody`:

```javascript
    if (PICKING_SESSION && !operators.includes(PICKING_SESSION.name)) operators.push(PICKING_SESSION.name);
```

to:

```javascript
    const pickingSession = typeof getVulcanSession === 'function' ? getVulcanSession() : null;
    if (pickingSession && !operators.includes(pickingSession.name)) operators.push(pickingSession.name);
```

Second, in `logPicking`:

```javascript
    const by = (PICKING_SESSION && PICKING_SESSION.name) || list.operator || 'Sistema';
```

to:

```javascript
    const pickingSession = typeof getVulcanSession === 'function' ? getVulcanSession() : null;
    const by = (pickingSession && pickingSession.name) || list.operator || 'Sistema';
```

Third, in `startPicking`:

```javascript
    if (list.operator === 'Sin asignar' && PICKING_SESSION) {
        list.operator = PICKING_SESSION.name;
    }
```

to:

```javascript
    const pickingSession = typeof getVulcanSession === 'function' ? getVulcanSession() : null;
    if (list.operator === 'Sin asignar' && pickingSession) {
        list.operator = pickingSession.name;
    }
```

- [ ] **Step 6: Verify `picking.js` syntax**

```bash
cd "D:/juandiplay/aureoapp/aureo"
node --check picking.js
```

Expected: no output.

- [ ] **Step 7: Manual verification (requires Task 1's live schema + a real signed-up test account from Task 5)**

Sign up through `aureo-landing`'s `/registro` in a browser, confirm the redirect lands in `aureo` with a working session (sidebar shows the business name, no redirect loop). Then manually set that business's `trial_ends_at` to a past date in the Supabase Table Editor and reload `aureo` — confirm the trial-expired screen renders instead of the app. Also start a picking list and confirm the operator name attributed is the business name, not blank/"Sistema".

- [ ] **Step 8: Commit**

```bash
cd "D:/juandiplay/aureoapp/aureo"
git add auth.js picking.js
git commit -m "$(cat <<'EOF'
feat: replace hardcoded demo auth with real Supabase session + trial gate

Also fixes picking.js's PICKING_SESSION, which read the session at
module-parse time — safe under the old synchronous auto-login, broken
under the new async Supabase session load.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: `aureo` — `login.html` becomes a redirect shim; delete retired demo files

**Files:**
- Modify: `login.html` (replace body entirely)
- Delete: `demo-banner.js`, `api/verify-demo-token.js`, `api/verify-admin-key.js`
- Modify: `index.html` (remove now-deleted script tags)
- Modify: `CLAUDE.md`

**Interfaces:** None — this task only removes dead surface and simplifies `login.html`; nothing downstream depends on the deleted files (Task 8 already removed `auth.js`'s only caller of the login-form functions, and `demo-banner.js`/the two `api/` files were only ever reachable via the now-deleted `demo-gate.js`).

- [ ] **Step 1: Replace `login.html`'s body**

`login.html` currently renders a "Elige una perspectiva" role-selector UI (the 3 demo accounts) — this entire body is retired; login only happens on the landing now. Replace the full `<body>...</body>` content with:

```html
<body>
    <script>
        window.location.replace("https://aureo-landing.vercel.app/login");
    </script>
    <noscript>
        <p>Por favor <a href="https://aureo-landing.vercel.app/login">inicia sesión en Aureo</a>.</p>
    </noscript>
</body>
```

Keep the `<head>` as Task 7 left it (still loads `session-gate.js` — harmless here since `session-gate.js`'s own redirect-to-login would just point to the same place if it ever ran first, but in practice this inline script fires immediately on `DOMContentLoaded`-free execution).

Delete the `<script src="auth.js"></script>` tag from `login.html`'s body too — nothing in it is needed for a static redirect page.

- [ ] **Step 2: Delete the retired files**

```bash
cd "D:/juandiplay/aureoapp/aureo"
rm demo-banner.js api/verify-demo-token.js api/verify-admin-key.js
```

- [ ] **Step 3: Remove their script tags from `index.html`**

Change:

```html
    <script src="demo-banner.js"></script>
    <script src="auth.js"></script>
    <script src="demo-data.js"></script>
```

to:

```html
    <script src="auth.js"></script>
    <script src="demo-data.js"></script>
```

(`demo-data.js` is left as-is per the spec — it's fixture data unrelated to the auth mechanism, and keeping or repurposing it as trial seed data is explicitly the implementer's call, not a decision this plan makes.)

- [ ] **Step 4: Update `CLAUDE.md`**

Find the "Roles & Demo Credentials" table and the "Backend Integration" section (added by sub-project A1's note about `demo-gate.js`) and replace them to reflect reality. Change:

```markdown
## Roles & Demo Credentials

| Username | Password | Role | Access |
|---|---|---|---|
| `admin` | `admin123` | admin | All modules |
| `warehouse` | `warehouse123` | warehouse | dashboard, inventory, logistics, picking |
| `cashier` | `cashier123` | cashier | dashboard, invoicing |
```

to:

```markdown
## Authentication

Real accounts via Supabase Auth (email + password). Signup/login only
happen on `aureo-landing` (`/registro`, `/login`) — `aureo` is
destination-only. Session handoff uses the Supabase `access_token`/
`refresh_token` in a URL fragment, consumed by `session-gate.js` on load.
Every signed-up business gets exactly one admin user and a 14-day trial
(`businesses.trial_ends_at`); no multi-user-per-business invites yet, so
`role` is always `admin` today — the `ROLE_TABS`/Permissions machinery
that supports warehouse/cashier roles is unchanged and ready for when
invites ship.
```

And change:

```markdown
## Note on `aureo-demo`

The `aureo-demo` project (a byte-copy of this repo used for the public 30-min
gated demo) has been retired and deleted. `demo-gate.js` here is unchanged
and remains the only access control into this app until it's replaced by
real auth in a future sub-project — see the TODO at the top of that file.
```

to:

```markdown
## Note on `aureo-demo`

The `aureo-demo` project (a byte-copy of this repo used for the public 30-min
gated demo) was retired and deleted in an earlier sub-project. The interim
`demo-gate.js` access control it left behind has since been replaced by
`session-gate.js` (real Supabase Auth) — see "Authentication" above.
```

- [ ] **Step 5: Grep sweep**

```bash
cd "D:/juandiplay/aureoapp/aureo"
grep -rn "VULCAN_USERS\|demo-gate\|demo-banner\|verify-demo-token\|verify-admin-key\|vulcan_session" . --include="*.js" --include="*.html" --include="*.md"
```

Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add login.html index.html CLAUDE.md
git rm demo-banner.js api/verify-demo-token.js api/verify-admin-key.js
git commit -m "$(cat <<'EOF'
feat: retire demo login UI and remaining demo-mode files

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: End-to-end manual verification

**Files:** None — verification only, no code changes.

**Interfaces:** None.

This sub-project has no automated E2E harness that can safely exercise real Supabase Auth signup against production (creating throwaway accounts in production auth is undesirable, and there's no separate test Supabase project). Verification is manual, run by whoever executes this plan, with the human available to check the Supabase dashboard.

- [ ] **Step 1: Fresh signup**

Visit `aureo-landing`'s `/registro?plan=starter`, sign up with a real, disposable test email you control. Confirm either immediate redirect into `aureo` with a working session, or (if email confirmation is enabled on the Supabase project) a "revisa tu correo" message — follow the confirmation link and confirm it then leads to a working session.

- [ ] **Step 2: Verify the data model**

In Supabase Table Editor, confirm exactly one new row in `businesses` (correct `plan_id`, `trial_ends_at` ≈ now + 14 days) and exactly one new row in `profiles` (correct `user_id`, `role = 'admin'`) for that signup.

- [ ] **Step 3: Login flow**

Log out (sidebar logout button), then log back in via `aureo-landing`'s `/login` with the same credentials. Confirm it lands back in `aureo` with the same session data.

- [ ] **Step 4: Trial expiry**

In Table Editor, manually set that test business's `trial_ends_at` to a past date. Reload `aureo` — confirm the trial-expired screen renders, not the app.

- [ ] **Step 5: No-session redirect**

Clear browser storage for `aureo`'s domain (or use a private window), visit `aureo`'s `index.html` directly with no fragment — confirm it redirects to `aureo-landing`'s `/login`, not to a broken or open state.

- [ ] **Step 6: `login.html` shim**

Visit `aureo`'s `login.html` directly — confirm it redirects immediately to `aureo-landing`'s `/login`.

- [ ] **Step 7: Report results**

Summarize pass/fail for each step above back to whoever is tracking this plan's execution. Any failure here is a real defect, not a formality — fix it before considering sub-project B complete.
