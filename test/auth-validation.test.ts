import { describe, expect, it } from "vitest";
import { parseSignupPayload, parseLoginPayload } from "@/lib/auth-validation";
import { HONEYPOT_FIELD } from "@/lib/validation";

describe("parseSignupPayload", () => {
  it("accepts a valid payload", () => {
    const result = parseSignupPayload({
      email: "Test@Example.com",
      password: "correcthorsebattery",
      businessName: "Ferretería El Tornillo",
      planId: "pro",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.email).toBe("test@example.com");
      expect(result.data.planId).toBe("pro");
    }
  });

  it("rejects a short password", () => {
    const result = parseSignupPayload({
      email: "test@example.com",
      password: "short",
      businessName: "Negocio",
      planId: "starter",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects an invalid plan id", () => {
    const result = parseSignupPayload({
      email: "test@example.com",
      password: "correcthorsebattery",
      businessName: "Negocio",
      planId: "enterprise",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a missing business name", () => {
    const result = parseSignupPayload({
      email: "test@example.com",
      password: "correcthorsebattery",
      businessName: "   ",
      planId: "starter",
    });
    expect(result.ok).toBe(false);
  });

  it("flags the honeypot as a bot without leaking which check failed", () => {
    const result = parseSignupPayload({
      email: "test@example.com",
      password: "correcthorsebattery",
      businessName: "Negocio",
      planId: "starter",
      [HONEYPOT_FIELD]: "filled-by-a-bot",
    });
    expect(result.ok).toBe(false);
    expect("bot" in result && result.bot).toBe(true);
  });
});

describe("parseLoginPayload", () => {
  it("accepts a valid payload", () => {
    const result = parseLoginPayload({ email: "test@example.com", password: "anything" });
    expect(result.ok).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = parseLoginPayload({ email: "not-an-email", password: "anything" });
    expect(result.ok).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = parseLoginPayload({ email: "test@example.com", password: "" });
    expect(result.ok).toBe(false);
  });
});
