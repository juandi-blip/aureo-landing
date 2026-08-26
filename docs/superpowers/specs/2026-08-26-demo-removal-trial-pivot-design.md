# Demo removal + trial pivot — design

Sub-project A of the Aureo ecosystem reorg. **Reordered**: the site is
launching now, not staying in a waitlist pre-launch phase — every CTA
across the whole landing (not just the demo section) must lead to real
signup + 14-day trial, which requires sub-project B (Supabase auth) to
exist first. Split accordingly:

- **A1** (this spec, no dependencies — done now): delete `aureo-demo`,
  clean up Vercel/GitHub org for all three projects.
- **A2** (blocked on B): replace the waitlist entirely — every CTA
  (`site.ts` demo/hero/finalCta/planes[].cta, `WaitlistForm` and its API
  route) — with real signup/trial. Written as its own spec once B lands.

Order: A1 now → B (auth/multi-tenant foundation) → A2 → C (superadmin
panel) → D (new modules) → E (full backend).

## Goal (A1, scoped here)

Retire the gated "explora la demo 30 min" flow and the `aureo-demo`
project entirely — folder, Vercel project, GitHub repo, git remote.
Leave the Vercel/GitHub organization for all three projects impeccable:
`aureo-demo` gone, `aureo` and `aureo-landing` auto-deploying from Git.
The demo section's copy/CTA rewrite moves to A2 (needs somewhere real to
send users once the waitlist is gone) — see note in Scope below.

## Context / key finding

`aureo-demo` is not an independent app — it's a near-byte-identical copy of
`aureo`, originally created by pushing `aureo`'s own git history to a
second local folder (`aureo`'s `.git/config` has a `demo` remote pointing at
`../aureo-demo`). Both repos ship the same `demo-gate.js`.

`demo-gate.js` (loaded first, before `auth.js`, in `aureo/index.html`) is
currently the **only access control `aureo` has**. It requires either:
- a `?token=` issued by the landing's `/api/demo-token` route (30-min public
  demo session), or
- a `#admin_key=` fragment verified via `/api/verify-admin-key` (this is
  how Leif and Juan currently get into `aureo` — a 30-day bypass session).

Once past the gate, `auth.js` auto-logs in as `admin` — there is no real
login anywhere yet. Because of this, **`demo-gate.js`,
`verify-demo-token.js`, and `verify-admin-key.js` are NOT removed in this
sub-project** — they remain the only way in until sub-project B ships real
Supabase-backed auth. The admin-key bypass keeps working for Leif/Juan in
the interim.

## Scope

### `aureo-landing`

Interim only — this is NOT the final trial copy. The waitlist itself
still exists after A1 (it's only removed in A2, once B gives it somewhere
real to send people). The goal here is just to stop pointing at the
deleted `aureo-demo` target; the section falls back to the same waitlist
CTA pattern used everywhere else on the site for now, and gets rewritten
again in A2 alongside every other CTA.

- `content/site.ts` — drop the gate-specific `demo` fields (`ctaExplorar`,
  `ctaExplorarNota`, `gateTitulo`, `gateTexto`, `gateBoton`,
  `gateExpiradoTitulo`, `gateExpiradoTexto`) since they describe a flow
  that no longer exists. Leave `eyebrow`/`titulo`/`texto`/`badges`
  (still-accurate product framing) in place.
- `components/DemoSection.tsx` — remove `DemoGateModal` usage, the
  `?demo=` query-param read (`readInitialGateReason`), `DEMO_URL`/
  `NEXT_PUBLIC_DEMO_URL`. Keep the video showcase; swap the CTA for
  whatever waitlist CTA component/pattern the rest of the page already
  uses (temporary, superseded by A2).
- `components/Hero.tsx` — remove `DemoGateModal` import/usage, `DEMO_URL`,
  the "o explora la demo →" link.
- Delete: `components/DemoGateModal.tsx`, `app/api/demo-token/route.ts`,
  `lib/demo-token.ts`.
- Grep sweep for `NEXT_PUBLIC_DEMO_URL`, `NEXT_PUBLIC_DEMO_VIDEO_URL`, and
  any other `demo` reference (env samples, README, AGENTS/CLAUDE docs) and
  clean up what's dead.

### `aureo`

- No functional code changes. `demo-gate.js`, `demo-banner.js`,
  `demo-data.js`, `api/verify-demo-token.js`, `api/verify-admin-key.js` stay
  as-is — they're the only access path until sub-project B.
- Add a short `TODO` comment in `demo-gate.js` noting it gets replaced by
  real auth in sub-project B, so it isn't mistaken for finished/permanent
  design later.
- Remove the `demo` git remote (pointed at the now-deleted local
  `aureo-demo` folder).

### `aureo-demo` — full removal

- Delete local folder (incl. `.git`).
- Delete Vercel project `aureo-demo` (`prj_1bEcaW8HVSaB9R67JUjxNxPnTFVt`).
- Delete GitHub repo `juandi-blip/aureo-demo`.

### Vercel/GitHub organization

- Link Vercel project `aureo` (`prj_l5u78z3AYVIaT9yZAZTGR6kTAyV5`) to
  GitHub repo `juandi-blip/Aureo` for auto-deploy on push + PR previews.
- Link Vercel project `aureo-landing` (`prj_avXJKQwzfdtzU0GoHMIa01VBNUOQ`)
  to GitHub repo `juandi-blip/aureo-landing` for the same.
- No custom domain yet (none owned) — stays on `*.vercel.app` URLs for
  both; domain wiring is a future task once a domain is purchased.

## Out of scope (future sub-projects)

- Real signup/login (sub-project B).
- Removing/replacing `demo-gate.js` itself (sub-project B).
- Removing the waitlist and rewriting every CTA to real trial signup
  (sub-project A2, blocked on B).
- Superadmin panel (sub-project C).
- Custom domain purchase/wiring.

## Testing

- `pnpm build` in `aureo-landing` passes.
- Manual visual check of the demo section + Hero on desktop/mobile.
- Grep confirms zero remaining references to `aureo-demo`, `DEMO_URL`,
  `NEXT_PUBLIC_DEMO_URL`, `NEXT_PUBLIC_DEMO_VIDEO_URL`, `DemoGateModal`.
- After Git-linking, a trivial push to each repo's default branch confirms
  Vercel auto-deploys.
- Confirm `aureo-demo` no longer resolves on Vercel and the GitHub repo is
  gone.
