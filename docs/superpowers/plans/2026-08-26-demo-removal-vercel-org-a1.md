# Demo Removal + Vercel Org Cleanup (Sub-project A1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the `aureo-demo` project (folder, Vercel project, GitHub repo) and its dead integration code in `aureo-landing`/`aureo`, then link `aureo` and `aureo-landing` to their GitHub repos in Vercel for auto-deploy.

**Architecture:** Three independent repos (`aureo`, `aureo-landing`, `aureo-demo`), each its own git repo + Vercel project under Vercel team `team_Xc2TNRGYd8YI1dQUNtcPi4Qd`. `aureo-demo` is a byte-identical fork of `aureo` created by pushing `aureo`'s git history to a second folder — it is not independently maintained code. The only integration surface to remove lives in `aureo-landing` (the code that issued a 30-min demo token and linked to `aureo-demo`). `aureo` itself keeps its `demo-gate.js` access-control script untouched — it's the only login mechanism until the separate auth sub-project (B) ships.

**Tech Stack:** Next.js 16 / TypeScript (`aureo-landing`), vanilla JS SPA (`aureo`), Vercel CLI 54.20.0, GitHub CLI 2.96.0, git.

**Spec:** `docs/superpowers/specs/2026-08-26-demo-removal-trial-pivot-design.md` (sub-project A1 section)

## Global Constraints

- Do NOT touch `aureo/demo-gate.js`, `aureo/api/verify-demo-token.js`, or `aureo/api/verify-admin-key.js` logic — only add a TODO comment (Task 5). They remain the only access control into `aureo` until sub-project B.
- Do NOT remove `NEXT_PUBLIC_DEMO_VIDEO_URL` anywhere — it's the Vercel Blob video CDN URL, unrelated to the demo-gate/token flow, and stays in use.
- Every deletion of remote resources (Vercel project, GitHub repo) requires the human operator to have confirmed already (this was confirmed in brainstorming) — still, announce each irreversible command before running it.
- No custom domain work — out of scope, no domain owned yet.

---

### Task 1: Remove `aureo-demo` locally and detach it from `aureo`

**Files:**
- Delete: `D:\juandiplay\aureoapp\aureo-demo\` (entire folder, including its `.git`)
- Modify: `aureo`'s git config — remove the `demo` remote

**Interfaces:** None (filesystem/git state only, no code).

- [ ] **Step 1: Confirm nothing uncommitted is only saved in `aureo-demo`**

```bash
cd "D:/juandiplay/aureoapp/aureo-demo" && git status --short
```

Expected: clean (no output) or only files also present in `aureo` (it's a fork of `aureo`'s history). If it shows unique uncommitted work, STOP and ask the user before deleting.

- [ ] **Step 2: Remove the `demo` remote from `aureo`**

```bash
cd "D:/juandiplay/aureoapp/aureo" && git remote remove demo && git remote -v
```

Expected: output lists only `origin` (→ `https://github.com/juandi-blip/Aureo.git`), no `demo` line.

- [ ] **Step 3: Delete the local `aureo-demo` folder**

```bash
rm -rf "D:/juandiplay/aureoapp/aureo-demo"
```

Expected: `ls "D:/juandiplay/aureoapp"` no longer lists `aureo-demo`.

- [ ] **Step 4: Commit the remote removal in `aureo`**

```bash
cd "D:/juandiplay/aureoapp/aureo" && git add -A && git status --short
```

Expected: likely empty (removing a remote isn't a tracked file change — `git remote` config lives in `.git/config`, not version-controlled). If `git status --short` shows nothing to commit, skip committing for this task; that's correct, not a failure.

---

### Task 2: Delete the `aureo-demo` Vercel project and GitHub repo

**Files:** None (remote infrastructure only).

**Interfaces:** None.

- [ ] **Step 1: Announce and delete the Vercel project**

Tell the user: "Borrando el proyecto Vercel `aureo-demo` (prj_1bEcaW8HVSaB9R67JUjxNxPnTFVt) — irreversible." Then run:

```bash
cd "D:/juandiplay/aureoapp" && vercel project rm aureo-demo --yes --scope team_Xc2TNRGYd8YI1dQUNtcPi4Qd
```

Expected: CLI reports the project was removed.

- [ ] **Step 2: Verify it's gone**

Call the `mcp__plugin_vercel_vercel__list_projects` tool with `teamId: "team_Xc2TNRGYd8YI1dQUNtcPi4Qd"`.
Expected: `aureo-demo` no longer appears in the `projects` array.

- [ ] **Step 3: Ensure `gh` has the `delete_repo` scope**

```bash
gh auth status
```

If the scopes list does not include `delete_repo`, tell the user you need them to authorize it (this opens a browser device-flow confirmation you cannot complete headlessly):

```bash
gh auth refresh -h github.com -s delete_repo
```

Wait for the user to confirm they completed the browser step before continuing.

- [ ] **Step 4: Announce and delete the GitHub repo**

Tell the user: "Borrando el repo GitHub juandi-blip/aureo-demo — irreversible." Then run:

```bash
gh repo delete juandi-blip/aureo-demo --yes
```

Expected: CLI confirms deletion.

- [ ] **Step 5: Verify it's gone**

```bash
gh repo view juandi-blip/aureo-demo 2>&1
```

Expected: an error like "Could not resolve to a Repository" (404) — confirms deletion.

---

### Task 3: Remove the demo-token backend (`aureo-landing`)

**Files:**
- Delete: `app/api/demo-token/route.ts`
- Delete: `lib/demo-token.ts`
- Delete: `test/demo-token.test.ts`
- Delete: `test/demo-token-route.test.ts`
- Delete: `e2e/demo-gate.spec.ts`
- Modify: `instrumentation-client.ts:9` — remove the `/api/demo-token` BotID protect entry
- Modify: `.env.local.example` — remove `DEMO_TOKEN_SECRET` and `NEXT_PUBLIC_DEMO_URL` lines, keep `NEXT_PUBLIC_DEMO_VIDEO_URL`

**Interfaces:** None consumed. Nothing downstream in this repo imports `signDemoToken`/`verifyDemoToken` outside the deleted files (confirmed by grep — only `app/api/demo-token/route.ts` and the two test files reference them).

- [ ] **Step 1: Delete the demo-token files**

```bash
cd "D:/juandiplay/aureoapp/aureo-landing"
rm -rf app/api/demo-token
rm lib/demo-token.ts
rm test/demo-token.test.ts test/demo-token-route.test.ts
rm e2e/demo-gate.spec.ts
```

- [ ] **Step 2: Remove the BotID protect entry**

In `instrumentation-client.ts`, change:

```typescript
initBotId({
  protect: [
    { path: "/api/waitlist", method: "POST" },
    { path: "/api/waitlist", method: "PATCH" },
    { path: "/api/demo-token", method: "POST" },
  ],
});
```

to:

```typescript
initBotId({
  protect: [
    { path: "/api/waitlist", method: "POST" },
    { path: "/api/waitlist", method: "PATCH" },
  ],
});
```

- [ ] **Step 3: Clean `.env.local.example`**

Remove the `NEXT_PUBLIC_DEMO_URL` line (currently line 15) and the `DEMO_TOKEN_SECRET` line (currently line 24). Keep `NEXT_PUBLIC_DEMO_VIDEO_URL` untouched.

- [ ] **Step 4: Verify no dangling references remain**

```bash
grep -rn "demo-token\|DEMO_TOKEN_SECRET\|signDemoToken\|verifyDemoToken" app lib test e2e instrumentation-client.ts .env.local.example 2>&1
```

Expected: no output.

- [ ] **Step 5: Run the test suite**

```bash
pnpm vitest run
```

Expected: passes (no test references the deleted files anymore, since they were deleted in Step 1).

- [ ] **Step 6: Commit**

Only the files this task touched — do not use `git add -A` (the repo has
unrelated pre-existing uncommitted files that must not be swept in):

```bash
git add app/api/demo-token lib/demo-token.ts test/demo-token.test.ts \
  test/demo-token-route.test.ts e2e/demo-gate.spec.ts \
  instrumentation-client.ts .env.local.example
git status --short
```

Confirm the staged list matches exactly the files above (deletions +
2 modifications) before committing:

```bash
git commit -m "$(cat <<'EOF'
feat: remove demo-token backend and its tests

The 30-min gated demo flow is retired along with aureo-demo. Real
signup/trial replaces it in a later sub-project.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Remove the demo-gate UI (`aureo-landing`)

**Files:**
- Delete: `components/DemoGateModal.tsx`
- Modify: `components/Hero.tsx`
- Modify: `components/DemoSection.tsx`
- Modify: `content/site.ts` — trim the `demo` object's gate-only fields

**Interfaces:**
- Produces: `DemoSection` and `Hero` no longer import `DemoGateModal` or read `process.env.NEXT_PUBLIC_DEMO_URL`. `site.demo` keeps `eyebrow`, `titulo`, `texto`, `badges`, `placeholder` — drops `ctaExplorar`, `ctaExplorarNota`, `gateTitulo`, `gateTexto`, `gateBoton`, `gateExpiradoTitulo`, `gateExpiradoTexto`.

- [ ] **Step 1: Delete the modal component**

```bash
cd "D:/juandiplay/aureoapp/aureo-landing"
rm components/DemoGateModal.tsx
```

- [ ] **Step 2: Trim `content/site.ts`'s `demo` object**

Change:

```typescript
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

to:

```typescript
  demo: {
    eyebrow: "Producto real, no un mockup.",
    titulo: "Mira la inteligencia logística en acción.",
    texto: "El mapa de calor y el análisis ABC son lo que separa a Aureo de un POS común.",
    badges: ["Mapa de calor en vivo", "Picking guiado", "Análisis ABC / Pareto"],
    placeholder: "Demo en video — próximamente.",
  },
```

- [ ] **Step 3: Rewrite `components/DemoSection.tsx`**

Remove the `DemoGateModal` import, the `DEMO_URL` constant, `readInitialGateReason`, the `gateReason`/`gateOpen` state, and the CTA block + modal at the bottom. The file's import block changes from:

```typescript
"use client";
import { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";
import { site } from "@/content/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { fadeUp, VIEWPORT } from "@/lib/motion";
import { GrainOverlay } from "@/components/ui/GrainOverlay";
import { SpotlightGlow, useSpotlight } from "@/components/ui/Spotlight";
import { DemoGateModal, type GateReason } from "@/components/DemoGateModal";

const VIDEO_SRC =
  process.env.NEXT_PUBLIC_DEMO_VIDEO_URL || "/aureo-video.mp4";

const DEMO_URL = process.env.NEXT_PUBLIC_DEMO_URL || "";

// Reads the `?demo=` param (set when aureo-demo redirects back after a
// missing/expired gate session) once, on initial mount.
function readInitialGateReason(): GateReason {
  if (typeof window === "undefined") return null;
  const demoParam = new URLSearchParams(window.location.search).get("demo");
  return demoParam === "required" || demoParam === "expired" ? demoParam : null;
}

export function DemoSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const spotlight = useSpotlight();
  const [gateReason, setGateReason] = useState<GateReason>(readInitialGateReason);
  const [gateOpen, setGateOpen] = useState(() => readInitialGateReason() !== null);
```

to:

```typescript
"use client";
import { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";
import { site } from "@/content/site";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { fadeUp, VIEWPORT } from "@/lib/motion";
import { GrainOverlay } from "@/components/ui/GrainOverlay";
import { SpotlightGlow, useSpotlight } from "@/components/ui/Spotlight";

const VIDEO_SRC =
  process.env.NEXT_PUBLIC_DEMO_VIDEO_URL || "/aureo-video.mp4";

export function DemoSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const spotlight = useSpotlight();
```

And near the end of the component, remove the CTA block and modal — from:

```typescript
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
      </div>
    </section>
  );
```

to:

```typescript
      </div>
    </section>
  );
```

(i.e. the section ends right after the video-frame `motion.div` closes — no CTA block, no modal. A2 adds the real trial CTA here later.)

- [ ] **Step 4: Rewrite `components/Hero.tsx`**

Remove the `DemoGateModal` import, `DEMO_URL` constant, `gateOpen` state, and the "o explora la demo →" button + modal render.

Change:

```typescript
import { ParallaxLayer } from "@/components/ui/ParallaxLayer";
import { DemoGateModal } from "@/components/DemoGateModal";

const DEMO_URL = process.env.NEXT_PUBLIC_DEMO_URL || "";

export function Hero() {
  const reduce = useReducedMotion();
  const [formStep, setFormStep] = useState<WaitlistStep>("email");
  const [gateOpen, setGateOpen] = useState(false);
```

to:

```typescript
import { ParallaxLayer } from "@/components/ui/ParallaxLayer";

export function Hero() {
  const reduce = useReducedMotion();
  const [formStep, setFormStep] = useState<WaitlistStep>("email");
```

Change:

```typescript
            {formStep === "email" && DEMO_URL && (
              <button
                type="button"
                onClick={() => setGateOpen(true)}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--bronze)] underline underline-offset-2 hover:text-[var(--bronze)]/80"
              >
                o explora la demo →
              </button>
            )}
          </div>
        </div>
```

to:

```typescript
          </div>
        </div>
```

Change:

```typescript
      </div>
      <DemoGateModal
        open={gateOpen}
        onOpenChange={setGateOpen}
        demoUrl={DEMO_URL}
        reason={null}
      />
    </section>
  );
}
```

to:

```typescript
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Verify no dangling references remain**

```bash
grep -rn "DemoGateModal\|NEXT_PUBLIC_DEMO_URL\b" components content app --include="*.ts" --include="*.tsx" 2>&1
```

Expected: no output.

- [ ] **Step 6: Type-check and build**

```bash
pnpm exec tsc --noEmit
pnpm build
```

Expected: both succeed with no errors.

- [ ] **Step 7: Commit**

Only the files this task touched — do not use `git add -A`:

```bash
git add components/Hero.tsx components/DemoSection.tsx content/site.ts
git status --short
```

(`DemoGateModal.tsx` was already staged as a deletion by `git rm` behavior
once removed — if `git status --short` doesn't show it, run
`git add components/DemoGateModal.tsx` too before committing.)

```bash
git commit -m "$(cat <<'EOF'
feat: remove demo-gate UI (DemoGateModal, gated CTAs)

DemoSection keeps its product video showcase without a CTA for now;
the trial CTA lands in a later sub-project once real signup exists.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Mark `demo-gate.js` as interim in `aureo`

**Files:**
- Modify: `demo-gate.js:1-13` (top comment block)

**Interfaces:** None — comment-only change, no behavior change.

- [ ] **Step 1: Add a TODO to the top comment**

In `D:\juandiplay\aureoapp\aureo\demo-gate.js`, change the opening comment from:

```javascript
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
```

to:

```javascript
// AUREO — GATE de la demo pública: exige un token válido (emitido por la
// landing tras capturar el email del visitante) antes de dejar cargar la
// app, y limita cada sesión a 30 minutos.
//
// TODO(sub-project B): este es hoy el ÚNICO control de acceso a la app —
// el bypass #admin_key= es el mecanismo interino de Leif/Juan. Se
// reemplaza por login/registro real (Supabase Auth) en sub-project B.
// No borrar sin reemplazo funcional.
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
```

- [ ] **Step 2: Verify the file still parses**

```bash
cd "D:/juandiplay/aureoapp/aureo" && node --check demo-gate.js
```

Expected: no output (exit 0 = valid syntax).

- [ ] **Step 3: Commit**

```bash
git add demo-gate.js
git commit -m "$(cat <<'EOF'
docs: mark demo-gate.js as the interim access control

Notes that this is the only login mechanism until sub-project B
(Supabase auth) replaces it, so it isn't mistaken for finished design.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Connect `aureo` and `aureo-landing` to Git in Vercel

**Files:** None (Vercel project configuration only).

**Interfaces:** None.

- [ ] **Step 1: Push local commits so Vercel has something to build**

`aureo-landing` has unrelated pre-existing uncommitted files (from before
this plan) that are not part of this work — leave them uncommitted, they
don't block a push of the commits this plan made:

```bash
cd "D:/juandiplay/aureoapp/aureo-landing" && git log --oneline origin/main..main
git push origin main
cd "D:/juandiplay/aureoapp/aureo" && git log --oneline origin/main..main
git push origin main
```

Expected: both push cleanly (ask the user first if either remote branch is
not `main`, diverges unexpectedly, or the `log` shows commits you didn't
make in this plan — don't push someone else's unreviewed work).

- [ ] **Step 2: Connect `aureo-landing` to its GitHub repo**

```bash
cd "D:/juandiplay/aureoapp/aureo-landing" && vercel git connect --non-interactive
```

Expected: CLI reports it connected the project to `juandi-blip/aureo-landing`.

- [ ] **Step 3: Connect `aureo` to its GitHub repo**

```bash
cd "D:/juandiplay/aureoapp/aureo" && vercel git connect --non-interactive
```

Expected: CLI reports it connected the project to `juandi-blip/Aureo`.

- [ ] **Step 4: Verify both projects show a Git link**

Call `mcp__plugin_vercel_vercel__get_project` for `prj_avXJKQwzfdtzU0GoHMIa01VBNUOQ` and for `prj_l5u78z3AYVIaT9yZAZTGR6kTAyV5`, both with `teamId: "team_Xc2TNRGYd8YI1dQUNtcPi4Qd"`.
Expected: both responses now report a Git connection (compare against the earlier `list_projects` call where both had `"link": null`).

- [ ] **Step 5: Confirm auto-deploy fires**

Check `mcp__plugin_vercel_vercel__list_deployments` for each project (`projectId` + same `teamId`) filtered `since` the push timestamp from Step 1.
Expected: a new deployment appears for each project shortly after the push, with `target: "production"`.

---

### Task 7: Final sweep

**Files:** None — verification only.

**Interfaces:** None.

- [ ] **Step 1: Repo-wide grep for anything missed**

```bash
cd "D:/juandiplay/aureoapp/aureo-landing"
grep -rn "aureo-demo\|NEXT_PUBLIC_DEMO_URL\|DEMO_TOKEN_SECRET" . \
  --include="*.ts" --include="*.tsx" --include="*.md" --include=".env*" \
  --exclude-dir=node_modules --exclude-dir=docs 2>&1
```

Expected: no output (the `docs/` exclusion is intentional — historical spec/plan files that mention the old demo flow are left as-is; they're a record, not live code).

- [ ] **Step 2: Confirm `aureo-demo` is unreachable**

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://aureo-demo-six.vercel.app
```

Expected: not `200` (404 or DNS/connection failure — the deployment no longer exists).

- [ ] **Step 3: Report back to the user**

Summarize: `aureo-demo` fully removed (folder, Vercel project, GitHub repo); demo-gate UI/backend removed from the landing; `demo-gate.js` in `aureo` untouched and marked interim; both remaining Vercel projects now auto-deploy from Git. Note that sub-project B (auth) is the next brainstorm, and A2 (waitlist → real trial CTA rewrite) follows it.
