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

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ ok: false, error: "Origen no permitido." }, { status: 403 });
  }

  // Content-Type guard
  const ct = request.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 415 });
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
