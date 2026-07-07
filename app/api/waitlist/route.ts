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
    const { data, error } = await supabase
      .from("waitlist")
      .insert(parsed.data)
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") {
        // Duplicate email: treat as success so users don't enumerate the list.
        // Deliberately no `token` here — handing one out on a duplicate would let
        // anyone who merely knows a registered email fetch its ownership token.
        return NextResponse.json({ ok: true }, { status: 200 });
      }
      return NextResponse.json({ ok: false, error: "No pudimos registrarte. Intenta de nuevo." }, { status: 500 });
    }

    // Fire-and-forget email notification — never block the response on it.
    notifyNewSignup(parsed.data.email, parsed.data.origen ?? "unknown").catch(() => {});

    // `token` is this row's own id — an opaque ownership proof the client must
    // send back on PATCH. It is only ever handed out here, on a genuine new
    // insert, so possessing it proves the caller is the original submitter.
    return NextResponse.json({ ok: true, token: data.id }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "Error del servidor." }, { status: 500 });
  }
}

// Enriquecimiento opcional (paso 2 del formulario): actualiza nombre/negocio/
// ciudad de un registro ya existente. Nunca inserta, nunca notifica por
// correo — es un update silencioso que no debe bloquear al usuario.
//
// Requiere `token` (el id devuelto por el POST original) además de `email`:
// sin probar que el caller es quien hizo el alta, cualquiera que supiera un
// correo registrado podría sobrescribir el perfil de otra persona (IDOR).
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

  const b = body as Record<string, unknown>;
  const token = typeof b.token === "string" ? b.token.trim().slice(0, 64) : "";

  const { email, nombre, negocio, ciudad } = parsed.data;
  const updates: Record<string, string> = {};
  if (nombre) updates.nombre = nombre;
  if (negocio) updates.negocio = negocio;
  if (ciudad) updates.ciudad = ciudad;

  if (!token || Object.keys(updates).length === 0) {
    // Sin token no se puede probar propiedad del registro, y sin campos no
    // hay nada que actualizar — en ambos casos se responde éxito genérico
    // sin tocar la base ni delatar cuál de las dos condiciones falló.
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("waitlist")
      .update(updates)
      .eq("email", email)
      .eq("id", token);
    if (error) {
      return NextResponse.json({ ok: false, error: "No pudimos actualizar tu perfil." }, { status: 500 });
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "Error del servidor." }, { status: 500 });
  }
}
