# Waitlist en 2 pasos + Sección comparativa — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enriquecer el registro de waitlist con nombre/negocio/ciudad en un segundo paso opcional tras el submit de email, y agregar una sección que compare Aureo contra cuaderno/Excel y software genérico.

**Architecture:** El backend gana un handler `PATCH` en la misma ruta `/api/waitlist` que actualiza (no inserta) por email; `WaitlistForm` pasa a una máquina de 3 estados (`email` → `detalle` → `done`) que decide qué UI renderizar; `Hero` escucha ese estado vía callback para ocultar texto que quedaba huérfano tras el submit. La comparación es un componente estático nuevo alimentado por contenido en `content/site.ts`, sin lógica de negocio.

**Tech Stack:** Next.js (App Router) + React 19, Tailwind v4 (tokens `--var()` existentes), `motion/react` para animaciones, `lucide-react` para íconos, Supabase JS client, Vitest (unit), Playwright (e2e).

## Global Constraints

- Todo el copy visible es en español, tono igual al resto del sitio (ver `content/site.ts`).
- No se modifica el schema de Supabase — `nombre`, `negocio`, `ciudad` ya existen en `waitlist` (`supabase/schema.sql`).
- No se agregan dependencias nuevas — usar `lucide-react`, `motion/react`, componentes `ui/` ya presentes.
- Usar los tokens de color existentes (`var(--emerald)`, `var(--terracotta)`, `var(--bronze)`, `var(--text-primary)`, etc.) — no colores hardcodeados nuevos.
- `SecuritySection` sigue deshabilitada — no tocarla.
- Todas las columnas de Supabase se escriben ya recortadas por `parseWaitlistPayload` (`lib/validation.ts`) — reusar esa función, no duplicar validación.

---

### Task 1: Backend — endpoint PATCH para enriquecer el registro

**Files:**
- Modify: `app/api/waitlist/route.ts` (reescritura completa — se extrae un helper de guardas compartido y se agrega `PATCH`)
- Modify: `test/waitlist-route.test.ts` (se agregan casos para `PATCH`)

**Interfaces:**
- Consumes: `parseWaitlistPayload(body): { ok: true; data: WaitlistInput } | { ok: false; error: string } | { ok: false; bot: true }` de `lib/validation.ts` (ya existe, sin cambios). `getSupabaseAdmin()` de `lib/supabase.ts` (sin cambios).
- Produces: `export async function PATCH(request: Request): Promise<Response>` en `app/api/waitlist/route.ts` — body esperado `{ email: string, nombre?: string, negocio?: string, ciudad?: string }`, responde `{ ok: boolean, error?: string }`. Este es el endpoint que `WaitlistForm` (Task 3) llamará.

- [ ] **Step 1: Escribir los tests que fallan para PATCH**

Reemplazar el contenido completo de `test/waitlist-route.test.ts` por:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const insertMock = vi.fn();
const eqMock = vi.fn();
const updateMock = vi.fn(() => ({ eq: eqMock }));
vi.mock("@/lib/supabase", () => ({
  getSupabaseAdmin: () => ({
    from: () => ({ insert: insertMock, update: updateMock }),
  }),
}));

import { POST, PATCH } from "@/app/api/waitlist/route";

function req(body: unknown, method: string = "POST") {
  return new Request("http://localhost/api/waitlist", {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  insertMock.mockReset();
  updateMock.mockClear();
  eqMock.mockReset();
});

describe("POST /api/waitlist", () => {
  it("inserta y responde 200 con email válido", async () => {
    insertMock.mockResolvedValue({ error: null });
    const res = await POST(req({ email: "a@b.com", negocio: "Ferre Sur" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(insertMock).toHaveBeenCalledOnce();
  });

  it("responde 400 con email inválido", async () => {
    const res = await POST(req({ email: "malo" }));
    expect(res.status).toBe(400);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("trata duplicado (código 23505) como éxito sin delatar que el email ya existe", async () => {
    insertMock.mockResolvedValue({ error: { code: "23505" } });
    const res = await POST(req({ email: "a@b.com" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json).not.toHaveProperty("duplicate");
  });

  it("responde 500 si Supabase falla con otro error", async () => {
    insertMock.mockResolvedValue({ error: { code: "XXXXX", message: "boom" } });
    const res = await POST(req({ email: "a@b.com" }));
    expect(res.status).toBe(500);
  });
});

describe("PATCH /api/waitlist", () => {
  it("actualiza los campos presentes y responde 200", async () => {
    eqMock.mockResolvedValue({ error: null });
    const res = await PATCH(req({ email: "a@b.com", nombre: "Ana", ciudad: "Cali" }, "PATCH"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(updateMock).toHaveBeenCalledWith({ nombre: "Ana", ciudad: "Cali" });
    expect(eqMock).toHaveBeenCalledWith("email", "a@b.com");
  });

  it("responde 200 sin tocar la base si no hay campos para actualizar", async () => {
    const res = await PATCH(req({ email: "a@b.com" }, "PATCH"));
    expect(res.status).toBe(200);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("responde 400 con email inválido", async () => {
    const res = await PATCH(req({ email: "malo", nombre: "Ana" }, "PATCH"));
    expect(res.status).toBe(400);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("responde 500 si Supabase falla", async () => {
    eqMock.mockResolvedValue({ error: { code: "XXXXX", message: "boom" } });
    const res = await PATCH(req({ email: "a@b.com", nombre: "Ana" }, "PATCH"));
    expect(res.status).toBe(500);
  });
});
```

- [ ] **Step 2: Correr los tests y verificar que los de PATCH fallan**

Run: `pnpm test -- waitlist-route`
Expected: los 4 tests de `describe("POST ...")` PASAN (no se tocó el route aún), los 4 de `describe("PATCH ...")` FALLAN con `PATCH is not a function` o similar (no existe el export todavía).

- [ ] **Step 3: Reescribir `app/api/waitlist/route.ts` con guardas compartidas + PATCH**

Reemplazar el archivo completo por:

```ts
import { NextResponse } from "next/server";
import { checkBotId } from "botid/server";
import { parseWaitlistPayload } from "@/lib/validation";
import { getSupabaseAdmin } from "@/lib/supabase";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";
import { notifyNewSignup } from "@/lib/email";

function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // Same-origin form posts may omit Origin on some browsers
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

// Guardas comunes a POST y PATCH: origen, content-type, tamaño, bot y rate limit.
// Devuelve la respuesta a retornar si alguna guarda bloquea la solicitud, o
// null si puede continuar.
async function runGuards(request: Request): Promise<NextResponse | null> {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ ok: false, error: "Origen no permitido." }, { status: 403 });
  }

  const ct = request.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 415 });
  }

  // Payload size guard: the legit payload is <1 KB; reject anything bloated
  // before parsing so oversized bodies never reach JSON.parse.
  const len = Number(request.headers.get("content-length") ?? "0");
  if (!Number.isFinite(len) || len > 10_000) {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 413 });
  }

  // BotID: active on Vercel. Locally throws (no OIDC token) — fail open so
  // a BotID outage never blocks real users; rate limiter + honeypot still apply.
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

export async function POST(request: Request) {
  const guardResponse = await runGuards(request);
  if (guardResponse) return guardResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
  }

  const parsed = parseWaitlistPayload(body);
  if (!parsed.ok) {
    if ("bot" in parsed) {
      // Honeypot tripped: pretend success so bots don't learn they were caught.
      return NextResponse.json({ ok: true }, { status: 200 });
    }
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("waitlist").insert(parsed.data);
    if (error) {
      if (error.code === "23505") {
        // Duplicate email: treat as success so users don't enumerate the list.
        return NextResponse.json({ ok: true }, { status: 200 });
      }
      return NextResponse.json({ ok: false, error: "No pudimos registrarte. Intenta de nuevo." }, { status: 500 });
    }

    // Fire-and-forget email notification — never block the response on it.
    notifyNewSignup(parsed.data.email, parsed.data.origen ?? "unknown").catch(() => {});

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "Error del servidor." }, { status: 500 });
  }
}

// Enriquecimiento opcional (paso 2 del formulario): actualiza nombre/negocio/
// ciudad de un registro ya existente. Nunca inserta, nunca notifica por
// correo — es un update silencioso que no debe bloquear al usuario.
export async function PATCH(request: Request) {
  const guardResponse = await runGuards(request);
  if (guardResponse) return guardResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
  }

  const parsed = parseWaitlistPayload(body);
  if (!parsed.ok) {
    if ("bot" in parsed) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const { email, nombre, negocio, ciudad } = parsed.data;
  const updates: Record<string, string> = {};
  if (nombre) updates.nombre = nombre;
  if (negocio) updates.negocio = negocio;
  if (ciudad) updates.ciudad = ciudad;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("waitlist").update(updates).eq("email", email);
    if (error) {
      return NextResponse.json({ ok: false, error: "No pudimos actualizar tu perfil." }, { status: 500 });
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "Error del servidor." }, { status: 500 });
  }
}
```

- [ ] **Step 4: Correr los tests y verificar que todos pasan**

Run: `pnpm test -- waitlist-route`
Expected: 8 tests PASAN (4 de POST + 4 de PATCH).

- [ ] **Step 5: Commit**

```bash
git add app/api/waitlist/route.ts test/waitlist-route.test.ts
git commit -m "feat(api): agrega PATCH /api/waitlist para enriquecer registros existentes"
```

> **Nota post-implementación (seguridad):** una revisión automática detectó que
> el diseño original de PATCH era un IDOR — cualquiera que supiera un email
> registrado podía sobrescribir su nombre/negocio/ciudad sin probar que era el
> dueño del registro. El fix aplicado: `POST` devuelve el `id` (uuid) de la fila
> como `token` en la respuesta, **solo** cuando inserta una fila nueva de verdad
> (nunca en el camino de email duplicado). `PATCH` ahora exige ese `token` en el
> body y filtra el update por `email` **y** `id = token`; sin token no se toca
> la base pero se responde éxito genérico igual (anti-enumeración intacta). La
> forma final de las respuestas es `POST → { ok: true, token?: string }` y
> `PATCH` espera `{ email, token, nombre?, negocio?, ciudad? }`. Task 3 (más
> abajo) ya incorpora este `token` en el cliente — no es un paso opcional.

---

### Task 2: Contenido — sección comparativa en `content/site.ts`

**Files:**
- Modify: `content/site.ts`

**Interfaces:**
- Produces: `export type ComparativaValor = "si" | "no" | "parcial";`, `export type ComparativaFila = { criterio: string; valores: ComparativaValor[] };`, y `site.comparativa: { titulo: string; columnas: string[]; filas: ComparativaFila[] }`. Task 5 (`ComparisonSection.tsx`) consume `site.comparativa` con esta forma exacta.

- [ ] **Step 1: Agregar los tipos nuevos**

En `content/site.ts`, después de la línea `export type FaqItem = { pregunta: string; respuesta: string };` (línea 9), agregar:

```ts
export type ComparativaValor = "si" | "no" | "parcial";
export type ComparativaFila = { criterio: string; valores: ComparativaValor[] };
```

- [ ] **Step 2: Agregar el contenido `comparativa` al objeto `site`**

Insertar, justo después del bloque `modulos: [...] as Module[],` (después de la línea que cierra ese array, antes de `demo: {`):

```ts
  comparativa: {
    titulo: "Por qué Aureo gana donde el cuaderno y el Excel se quedan cortos.",
    columnas: ["Cuaderno o Excel", "Otro software", "Aureo"],
    filas: [
      { criterio: "Ubicar productos sin perder tiempo", valores: ["no", "parcial", "si"] },
      { criterio: "Saber qué rota y qué no", valores: ["no", "parcial", "si"] },
      { criterio: "Despacho rápido y guiado", valores: ["no", "no", "si"] },
      { criterio: "Inventario que siempre cuadra", valores: ["no", "parcial", "si"] },
      { criterio: "Precio para negocio pequeño", valores: ["si", "no", "si"] },
      { criterio: "Empieza a usarse en minutos", valores: ["si", "no", "si"] },
    ] as ComparativaFila[],
  },
```

- [ ] **Step 3: Verificar que el proyecto compila**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores de tipo (el archivo es solo datos tipados, no debería fallar).

- [ ] **Step 4: Commit**

```bash
git add content/site.ts
git commit -m "feat(content): agrega copy de la seccion comparativa vs cuaderno/excel/otro software"
```

---

### Task 3: `WaitlistForm.tsx` — máquina de 2 pasos con mini-formulario de enriquecimiento

**Files:**
- Modify: `components/WaitlistForm.tsx`

**Interfaces:**
- Consumes: `HONEYPOT_FIELD` de `lib/validation.ts` (sin cambios). `POST`/`PATCH /api/waitlist` de Task 1 — `POST` responde `{ ok: true, token?: string }` (el `token` solo viene en un alta nueva genuina, no en duplicado); `PATCH` espera `{ email, token, nombre?, negocio?, ciudad? }` y **requiere** `token` para actualizar algo (sin él, la llamada es un no-op silencioso — ver nota de seguridad al final de Task 1).
- Produces: `export type WaitlistStep = "email" | "detalle" | "done";` y el prop `onStepChange?: (step: WaitlistStep) => void` en `WaitlistForm`. Task 4 (`Hero.tsx`) consume ambos.

- [ ] **Step 1: Reescribir `components/WaitlistForm.tsx`**

```tsx
"use client";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HONEYPOT_FIELD } from "@/lib/validation";

type EmailState = "idle" | "loading" | "success" | "error";
export type WaitlistStep = "email" | "detalle" | "done";

const NEGOCIO_OPCIONES = [
  "Ferretería",
  "Distribuidora",
  "Depósito de construcción",
  "Repuestos",
  "Otro",
];

export function WaitlistForm({
  origen,
  onStepChange,
}: {
  origen: string;
  onStepChange?: (step: WaitlistStep) => void;
}) {
  const honeypotId = useId();
  const [email, setEmail] = useState("");
  const [hp, setHp] = useState("");
  const [emailState, setEmailState] = useState<EmailState>("idle");
  const [msg, setMsg] = useState("");
  const [token, setToken] = useState("");
  const [step, setStepState] = useState<WaitlistStep>("email");

  function setStep(next: WaitlistStep) {
    setStepState(next);
    onStepChange?.(next);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailState("loading");
    setMsg("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, origen, [HONEYPOT_FIELD]: hp }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setEmailState("success");
        setMsg("¡Listo! Cuéntanos un poco más para priorizar tu acceso.");
        setToken(typeof json.token === "string" ? json.token : "");
        setStep("detalle");
      } else {
        setEmailState("error");
        setMsg(json.error ?? "No pudimos registrarte. Intenta de nuevo.");
      }
    } catch {
      setEmailState("error");
      setMsg("Revisa tu conexión e intenta de nuevo.");
    }
  }

  if (step === "done") {
    return (
      <p role="status" className="text-[var(--emerald)] font-semibold">
        ¡Gracias! Te avisaremos apenas lancemos.
      </p>
    );
  }

  if (step === "detalle") {
    return <DetalleForm email={email} token={token} successMessage={msg} onDone={() => setStep("done")} />;
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-2" noValidate>
      {/* Honeypot: visually hidden (not aria-hidden) so it stays out of view for real users
          but remains a labeled, accessible field rather than a focusable element trapped
          inside aria-hidden — bots fill it by name, screen reader users are told to skip it. */}
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
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          type="email"
          required
          placeholder="Tu correo"
          aria-label="Correo electrónico"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 min-h-11"
        />
        <Button type="submit" disabled={emailState === "loading"} aria-busy={emailState === "loading"} className="min-h-11">
          {emailState === "loading" ? "Enviando…" : "Unirme"}
        </Button>
      </div>
      <p
        role="alert"
        aria-live="polite"
        className="min-h-5 text-sm text-[var(--terracotta)]"
      >
        {emailState === "error" ? msg : ""}
      </p>
    </form>
  );
}

function DetalleForm({
  email,
  token,
  successMessage,
  onDone,
}: {
  email: string;
  token: string;
  successMessage: string;
  onDone: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [negocio, setNegocio] = useState("");
  const [negocioOtro, setNegocioOtro] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const negocioFinal = negocio === "Otro" ? negocioOtro : negocio;
    try {
      await fetch("/api/waitlist", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, token, nombre, negocio: negocioFinal, ciudad }),
      });
    } catch {
      // Enriquecimiento opcional: un fallo de red no debe bloquear al usuario.
    } finally {
      setLoading(false);
      onDone();
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <p role="status" className="text-[var(--emerald)] font-semibold">
        {successMessage}
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-2">
        <Input
          type="text"
          placeholder="Tu nombre (opcional)"
          aria-label="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="min-h-11"
        />
        <select
          aria-label="Tipo de negocio"
          value={negocio}
          onChange={(e) => setNegocio(e.target.value)}
          className="h-11 w-full rounded-lg border border-input bg-transparent px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">Tipo de negocio (opcional)</option>
          {NEGOCIO_OPCIONES.map((op) => (
            <option key={op} value={op}>
              {op}
            </option>
          ))}
        </select>
        {negocio === "Otro" && (
          <Input
            type="text"
            placeholder="¿Cuál?"
            aria-label="Especifica tu tipo de negocio"
            value={negocioOtro}
            onChange={(e) => setNegocioOtro(e.target.value)}
            className="min-h-11"
          />
        )}
        <Input
          type="text"
          placeholder="Tu ciudad (opcional)"
          aria-label="Ciudad"
          value={ciudad}
          onChange={(e) => setCiudad(e.target.value)}
          className="min-h-11"
        />
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading} aria-busy={loading} className="min-h-11">
            {loading ? "Guardando…" : "Completar perfil"}
          </Button>
          <button
            type="button"
            onClick={onDone}
            className="text-sm text-[var(--text-secondary)] underline underline-offset-2"
          >
            Ahora no
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Verificar que el proyecto compila**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores de tipo.

- [ ] **Step 3: Commit**

```bash
git add components/WaitlistForm.tsx
git commit -m "feat(waitlist): formulario en 2 pasos con enriquecimiento opcional de perfil"
```

---

### Task 4: `Hero.tsx` — ocultar la nota una vez que el formulario avanza de paso

**Files:**
- Modify: `components/Hero.tsx:1-19` (imports y firma del componente), `components/Hero.tsx:102-112` (bloque del formulario)

**Interfaces:**
- Consumes: `WaitlistStep` y el prop `onStepChange` de `WaitlistForm` (Task 3).

- [ ] **Step 1: Agregar el estado y el import**

En `components/Hero.tsx`, cambiar la línea 2 de:

```tsx
import { motion, useReducedMotion } from "motion/react";
```

a:

```tsx
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
```

y cambiar la línea 5 de:

```tsx
import { WaitlistForm } from "@/components/WaitlistForm";
```

a:

```tsx
import { WaitlistForm, type WaitlistStep } from "@/components/WaitlistForm";
```

Dentro de `export function Hero() {`, después de `const reduce = useReducedMotion();`, agregar:

```tsx
  const [formStep, setFormStep] = useState<WaitlistStep>("email");
```

- [ ] **Step 2: Usar el estado para mostrar/ocultar la nota**

Reemplazar el bloque (líneas 102-112):

```tsx
          <motion.div
            className="mt-7 md:mt-8"
            initial={{ opacity: 0, y: reduce ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reducedTransition(reduce, HERO_TIMING.form)}
          >
            <WaitlistForm origen="hero" />
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              {site.hero.nota}
            </p>
          </motion.div>
```

por:

```tsx
          <motion.div
            className="mt-7 md:mt-8"
            initial={{ opacity: 0, y: reduce ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={reducedTransition(reduce, HERO_TIMING.form)}
          >
            <WaitlistForm origen="hero" onStepChange={setFormStep} />
            {formStep === "email" && (
              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                {site.hero.nota}
              </p>
            )}
          </motion.div>
```

- [ ] **Step 3: Verificar que el proyecto compila**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores de tipo.

- [ ] **Step 4: Commit**

```bash
git add components/Hero.tsx
git commit -m "fix(hero): oculta la nota del formulario una vez que avanza al paso de detalle"
```

---

### Task 5: `ComparisonSection.tsx` — nueva sección + wiring en `page.tsx`

**Files:**
- Create: `components/ComparisonSection.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `site.comparativa` (Task 2), `SectionHeading` de `components/ui/SectionHeading.tsx`, `fadeUp`, `clipReveal`, `VIEWPORT` de `lib/motion.ts` (todos ya existentes, sin cambios).
- Produces: `export function ComparisonSection(): JSX.Element` — sin props.

- [ ] **Step 1: Crear `components/ComparisonSection.tsx`**

```tsx
// components/ComparisonSection.tsx
"use client";
import { motion } from "motion/react";
import { Check, X, Minus } from "lucide-react";
import { site, type ComparativaValor } from "@/content/site";
import { fadeUp, clipReveal, VIEWPORT } from "@/lib/motion";
import { SectionHeading } from "@/components/ui/SectionHeading";

const ICONO: Record<ComparativaValor, { Icon: typeof Check; className: string; texto: string }> = {
  si: { Icon: Check, className: "text-[var(--emerald)]", texto: "Sí" },
  no: { Icon: X, className: "text-[var(--terracotta)]", texto: "No" },
  parcial: { Icon: Minus, className: "text-[var(--text-muted)]", texto: "Parcial" },
};

export function ComparisonSection() {
  return (
    <section className="bg-[var(--bg-base)] py-24">
      <div className="mx-auto max-w-5xl px-5">
        <motion.span
          className="mb-3 inline-block text-sm font-semibold uppercase tracking-widest text-[var(--bronze)]"
          variants={clipReveal}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          La comparación
        </motion.span>

        <SectionHeading className="max-w-2xl">{site.comparativa.titulo}</SectionHeading>

        <motion.div
          className="mt-10 overflow-x-auto"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          <div className="grid min-w-[640px] grid-cols-[1.6fr_1fr_1fr_1fr] gap-y-1">
            <div />
            {site.comparativa.columnas.map((col, i) => (
              <div
                key={col}
                className={`rounded-t-[var(--radius-md)] px-4 py-3 text-center text-sm font-semibold ${
                  i === 2 ? "bg-[var(--bronze)]/10 text-[var(--bronze)]" : "text-[var(--text-secondary)]"
                }`}
              >
                {col}
              </div>
            ))}

            {site.comparativa.filas.map((fila) => (
              <div key={fila.criterio} className="contents">
                <div className="flex items-center border-t border-[var(--border-subtle)] px-4 py-3 text-sm text-[var(--text-primary)]">
                  {fila.criterio}
                </div>
                {fila.valores.map((valor, i) => {
                  const { Icon, className, texto } = ICONO[valor];
                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-center border-t border-[var(--border-subtle)] px-4 py-3 ${
                        i === 2 ? "bg-[var(--bronze)]/10" : ""
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${className}`} aria-hidden />
                      <span className="sr-only">{texto}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Wirear en `app/page.tsx`**

Cambiar (líneas 2-4):

```tsx
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { ProblemSection } from "@/components/ProblemSection";
```

a:

```tsx
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { ProblemSection } from "@/components/ProblemSection";
import { ComparisonSection } from "@/components/ComparisonSection";
```

y cambiar (líneas 27-28):

```tsx
        <ProblemSection />
        <HowItWorks />
```

a:

```tsx
        <ProblemSection />
        <ComparisonSection />
        <HowItWorks />
```

- [ ] **Step 3: Verificar que el proyecto compila y arranca**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores de tipo.

Run: `pnpm dev` (en background) y abrir `http://localhost:3000` — confirmar visualmente que la sección aparece entre "El problema" y "Aureo lo resuelve en tres pasos", que la columna Aureo está resaltada, y que en mobile la tabla se puede desplazar horizontalmente sin romper el layout de la página.

- [ ] **Step 4: Commit**

```bash
git add components/ComparisonSection.tsx app/page.tsx
git commit -m "feat(landing): agrega seccion comparativa Aureo vs cuaderno/excel/otro software"
```

---

### Task 6: E2E — cubrir el flujo de 2 pasos

**Files:**
- Modify: `e2e/waitlist.spec.ts`

**Interfaces:**
- Consumes: los `aria-label` definidos en Task 3 (`Correo electrónico`, `Nombre`, `Tipo de negocio`, `Ciudad`) y los textos de botón (`Unirme`, `Completar perfil`, `Ahora no`).

- [ ] **Step 1: Reescribir `e2e/waitlist.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

test("usuario se une a la waitlist y completa su perfil", async ({ page }) => {
  await page.route("**/api/waitlist", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) })
  );

  await page.goto("/");
  const hero = page.locator("#waitlist");
  await hero.getByLabel("Correo electrónico").fill("prueba@aureo.app");
  await hero.getByRole("button", { name: /^unirme$/i }).click();

  await expect(hero.getByRole("status")).toContainText(/cuéntanos un poco más/i);

  await hero.getByLabel("Nombre").fill("Prueba Usuario");
  await hero.getByLabel("Tipo de negocio").selectOption("Ferretería");
  await hero.getByLabel("Ciudad").fill("Bogotá");
  await hero.getByRole("button", { name: /completar perfil/i }).click();

  await expect(hero.getByRole("status")).toContainText(/te avisaremos apenas lancemos/i);
});

test("usuario puede omitir el paso de detalle", async ({ page }) => {
  await page.route("**/api/waitlist", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) })
  );

  await page.goto("/");
  const hero = page.locator("#waitlist");
  await hero.getByLabel("Correo electrónico").fill("prueba2@aureo.app");
  await hero.getByRole("button", { name: /^unirme$/i }).click();

  await expect(hero.getByRole("status")).toContainText(/cuéntanos un poco más/i);
  await hero.getByRole("button", { name: /ahora no/i }).click();

  await expect(hero.getByRole("status")).toContainText(/te avisaremos apenas lancemos/i);
});

test("muestra error con email inválido devuelto por la API", async ({ page }) => {
  await page.route("**/api/waitlist", (route) =>
    route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ ok: false, error: "Ingresa un correo válido." }) })
  );
  await page.goto("/");
  const hero = page.locator("#waitlist");
  await hero.getByLabel("Correo electrónico").fill("x@y.com");
  await hero.getByRole("button", { name: /^unirme$/i }).click();
  // Scope to #waitlist to avoid conflict with Next.js route announcer (role="alert")
  await expect(hero.getByRole("alert")).toContainText(/correo válido/i);
});
```

- [ ] **Step 2: Correr los tests e2e**

Run: `pnpm e2e -- waitlist`
Expected: 3 tests PASAN.

- [ ] **Step 3: Commit**

```bash
git add e2e/waitlist.spec.ts
git commit -m "test(e2e): cubre el flujo de waitlist en 2 pasos y la opcion de omitirlo"
```
