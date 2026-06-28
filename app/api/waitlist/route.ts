import { NextResponse } from "next/server";
import { checkBotId } from "botid/server";
import { parseWaitlistPayload } from "@/lib/validation";
import { getSupabaseAdmin } from "@/lib/supabase";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";

// Reject cross-site requests. Same-origin form posts send an Origin matching
// the host; tools that omit Origin fall through to the rate limiter instead.
function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
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

  // BotID: active on Vercel. Locally it throws (no OIDC token), so fail open —
  // a BotID outage must not block real users; the other guards still apply.
  try {
    const bot = await checkBotId();
    if (bot.isBot) {
      return NextResponse.json({ ok: false, error: "Acceso denegado." }, { status: 403 });
    }
  } catch (e) {
    console.error("botid check skipped:", e);
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
    // Honeypot tripped: pretend success so bots don't learn they were caught.
    if ("bot" in parsed) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("waitlist").insert(parsed.data);
    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ ok: true, duplicate: true }, { status: 200 });
      }
      console.error("waitlist insert error:", error);
      return NextResponse.json({ ok: false, error: "No pudimos registrarte. Intenta de nuevo." }, { status: 500 });
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("waitlist route error:", e);
    return NextResponse.json({ ok: false, error: "Error del servidor." }, { status: 500 });
  }
}
