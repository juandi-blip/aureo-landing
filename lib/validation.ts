export type WaitlistInput = {
  email: string;
  nombre?: string;
  negocio?: string;
  ciudad?: string;
  origen?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return typeof email === "string" && EMAIL_RE.test(email.trim());
}

export function parseWaitlistPayload(
  body: unknown
): { ok: true; data: WaitlistInput } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Solicitud inválida." };
  }
  const b = body as Record<string, unknown>;
  const emailRaw = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  if (!isValidEmail(emailRaw)) {
    return { ok: false, error: "Ingresa un correo válido." };
  }
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
  return {
    ok: true,
    data: {
      email: emailRaw,
      nombre: str(b.nombre),
      negocio: str(b.negocio),
      ciudad: str(b.ciudad),
      origen: str(b.origen),
    },
  };
}
