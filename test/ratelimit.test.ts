import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("checkRateLimit", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    (process.env as any).NODE_ENV = "production";
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("warns once and allows the request when Upstash is not configured in production", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { checkRateLimit } = await import("@/lib/ratelimit");
    const allowed = await checkRateLimit("1.2.3.4");
    expect(allowed).toBe(true);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Upstash no configurado")
    );
  });

  it("does not warn in non-production when Upstash is not configured", async () => {
    (process.env as any).NODE_ENV = "test";
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { checkRateLimit } = await import("@/lib/ratelimit");
    await checkRateLimit("1.2.3.4");
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
