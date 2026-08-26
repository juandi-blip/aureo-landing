# Demo removal + trial pivot — design

Sub-project A of the Aureo ecosystem reorg (order: A → B auth/multi-tenant
foundation → C superadmin panel → D new modules → E full backend). This is
the only sub-project scoped here; B–E are separate future specs.

## Goal

Retire the gated "explora la demo 30 min" flow and the `aureo-demo` project
entirely. Replace it with trial-oriented messaging that funnels into the
existing waitlist (no real signup exists yet — that's sub-project B).
Leave the Vercel/GitHub organization for all three projects impeccable:
`aureo-demo` gone, `aureo` and `aureo-landing` auto-deploying from Git.

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

- `content/site.ts` — rewrite the `demo` section's copy: drop
  `ctaExplorar`, `ctaExplorarNota`, `gateTitulo`, `gateTexto`, `gateBoton`,
  `gateExpiradoTitulo`, `gateExpiradoTexto`. New CTA reads roughly "Inicia
  tu prueba gratis de 14 días" and routes into the same waitlist flow every
  other CTA on the site already uses (`site.finalCta`/`site.planes[].cta`
  pattern) — no new signup surface, consistent with the rest of the
  pre-launch site.
- `components/DemoSection.tsx` — remove `DemoGateModal` usage, the
  `?demo=` query-param read (`readInitialGateReason`), `DEMO_URL`/
  `NEXT_PUBLIC_DEMO_URL`. Keep the video showcase; swap the CTA for the
  waitlist CTA component/pattern used elsewhere on the page.
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
