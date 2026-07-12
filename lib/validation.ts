export type WaitlistInput = {
  email: string;
  nombre?: string;
  negocio?: string;
  ciudad?: string;
  origen?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Length caps to prevent oversized payloads bloating the DB.
const MAX_EMAIL = 254; // RFC 5321 max
const MAX_FIELD = 80;
const MAX_ORIGEN = 60;

// Honeypot: legitimate browsers leave this hidden field empty; bots fill it.
export const HONEYPOT_FIELD = "sitio_web";

export function isValidEmail(email: string): boolean {
  return (
    typeof email === "string" &&
    email.length <= MAX_EMAIL &&
    EMAIL_RE.test(email.trim())
  );
}

export function parseWaitlistPayload(
  body: unknown
):
  | { ok: true; data: WaitlistInput }
  | { ok: false; error: string }
  | { ok: false; bot: true } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Solicitud inválida." };
  }
  const b = body as Record<string, unknown>;

  // Honeypot tripped → treat as bot (caller should fake success, not error).
  if (typeof b[HONEYPOT_FIELD] === "string" && b[HONEYPOT_FIELD].trim() !== "") {
    return { ok: false, bot: true };
  }

  const emailRaw =
    typeof b.email === "string" ? b.email.normalize("NFC").trim().toLowerCase() : "";
  if (!isValidEmail(emailRaw)) {
    return { ok: false, error: "Ingresa un correo válido." };
  }
  const cap = (v: unknown, max: number) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined;
  return {
    ok: true,
    data: {
      email: emailRaw,
      nombre: cap(b.nombre, MAX_FIELD),
      negocio: cap(b.negocio, MAX_FIELD),
      ciudad: cap(b.ciudad, MAX_FIELD),
      origen: cap(b.origen, MAX_ORIGEN),
    },
  };
}
