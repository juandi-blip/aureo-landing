import { HONEYPOT_FIELD, isValidEmail } from "@/lib/validation";

const MIN_PASSWORD = 8;
const MAX_PASSWORD = 72; // bcrypt/Supabase practical cap
const MAX_BUSINESS_NAME = 80;
const PLAN_IDS = ["starter", "pro", "logistica"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export type SignupInput = {
  email: string;
  password: string;
  businessName: string;
  planId: PlanId;
};

export type LoginInput = {
  email: string;
  password: string;
};

function isValidPassword(password: unknown): password is string {
  return (
    typeof password === "string" &&
    password.length >= MIN_PASSWORD &&
    password.length <= MAX_PASSWORD
  );
}

function isValidPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && (PLAN_IDS as readonly string[]).includes(value);
}

export function parseSignupPayload(
  body: unknown
): { ok: true; data: SignupInput } | { ok: false; error: string } | { ok: false; bot: true } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Solicitud inválida." };
  }
  const b = body as Record<string, unknown>;

  if (typeof b[HONEYPOT_FIELD] === "string" && b[HONEYPOT_FIELD].trim() !== "") {
    return { ok: false, bot: true };
  }

  const email = typeof b.email === "string" ? b.email.normalize("NFC").trim().toLowerCase() : "";
  if (!isValidEmail(email)) {
    return { ok: false, error: "Ingresa un correo válido." };
  }

  if (!isValidPassword(b.password)) {
    return { ok: false, error: `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.` };
  }

  const businessName =
    typeof b.businessName === "string" ? b.businessName.trim().slice(0, MAX_BUSINESS_NAME) : "";
  if (!businessName) {
    return { ok: false, error: "Ingresa el nombre de tu negocio." };
  }

  if (!isValidPlanId(b.planId)) {
    return { ok: false, error: "Selecciona un plan válido." };
  }

  return {
    ok: true,
    data: { email, password: b.password as string, businessName, planId: b.planId },
  };
}

export function parseLoginPayload(
  body: unknown
): { ok: true; data: LoginInput } | { ok: false; error: string } | { ok: false; bot: true } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Solicitud inválida." };
  }
  const b = body as Record<string, unknown>;

  if (typeof b[HONEYPOT_FIELD] === "string" && b[HONEYPOT_FIELD].trim() !== "") {
    return { ok: false, bot: true };
  }

  const email = typeof b.email === "string" ? b.email.normalize("NFC").trim().toLowerCase() : "";
  if (!isValidEmail(email)) {
    return { ok: false, error: "Ingresa un correo válido." };
  }

  if (typeof b.password !== "string" || b.password.length === 0) {
    return { ok: false, error: "Ingresa tu contraseña." };
  }

  return { ok: true, data: { email, password: b.password } };
}
