import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { parseWaitlistPayload } from "@/lib/validation";
import { getSupabaseAdmin } from "@/lib/supabase";
import { runGuards } from "@/lib/api-guards";
import { notifyNewSignup } from "@/lib/email";

export async function POST(request: Request) {
  const guardResponse = await runGuards(request);
  if (guardResponse) return guardResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
  }

  const parsed = parseWaitlistPayload(body);
  if (!parsed.ok) {
    if ("bot" in parsed) {
      // Honeypot tripped: fingimos éxito Y devolvemos un token señuelo para que
      // la respuesta sea byte-a-byte indistinguible de un alta real (si no, la
      // ausencia de `token` delataría que el bot fue detectado).
      return NextResponse.json({ ok: true, token: randomUUID() }, { status: 200 });
    }
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("waitlist")
      .insert(parsed.data)
      .select("id")
      .single();
    if (error) {
      if (error.code === "23505") {
        // Email duplicado: respondemos éxito con un token SEÑUELO aleatorio (no
        // el id real). Así la respuesta es indistinguible de un alta nueva y no
        // se puede enumerar la lista. El PATCH con ese token hará `.eq("id", …)`
        // contra un UUID inexistente → 0 filas → ok silencioso, sin IDOR.
        return NextResponse.json({ ok: true, token: randomUUID() }, { status: 200 });
      }
      return NextResponse.json({ ok: false, error: "No pudimos registrarte. Intenta de nuevo." }, { status: 500 });
    }

    // Fire-and-forget email notification — never block the response on it.
    notifyNewSignup(parsed.data.email, parsed.data.origen ?? "unknown").catch(() => {});

    // `token` is this row's own id — an opaque ownership proof the client must
    // send back on PATCH. It is only ever handed out here, on a genuine new
    // insert, so possessing it proves the caller is the original submitter.
    return NextResponse.json({ ok: true, token: data.id }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "Error del servidor." }, { status: 500 });
  }
}

// Enriquecimiento opcional (paso 2 del formulario): actualiza nombre/negocio/
// ciudad de un registro ya existente. Nunca inserta, nunca notifica por
// correo — es un update silencioso que no debe bloquear al usuario.
//
// Requiere `token` (el id devuelto por el POST original) además de `email`:
// sin probar que el caller es quien hizo el alta, cualquiera que supiera un
// correo registrado podría sobrescribir el perfil de otra persona (IDOR).
export async function PATCH(request: Request) {
  const guardResponse = await runGuards(request);
  if (guardResponse) return guardResponse;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida." }, { status: 400 });
  }

  const parsed = parseWaitlistPayload(body);
  if (!parsed.ok) {
    if ("bot" in parsed) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const token = typeof b.token === "string" ? b.token.trim().slice(0, 64) : "";

  const { email, nombre, negocio, ciudad } = parsed.data;
  const updates: Record<string, string> = {};
  if (nombre) updates.nombre = nombre;
  if (negocio) updates.negocio = negocio;
  if (ciudad) updates.ciudad = ciudad;

  if (!token || Object.keys(updates).length === 0) {
    // Sin token no se puede probar propiedad del registro, y sin campos no
    // hay nada que actualizar — en ambos casos se responde éxito genérico
    // sin tocar la base ni delatar cuál de las dos condiciones falló.
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("waitlist")
      .update(updates)
      .eq("email", email)
      .eq("id", token);
    if (error) {
      return NextResponse.json({ ok: false, error: "No pudimos actualizar tu perfil." }, { status: 500 });
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "Error del servidor." }, { status: 500 });
  }
}
