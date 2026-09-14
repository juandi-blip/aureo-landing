import { NextResponse } from "next/server";
import { getSupabaseAnon } from "@/lib/supabase";
import { notifyPasswordChanged } from "@/lib/email";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAnon();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user?.email) {
      return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
    }

    await notifyPasswordChanged(data.user.email);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error("notify-password-changed route error", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: "Error del servidor." }, { status: 500 });
  }
}
