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
    const { token, exp } = signDemoToken("a@b.com");
    const result = verifyDemoToken(token);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.email).toBe("a@b.com");
      expect(result.exp).toBe(exp);
    }
  });

  it("exp queda 30 minutos en el futuro", () => {
    const before = Date.now();
    const { exp } = signDemoToken("a@b.com");
    expect(exp).toBeGreaterThanOrEqual(before + 29 * 60 * 1000);
    expect(exp).toBeLessThanOrEqual(before + 31 * 60 * 1000);
  });

  it("rechaza un token con el email cambiado (firma ya no coincide)", () => {
    const { token } = signDemoToken("a@b.com");
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split(".");
    const sig = parts[parts.length - 1];
    const expStr = parts[parts.length - 2];
    const tampered = Buffer.from(`c@d.com.${expStr}.${sig}`, "utf8").toString("base64url");
    expect(verifyDemoToken(tampered).ok).toBe(false);
  });

  it("rechaza un token expirado", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const { token } = signDemoToken("a@b.com");
    vi.setSystemTime(new Date("2026-01-01T00:31:00Z"));
    expect(verifyDemoToken(token).ok).toBe(false);
  });

  it("rechaza basura que no decodifica como token válido", () => {
    expect(verifyDemoToken("no-es-un-token").ok).toBe(false);
  });

  it("lanza si DEMO_TOKEN_SECRET no está configurado", () => {
    delete process.env.DEMO_TOKEN_SECRET;
    expect(() => signDemoToken("a@b.com")).toThrow();
  });
});
