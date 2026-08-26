import { NextResponse } from "next/server";
import { parseSignupPayload } from "@/lib/auth-validation";
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

  const parsed = parseSignupPayload(body);
  if (!parsed.ok) {
    if ("bot" in parsed) {
      // No delatamos la detección de bot: mismo shape de error genérico.
      return NextResponse.json({ ok: false, error: "No pudimos crear tu cuenta." }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const { email, password, businessName, planId } = parsed.data;

  try {
    const supabase = getSupabaseAnon();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { business_name: businessName, plan_id: planId } },
    });

    if (error) {
      const status = error.status === 422 || /already registered/i.test(error.message) ? 409 : 400;
      const message =
        status === 409
          ? "Ese correo ya tiene una cuenta. Intenta iniciar sesión."
          : "No pudimos crear tu cuenta. Verifica los datos e intenta de nuevo.";
      return NextResponse.json({ ok: false, error: message }, { status });
    }

    if (!data.session) {
      // Confirmación de correo requerida por la config del proyecto: no hay
      // sesión inmediata. El caller debe mostrar "revisa tu correo".
      return NextResponse.json(
        { ok: true, requiresEmailConfirmation: true },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        },
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("signup route error", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: "Error del servidor." }, { status: 500 });
  }
}
