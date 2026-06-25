import { NextResponse } from "next/server";
import { parseWaitlistPayload } from "@/lib/validation";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
  }

  const parsed = parseWaitlistPayload(body);
  if (!parsed.ok) {
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
