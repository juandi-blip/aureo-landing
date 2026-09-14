import { NextResponse } from "next/server";
import { parseResendPayload } from "@/lib/auth-validation";
import { getSupabaseAnon } from "@/lib/supabase";
import { runGuards } from "@/lib/api-guards";

const GENERIC_MESSAGE =
  "Si el correo existe, te enviamos un enlace para restablecer tu contraseña.";

export async function POST(request: Request) {
  const guardResponse = await runGuards(request);
  if (guardResponse) return guardResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
  }

  const parsed = parseResendPayload(body);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aureo.com.co";

  try {
    const supabase = getSupabaseAnon();
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${SITE_URL}/auth/reset`,
    });
  } catch (e) {
    // Nunca se refleja al cliente: revelar el error filtraría si el correo existe.
    console.error("forgot-password route error", e instanceof Error ? e.message : e);
  }

  return NextResponse.json({ ok: true, message: GENERIC_MESSAGE }, { status: 200 });
}
