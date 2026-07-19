import { createHmac, timingSafeEqual } from "node:crypto";

const SESSION_MS = 30 * 60 * 1000;

function getSecret(): string {
  const secret = process.env.DEMO_TOKEN_SECRET;
  if (!secret) throw new Error("DEMO_TOKEN_SECRET no configurado.");
  return secret;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function signDemoToken(email: string): { token: string; exp: number } {
  const exp = Date.now() + SESSION_MS;
  const payload = `${email}.${exp}`;
  const sig = sign(payload, getSecret());
  const token = Buffer.from(`${payload}.${sig}`, "utf8").toString("base64url");
  return { token, exp };
}

export function verifyDemoToken(
  token: string
): { ok: true; email: string; exp: number } | { ok: false } {
  let decoded: string;
  try {
    decoded = Buffer.from(token, "base64url").toString("utf8");
  } catch {
    return { ok: false };
  }

  const parts = decoded.split(".");
  if (parts.length < 3) return { ok: false };

  const sig = parts[parts.length - 1];
  const expStr = parts[parts.length - 2];
  const email = parts.slice(0, -2).join(".");

  const exp = Number(expStr);
  if (!email || !Number.isFinite(exp)) return { ok: false };

  let expected: string;
  try {
    expected = sign(`${email}.${exp}`, getSecret());
  } catch {
    return { ok: false };
  }

  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false };
  if (Date.now() > exp) return { ok: false };

  return { ok: true, email, exp };
}
