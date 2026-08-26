import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/api-guards", () => ({ runGuards: vi.fn(async () => null) }));

const signUpMock = vi.fn();
vi.mock("@/lib/supabase", () => ({
  getSupabaseAnon: () => ({ auth: { signUp: signUpMock } }),
}));

import { POST } from "@/app/api/auth/signup/route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/signup", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    signUpMock.mockReset();
  });

  it("returns session tokens on success", async () => {
    signUpMock.mockResolvedValue({
      data: { session: { access_token: "at", refresh_token: "rt" } },
      error: null,
    });
    const res = await POST(
      makeRequest({
        email: "test@example.com",
        password: "correcthorsebattery",
        businessName: "Negocio",
        planId: "starter",
      })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.session.access_token).toBe("at");
  });

  it("returns requiresEmailConfirmation when Supabase withholds the session", async () => {
    signUpMock.mockResolvedValue({ data: { session: null }, error: null });
    const res = await POST(
      makeRequest({
        email: "test@example.com",
        password: "correcthorsebattery",
        businessName: "Negocio",
        planId: "starter",
      })
    );
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.requiresEmailConfirmation).toBe(true);
  });

  it("returns 409 when the email is already registered", async () => {
    signUpMock.mockResolvedValue({
      data: { session: null },
      error: { status: 422, message: "User already registered" },
    });
    const res = await POST(
      makeRequest({
        email: "test@example.com",
        password: "correcthorsebattery",
        businessName: "Negocio",
        planId: "starter",
      })
    );
    expect(res.status).toBe(409);
  });

  it("returns 400 for an invalid payload without calling Supabase", async () => {
    const res = await POST(makeRequest({ email: "not-an-email", password: "x", businessName: "", planId: "starter" }));
    expect(res.status).toBe(400);
    expect(signUpMock).not.toHaveBeenCalled();
  });
});
