import { NextResponse } from "next/server";
import { checkBotId } from "botid/server";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";

const MAX_BODY_BYTES = 10_000;

function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // Same-origin form posts may omit Origin on some browsers
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

// Guardas comunes a los endpoints públicos de la landing: origen,
// content-type, tamaño, bot y rate limit. Devuelve la respuesta a retornar
// si alguna guarda bloquea la solicitud, o null si puede continuar.
export async function runGuards(request: Request): Promise<Response | null> {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ ok: false, error: "Origen no permitido." }, { status: 403 });
  }

  const ct = request.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 415 });
  }

  const len = Number(request.headers.get("content-length") ?? "0");
  if (!Number.isFinite(len) || len > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 413 });
  }

  // BotID: active on Vercel. Locally throws (no OIDC token) — fail open so
  // a BotID outage never blocks real users; rate limiter still applies.
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
