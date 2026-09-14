import { NextResponse } from "next/server";
import { parseResendPayload } from "@/lib/auth-validation";
import { getSupabaseAnon } from "@/lib/supabase";
import { runGuards } from "@/lib/api-guards";

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

  try {
    const supabase = getSupabaseAnon();
    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aureo.com.co";
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: parsed.data.email,
      options: { emailRedirectTo: `${SITE_URL}/auth/confirm` },
    });

    if (error) {
      return NextResponse.json(
        { ok: false, error: "No pudimos reenviar el correo. Intenta de nuevo en unos minutos." },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("resend route error", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: "Error del servidor." }, { status: 500 });
  }
}
