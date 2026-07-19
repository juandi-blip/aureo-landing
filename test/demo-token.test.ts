import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

beforeEach(() => {
  process.env.DEMO_TOKEN_SECRET = "test-secret";
});

afterEach(() => {
  vi.useRealTimers();
});

import { signDemoToken, verifyDemoToken } from "@/lib/demo-token";

describe("signDemoToken / verifyDemoToken", () => {
  it("firma un token que verifica válido con el mismo secreto", () => {
    const { token, exp } = signDemoToken();
    const result = verifyDemoToken(token);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.exp).toBe(exp);
    }
  });

  it("exp queda 30 minutos en el futuro", () => {
    const before = Date.now();
    const { exp } = signDemoToken();
    expect(exp).toBeGreaterThanOrEqual(before + 29 * 60 * 1000);
    expect(exp).toBeLessThanOrEqual(before + 31 * 60 * 1000);
  });

  it("dos tokens firmados en el mismo instante no son iguales (sessionId aleatorio)", () => {
    const a = signDemoToken();
    const b = signDemoToken();
    expect(a.token).not.toBe(b.token);
  });

  it("rechaza un token con la firma alterada", () => {
    const { token } = signDemoToken();
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [sessionId, expStr, sig] = decoded.split(".");
    const flippedSig = sig[0] === "0" ? "f" + sig.slice(1) : "0" + sig.slice(1);
    const tampered = Buffer.from(`${sessionId}.${expStr}.${flippedSig}`, "utf8").toString(
      "base64url"
    );
    expect(verifyDemoToken(tampered).ok).toBe(false);
  });

  it("rechaza un token expirado", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const { token } = signDemoToken();
    vi.setSystemTime(new Date("2026-01-01T00:31:00Z"));
    expect(verifyDemoToken(token).ok).toBe(false);
  });

  it("rechaza basura que no decodifica como token válido", () => {
    expect(verifyDemoToken("no-es-un-token").ok).toBe(false);
  });

  it("lanza si DEMO_TOKEN_SECRET no está configurado", () => {
    delete process.env.DEMO_TOKEN_SECRET;
    expect(() => signDemoToken()).toThrow();
  });
});
