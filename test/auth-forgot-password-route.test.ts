import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/api-guards", () => ({ runGuards: vi.fn(async () => null) }));

const resetMock = vi.fn();
vi.mock("@/lib/supabase", () => ({
  getSupabaseAnon: () => ({ auth: { resetPasswordForEmail: resetMock } }),
}));

import { POST } from "@/app/api/auth/forgot-password/route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/forgot-password", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    resetMock.mockReset();
  });

  it("returns ok and calls Supabase for a well-formed email", async () => {
    resetMock.mockResolvedValue({ data: {}, error: null });
    const res = await POST(makeRequest({ email: "test@example.com" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(resetMock).toHaveBeenCalledWith(
      "test@example.com",
      expect.objectContaining({ redirectTo: expect.stringContaining("/auth/reset") })
    );
  });

  it("returns the same ok response even when Supabase errors (no enumeration)", async () => {
    resetMock.mockRejectedValue(new Error("boom"));
    const res = await POST(makeRequest({ email: "nonexistent@example.com" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  it("returns 400 for an invalid email without calling Supabase", async () => {
    const res = await POST(makeRequest({ email: "not-an-email" }));
    expect(res.status).toBe(400);
    expect(resetMock).not.toHaveBeenCalled();
  });
});
