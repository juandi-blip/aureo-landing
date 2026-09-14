import { describe, expect, it, vi, beforeEach } from "vitest";

const { getUserMock, notifyMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  notifyMock: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabaseAnon: () => ({ auth: { getUser: getUserMock } }),
}));

vi.mock("@/lib/email", () => ({ notifyPasswordChanged: notifyMock }));

import { POST } from "@/app/api/auth/notify-password-changed/route";

function makeRequest(token: string | null) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  return new Request("http://localhost/api/auth/notify-password-changed", {
    method: "POST",
    headers,
  });
}

describe("POST /api/auth/notify-password-changed", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    notifyMock.mockReset();
  });

  it("sends the notice for a valid token", async () => {
    getUserMock.mockResolvedValue({ data: { user: { email: "user@example.com" } }, error: null });
    const res = await POST(makeRequest("valid-token"));
    expect(res.status).toBe(200);
    expect(notifyMock).toHaveBeenCalledWith("user@example.com");
  });

  it("returns 401 without a token", async () => {
    const res = await POST(makeRequest(null));
    expect(res.status).toBe(401);
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("returns 401 for an invalid token", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: { message: "invalid" } });
    const res = await POST(makeRequest("bad-token"));
    expect(res.status).toBe(401);
    expect(notifyMock).not.toHaveBeenCalled();
  });
});
