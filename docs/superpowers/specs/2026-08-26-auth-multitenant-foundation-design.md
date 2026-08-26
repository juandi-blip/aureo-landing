# Auth & multi-tenant foundation — design

Sub-project B of the Aureo ecosystem reorg. Order: A1 (done) → **B (this
spec)** → A2 (waitlist → real trial CTA, blocked on B) → C (superadmin
panel, blocked on B) → D (new modules) → E (full backend).

## Goal

Replace the current fake "access control" in `aureo` — three hardcoded
demo credentials plus an auto-login-as-admin fallback, gated only by the
retired demo-token/admin-key mechanism — with real accounts. A visitor
signs up on the landing with email + password, picks a plan, and lands in
`aureo` on a 14-day trial as the admin of their own business. No payment
collected at signup. No custom domain owned yet, so the session handoff
between `aureo-landing` (Next.js, `*.vercel.app`) and `aureo` (build-less
SPA, different `*.vercel.app` domain) cannot rely on shared cookies.

## Context

- `aureo-landing` already has a Supabase project (used today only for the
  `waitlist` table, `supabase/schema.sql`) and already depends on Supabase
  server-side (`SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL` env
  vars exist). No Auth-specific schema exists yet.
- `aureo`'s current `auth.js`: `VULCAN_USERS` (3 hardcoded creds),
  `ROLE_TABS`/`getStoredRoles`/`getAllowedTabs` (role → visible tabs,
  configurable per business via the Permissions module — this machinery
  stays, only where the role value comes from changes), and a
  `guardImmediate()` IIFE that **auto-logs any visitor in as `admin`** if
  no session exists (`auth.js:200-213`, comment: "entrada sin fricción").
  This auto-login is removed entirely by this sub-project.
- `demo-gate.js` (marked interim in sub-project A1) is `aureo`'s only real
  gate today — token or `#admin_key=` fragment, admin-key session persists
  30 days in `localStorage`. This sub-project replaces it outright.
- `aureo` has no build step (no npm, no bundler) — any new client-side
  dependency must load from a CDN `<script>` tag, the same pattern already
  used for SheetJS (`xlsx.full.min.js`).
- No custom domain is owned (`aureo` → `aureo-taupe.vercel.app` /
  `aureo-juandiplib.vercel.app`; `aureo-landing` →
  `aureo-landing.vercel.app`) — cross-origin cookies are not an option
  until a domain is bought.

## Decisions made during brainstorming

1. **Auth method:** email + password (Supabase Auth), with email
   verification. No magic link, no OAuth, for this sub-project.
2. **Tenancy shape:** one business = one admin user at signup. Inviting
   additional users (warehouse/cashier roles) under the same business is
   explicitly deferred — not built in B.
3. **Session bridge:** no shared cookie, no custom signed token scheme.
   `aureo-landing` performs Supabase Auth client-side
   (`@supabase/supabase-js`, already usable there), then on success
   redirects the browser to `aureo` with the Supabase session tokens in
   the **URL fragment** (`#access_token=...&refresh_token=...`) — fragments
   never reach server logs, matching the existing `#admin_key=` pattern in
   `demo-gate.js`. `aureo` loads `supabase-js` from CDN, calls
   `supabase.auth.setSession({access_token, refresh_token})`, strips the
   fragment via `history.replaceState`, and lets `supabase-js` own session
   persistence/refresh from then on (its own `localStorage` keys). No
   backend relay, no custom token signing, no new serverless function in
   `aureo` for this — security rests on Postgres Row Level Security (RLS),
   the same trust boundary Supabase is designed around.
4. **Module access during trial:** full product unlocked regardless of
   chosen plan — no per-plan feature gating in this sub-project (nothing
   is gated by plan today anyway). The chosen plan is stored for future
   billing only.
5. **Data model:** minimal — no extra business fields (NIT, phone, city)
   beyond what's needed to run the trial. Those get added to Settings
   later, when actually used.

## Data model (Supabase)

Two new tables plus one trigger, alongside the existing `waitlist` table
in `supabase/schema.sql`:

```sql
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

-- Trigger: on new auth.users row, read business_name/plan_id from
-- raw_user_meta_data (passed at signUp time) and create the business +
-- profile rows atomically.
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

`plan_id` values match the three landing plans (`starter`, `pro`,
`logistica` — see `content/site.ts`'s `planes` array).

## Landing (`aureo-landing`) — signup/login

- New routes: `/registro` (email, password, business name, plan —
  pre-filled from whichever plan CTA was clicked) and `/login`.
- Both use `@supabase/supabase-js` client-side:
  `supabase.auth.signUp({ email, password, options: { data: { business_name, plan_id } } })`
  and `supabase.auth.signInWithPassword({ email, password })`.
- Inline error handling for Supabase's standard failure cases (email
  already registered, weak password, invalid credentials).
- On success, redirect to
  `https://<aureo-domain>/index.html#access_token=<...>&refresh_token=<...>`
  using the session Supabase returns from signUp/signInWithPassword.
- This sub-project does NOT remove the waitlist or rewrite the rest of the
  site's CTAs — that's sub-project A2, which starts once this ships (its
  CTAs will point at `/registro` instead of the waitlist form).

## `aureo` — replacing the gate

- **New `session-gate.js`** (replaces `demo-gate.js`, loads first in
  `<head>`, same position): loads `supabase-js` from CDN. If the URL has
  an `#access_token=` fragment, calls `setSession()` with it, then strips
  the fragment via `history.replaceState`. Otherwise, lets `supabase-js`
  attempt to restore a persisted session. If no valid session results,
  redirects to `<landing-domain>/login`.
- **`auth.js` rewritten:** `VULCAN_USERS` and the `guardImmediate()`
  auto-admin-login fallback are deleted. Session identity now comes from
  querying `profiles` (joined to `businesses`) via `supabase-js` for the
  current authenticated user. `role` is always `'admin'` for now (per
  decision #2) — `ROLE_TABS`/`getStoredRoles`/`getAllowedTabs` machinery is
  unchanged, it just receives `'admin'` from a real source instead of a
  hardcoded object.
- **`login.html` becomes a redirect shim:** anyone landing there directly
  gets sent to `<landing-domain>/login` — login/signup only happens on the
  landing, `aureo` is destination-only.
- **Deleted:** `demo-gate.js`, `demo-banner.js`, `api/verify-demo-token.js`,
  `api/verify-admin-key.js`, the `VULCAN_USERS` array and its login-form
  logic in `auth.js`. `demo-data.js` is evaluated during implementation —
  keep if useful as seed/fixture data for a fresh trial business, delete
  otherwise (implementer's call, not a design decision that needs
  litigating here).

## Trial expiration

- On session load, `aureo` reads `trial_ends_at` from the user's
  `businesses` row (via the same `supabase-js` query as above — RLS
  already restricts it to the caller's own row, so this is real data, not
  just a client-side flag to trust blindly).
- If `trial_ends_at < now()` (and there is no billing/active-plan flag,
  since no billing exists yet), show a simple blocking screen instead of
  the app: "tu prueba terminó" + a link back to the landing's pricing
  section. Same rigor level as today's gate — sufficient for an MVP with
  no payments yet.

## Out of scope

- Billing/payment collection — no sub-project decomposed for this yet;
  needed before trial expiration can mean anything beyond "contact us."
- Multi-user-per-business invites (warehouse/cashier real accounts).
- Superadmin panel (sub-project C — depends on this shipping first, since
  it needs the `businesses`/`profiles` tables to exist).
- Per-plan feature/module gating.
- Custom domain / shared-cookie session (revisit once a domain exists —
  the fragment-handoff mechanism here still works after that, but could be
  simplified).
- Rewriting the landing's waitlist-based CTAs (sub-project A2).

## Testing

- Signup creates exactly one `businesses` row and one `profiles` row
  (verify the trigger fires correctly, including on constraint failures —
  e.g. a duplicate business name should NOT block signup, only email
  uniqueness is enforced by `auth.users`).
- Login with wrong password fails with a clear inline error, no session
  set.
- Fragment handoff: manually constructed `#access_token=`/`refresh_token=`
  pair from a real Supabase session, opened directly against `aureo`,
  results in a working session and a clean URL (fragment stripped).
- No `#access_token=` and no persisted session → redirect to
  `<landing-domain>/login`.
- A business with `trial_ends_at` in the past sees the blocking screen,
  not the app.
- `login.html` visited directly redirects to the landing's `/login`.
- Grep sweep confirms `VULCAN_USERS`, `demo-gate.js`, `verify-demo-token`,
  `verify-admin-key` are fully gone from `aureo`.
