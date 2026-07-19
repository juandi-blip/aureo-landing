import { NextResponse } from "next/server";
import { runGuards } from "@/lib/api-guards";
import { isValidEmail } from "@/lib/validation";
import { signDemoToken } from "@/lib/demo-token";

export async function POST(request: Request) {
  const guardResponse = await runGuards(request);
  if (guardResponse) return guardResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
  }

  const b = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const email =
    typeof b.email === "string" ? b.email.normalize("NFC").trim().toLowerCase() : "";
  if (!isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "Correo inválido." }, { status: 400 });
  }

  try {
    const { token } = signDemoToken();
    return NextResponse.json({ ok: true, token }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "Error del servidor." }, { status: 500 });
  }
}
