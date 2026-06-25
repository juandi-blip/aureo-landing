import { describe, it, expect } from "vitest";
import { isValidEmail, parseWaitlistPayload } from "@/lib/validation";

describe("isValidEmail", () => {
  it("acepta un email válido", () => {
    expect(isValidEmail("juan@aureo.app")).toBe(true);
  });
  it("rechaza un email sin @", () => {
    expect(isValidEmail("juanaureo.app")).toBe(false);
  });
  it("rechaza vacío", () => {
    expect(isValidEmail("")).toBe(false);
  });
});

describe("parseWaitlistPayload", () => {
  it("acepta payload con email válido", () => {
    const r = parseWaitlistPayload({ email: "a@b.com", negocio: "Ferre Sur" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.email).toBe("a@b.com");
  });
  it("normaliza email a minúsculas y recorta espacios", () => {
    const r = parseWaitlistPayload({ email: "  A@B.COM " });
    expect(r.ok && r.data.email).toBe("a@b.com");
  });
  it("rechaza payload sin email", () => {
    const r = parseWaitlistPayload({ negocio: "x" });
    expect(r.ok).toBe(false);
  });
  it("rechaza email inválido", () => {
    const r = parseWaitlistPayload({ email: "no-email" });
    expect(r.ok).toBe(false);
  });
  it("rechaza body no-objeto", () => {
    expect(parseWaitlistPayload(null).ok).toBe(false);
    expect(parseWaitlistPayload("texto").ok).toBe(false);
  });
});
