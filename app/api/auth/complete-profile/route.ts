import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseCompleteProfilePayload } from "@/lib/auth-validation";

export async function PATCH(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
  }

  const parsed = parseCompleteProfilePayload(body);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ ok: false, error: "Error del servidor." }, { status: 500 });
  }

  try {
    // Cliente propio de esta request, con el token del usuario en el header —
    // NUNCA el singleton de getSupabaseAnon() (lib/supabase.ts), que no lleva
    // ningún header por request y es compartido entre requests concurrentes.
    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("business_id")
      .eq("user_id", userData.user.id)
      .single();
    if (profileError || !profile) {
      return NextResponse.json({ ok: false, error: "No encontramos tu negocio." }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from("businesses")
      .update({
        name: parsed.data.businessName,
        plan_id: parsed.data.planId,
        needs_onboarding: false,
      })
      .eq("id", (profile as { business_id: string }).business_id);

    if (updateError) {
      return NextResponse.json({ ok: false, error: "No pudimos actualizar tu negocio." }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("complete-profile route error", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: "Error del servidor." }, { status: 500 });
  }
}
