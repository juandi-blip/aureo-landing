import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/api-guards", () => ({ runGuards: vi.fn(async () => null) }));

const signInMock = vi.fn();
vi.mock("@/lib/supabase", () => ({
  getSupabaseAnon: () => ({ auth: { signInWithPassword: signInMock } }),
}));

import { POST } from "@/app/api/auth/login/route";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    signInMock.mockReset();
  });

  it("returns session tokens on success", async () => {
    signInMock.mockResolvedValue({
      data: { session: { access_token: "at", refresh_token: "rt" } },
      error: null,
    });
    const res = await POST(makeRequest({ email: "test@example.com", password: "correcthorsebattery" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.session.access_token).toBe("at");
  });

  it("returns 401 on wrong credentials", async () => {
    signInMock.mockResolvedValue({ data: { session: null }, error: { message: "Invalid login credentials" } });
    const res = await POST(makeRequest({ email: "test@example.com", password: "wrong" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for an invalid payload without calling Supabase", async () => {
    const res = await POST(makeRequest({ email: "not-an-email", password: "" }));
    expect(res.status).toBe(400);
    expect(signInMock).not.toHaveBeenCalled();
  });
});
