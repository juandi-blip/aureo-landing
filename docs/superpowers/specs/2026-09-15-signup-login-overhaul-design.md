# Signup/login overhaul: landing CTAs, split login, Google OAuth — design

Sub-project A2 from the original auth/multi-tenant foundation plan
("waitlist → real trial CTA"), expanded during brainstorming to also cover
a visual redesign of `/login`/`/registro` and closing gaps found against
standard SaaS registration practice (terms consent, social login).

## Goal

`aureo-landing`'s landing page still funnels every visitor into the old
waitlist form (`WaitlistForm.tsx`, embedded in `Hero`/`FinalCTA`, linked
from `Nav`/`SecuritySection`/`PricingCard`), even though real accounts and
a real 14-day trial have existed since the password-recovery work shipped.
Replace every waitlist entry point with the real signup/login flow, polish
`/login` into a two-column layout (product screenshot + benefits panel,
inspired by Alegra's login page — see reference screenshots in this
brainstorming session), add a Google OAuth option to both `/login` and
`/registro`, add a required terms-of-service checkbox to `/registro` (a
real gap: the old `WaitlistForm` had one, the real `SignupForm` never got
one), and add a show/hide toggle to every password field.

## Context

- `content/site.ts`'s `planes` array has no stable `id` field per plan —
  only `nombre` ("Starter"/"Pro"/"Logística"). `PricingCard.tsx` needs a
  `starter|pro|logistica` id to build `/registro?plan=<id>` links (the
  existing `SignupForm.tsx` already reads and validates this query param).
- Every plan's `cta` field literally reads `"Unirme a la lista de
  espera"`, and `site.earlyBird` (rendered by `PricingTable.tsx`, the
  "Fundador temprano" badge) is copy entirely about being early in a
  queue. `SecuritySection.tsx` links to `#waitlist` too, but it's already
  commented out of `app/page.tsx` (no payment gateway yet) — no code
  change needed there, only worth noting so it isn't mistaken for a live
  entry point.
- `public.handle_new_user()` (the Postgres trigger on `auth.users` insert,
  `supabase/schema.sql:53-73`) fires for **every** new `auth.users` row
  regardless of how it was created — email/password signup or a Google
  OAuth first-login both insert into `auth.users`, so both fire the same
  trigger. It reads `business_name`/`plan_id` from
  `raw_user_meta_data`, falling back to `'Mi negocio'`/`'starter'` via
  `coalesce()` when absent (Google OAuth never supplies this metadata).
  So a Google sign-in already gets a `businesses` row — just with
  placeholder values that need correcting, not a missing row that needs
  creating.
- `businesses`/`profiles` RLS policies (`schema.sql:43-49`) only grant
  `select` — there is no `update` policy yet, needed for the
  complete-profile screen to correct those placeholder values.
- `lib/auth-validation.ts`'s `parseSignupPayload` has no terms-acceptance
  field today; the old `WaitlistForm.tsx` had a real "Acepto la Política
  de Privacidad" checkbox that never carried over to `SignupForm.tsx`.
- Google OAuth requires credentials from Google Cloud Console pasted into
  the Supabase dashboard (Authentication → Providers → Google) — the user
  will do this manually with instructions provided during implementation,
  same pattern as the Resend SMTP setup in the password-recovery work.
  Code is written assuming the provider will be enabled; it degrades
  safely (the button errors like any other Supabase auth error) if not
  yet configured when first deployed.
- Out of scope, explicitly deferred to its own future spec: a
  business-qualification engine that recommends a plan based on company
  size/needs ("un verificador de empresas que dicte qué plan se le
  recomienda"). Raised during brainstorming, decoupled because it's a
  separate subsystem (scoring logic, a questionnaire or signal source,
  and it would apply to email signup too, not just Google) that would
  otherwise block this spec indefinitely. This spec's complete-profile
  screen uses plain manual plan selection — the same three fixed plans
  `/registro` already offers.

## Decisions made during brainstorming

1. **Landing CTAs:** every waitlist entry point (`Nav`, `Hero`,
   `FinalCTA`, `PricingCard`) is replaced with a direct link to
   `/registro` (or `/registro?plan=<id>` from pricing cards) or `/login`.
   `WaitlistForm.tsx` is deleted (no remaining consumers). The `waitlist`
   table and `/api/waitlist` route are left completely untouched — real
   opt-in data, no reason to delete it, just nothing in the landing calls
   it anymore.
2. **Hero/FinalCTA:** the embedded multi-step waitlist form is replaced
   with a single button ("Empieza tu prueba gratis" → `/registro`), not a
   duplicated inline signup form. `/registro` already has a polished,
   animated signup flow — no reason to rebuild a second one on the
   landing page.
3. **Nav:** gains two elements — a plain text link "Iniciar sesión"
   (→ `/login`) for returning users, and the existing prominent
   shimmer-button style repurposed as "Empieza gratis" (→ `/registro`).
4. **`/login` layout:** two columns on desktop (left: a real product
   screenshot + a short benefits list with check-icons; right: the
   existing `LoginForm`). Collapses to a single column (form only) on
   mobile. `/registro` stays in its current centered single-column
   layout — only its copy changes (see decision 8).
5. **Google OAuth:** added to both `/login` and `/registro` via
   `supabase.auth.signInWithOAuth({ provider: "google" })` — Supabase's
   native OAuth support, no separate library. One shared
   `GoogleAuthButton` component used in both places.
6. **Google first-login / incomplete business profile:** the trigger
   already creates a `businesses` row with placeholder values
   (`'Mi negocio'`/`'starter'`) on first Google sign-in. A new
   `businesses.needs_onboarding boolean not null default false` column,
   set to `true` by the trigger specifically when
   `new.raw_app_meta_data->>'provider' <> 'email'`, marks that row as
   needing correction. `/auth/oauth-callback` checks this flag after
   establishing the session and redirects to a new `/auth/complete-profile`
   screen (business name + plan, manual selection) when true; that
   screen `UPDATE`s the existing row (not an insert) and clears the flag.
7. **Terms checkbox:** required (submit disabled until checked) on
   `/registro`, with inline links to the already-existing `/terminos` and
   `/privacidad` pages. Client-side validation only, consistent with the
   rest of `SignupForm`'s validation.
8. **Pricing copy:** the founder-price positioning stays, but its copy
   stops referencing "lista de espera"/being early in a queue — reframed
   as a limited-time launch price available to real signups now, not a
   queue-position reward.
9. **Password visibility toggle:** added to every password field (login,
   signup, reset) — a plain visual `type` toggle, no new state or
   security surface (the value is already in the DOM regardless).

## Data model changes (Supabase)

```sql
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

`create or replace function` is safe to re-run — same pattern already
used for this function; the existing trigger definition
(`on_auth_user_created`) doesn't need to change, only the function body.

## Components

**Landing (edits to existing files, no new components):**
- `content/site.ts`: `Plan` type gains `id: "starter" | "pro" | "logistica"`;
  each of the three plan objects gets its matching `id`; each `cta` field
  changes from `"Unirme a la lista de espera"` to `"Iniciar prueba
  gratis"`; `earlyBird.titulo`/`earlyBird.texto`/`preciosNota` copy
  updated per decision 8 (exact wording to be drafted during
  implementation, reviewed against the existing tone of the rest of the
  file).
- `components/Nav.tsx`: `LINKS`/CTA section gains the "Iniciar sesión"
  text link; the existing shimmer button's `href="#waitlist"` becomes
  `href="/registro"` and its label becomes "Empieza gratis".
- `components/Hero.tsx`, `components/FinalCTA.tsx`: remove the
  `<WaitlistForm>` import/usage, replace with a single CTA button styled
  consistently with each section's existing visual weight, linking to
  `/registro`.
- `components/PricingCard.tsx`: `href="#waitlist"` becomes
  `` href={`/registro?plan=${plan.id}`} ``.
- `components/WaitlistForm.tsx`: deleted.
- `components/SecuritySection.tsx`: `href="#waitlist"` link updated to
  `/registro` for correctness even though the component isn't currently
  rendered — cheap to keep consistent, avoids a stale link resurfacing
  broken if the section is ever re-enabled.

**New components:**
- `components/ui/AuthSplitPanel.tsx`: the `/login` left column — a
  product screenshot plus a short benefits list (check-icon + text,
  3-4 items). Takes no props beyond what's needed for the screenshot
  asset; static content, not data-driven.
- `components/GoogleAuthButton.tsx`: `"use client"`, calls
  `supabase.auth.signInWithOAuth({ provider: "google", options: {
  redirectTo: `${SITE_URL}/auth/oauth-callback` } })` on click. Used by
  both `LoginForm` and `SignupForm`, separated from the email/password
  fields by a plain "o" divider (same visual pattern already implied by
  the Alegra reference).
- `app/login/page.tsx`: restructured from `AuthAmbient`/`AuthCard`
  (single centered card) to a two-column layout using the new
  `AuthSplitPanel` on the left and the existing `AuthCard`-wrapped
  `LoginForm` on the right.
- `LoginForm.tsx`: adds `<GoogleAuthButton />` and a show/hide toggle on
  the password `Input`.
- `SignupForm.tsx`: adds the required terms checkbox, `<GoogleAuthButton
  />`, a show/hide toggle on the password `Input`, and reorders its idle
  state so the free-trial line ("14 días gratis, sin tarjeta...") leads,
  with "Crea tu cuenta" as a smaller supporting line — not the reverse
  as it is today.
- `ResetPasswordForm.tsx`: show/hide toggle on both password fields only
  — no Google button here, this screen is a password change, not a login.
- `app/auth/oauth-callback/page.tsx`: client component. On mount, calls
  `supabase.auth.getSession()`. No session → error state with a retry
  link back to `/login`. Session exists → reads the caller's
  `businesses.needs_onboarding` (via the existing `select` RLS policy,
  joined through `profiles`) — `true` redirects to
  `/auth/complete-profile`, `false` redirects to `aureo` with the
  `#access_token=...&refresh_token=...` fragment handoff (same pattern
  `LoginForm`/`SignupForm` already use).
- `app/auth/complete-profile/page.tsx` +
  `components/CompleteProfileForm.tsx`: business name input + the same
  three-plan selector UI already used in `SignupForm`. On submit, calls a
  new `PATCH /api/auth/complete-profile` route (bearer-token
  authenticated like `notify-password-changed`, not a public form — no
  `runGuards`/BotID needed) that runs the `UPDATE` on `businesses`
  (`name`, `plan_id`, `needs_onboarding = false`) scoped to the caller's
  own business via the new RLS update policy. On success, redirects to
  `aureo` the same way the OAuth callback's "already onboarded" branch
  does.

## Error handling

- **Google OAuth fails/is cancelled at Google's screen:** the user never
  reaches `/auth/oauth-callback` — Supabase redirects back to whatever
  `redirectTo` was set with an error in the query string; `LoginForm`/
  `SignupForm` should check for that on mount and show the existing
  generic error-message pattern rather than silently doing nothing.
- **`/auth/oauth-callback` with no session:** error state, link back to
  `/login`. No infinite redirect risk — this page never redirects to
  itself.
- **`/auth/complete-profile` abandoned mid-flow:** `needs_onboarding`
  stays `true` in the database, so the next login (Google or, in theory,
  email — though email accounts are never marked true) routes back through
  `/auth/oauth-callback`'s onboarding check again. No permanent
  half-created state, no data loss.
- **`PATCH /api/auth/complete-profile` with an invalid/expired token:**
  same 401 pattern as `notify-password-changed`.
- **Terms checkbox:** purely client-side gate (disabled submit button),
  matching the rest of `SignupForm`'s validation style — no new
  server-side enforcement needed since the account isn't created without
  it being checked in the UI.

## Testing

- **Vitest:** a payload parser for `PATCH /api/auth/complete-profile`
  (business name + plan_id validation, reusing `PLAN_IDS` from
  `lib/auth-validation.ts`) and its route test, following the existing
  `test/auth-*-route.test.ts` pattern (mock `@/lib/supabase`,
  authenticate via bearer token like `notify-password-changed`'s test).
- **Playwright:** one spec asserting each landing CTA (`Nav`, `Hero`,
  `FinalCTA`, at least one `PricingCard`) navigates to the right URL,
  following the `e2e/forgot-password.spec.ts` pattern (`page.route` isn't
  needed here since these are plain link checks, not form submissions).
- **Manual E2E** (Google OAuth can't be scripted without a real Google
  account in the loop):
  1. Fresh Google sign-in → land on `/auth/complete-profile` → submit →
     confirm the `businesses` row now has the real name/plan and
     `needs_onboarding = false` → confirm landing in `aureo` with a
     working session.
  2. Second login with the same Google account → confirm it skips
     `/auth/complete-profile` and goes straight to `aureo`.
  3. Regular email signup → confirm `needs_onboarding` is `false` from
     the start (trigger regression check).
  4. Terms checkbox blocks submit until checked; links open the right
     pages.
  5. Password show/hide toggles work on all three forms.
  6. Every landing CTA lands on the correct page/plan.

## Risks / cabos sueltos

- Exact wording for the `earlyBird`/`preciosNota` copy rewrite (decision
  8) is drafted during implementation, not fixed verbatim in this spec —
  it should be reviewed against the file's existing tone rather than
  invented in isolation here.
- Google OAuth is genuinely untestable end-to-end until the user
  completes the Google Cloud Console + Supabase dashboard setup — code
  ships correct but unverified against a real Google account until then.
- The business-qualification/plan-recommendation idea raised during
  brainstorming is explicitly out of scope — flagged here so it isn't
  lost, to be brainstormed as its own spec later.
