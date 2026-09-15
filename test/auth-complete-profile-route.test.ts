import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/api-guards", () => ({ runGuards: vi.fn(async () => null) }));

const getUserMock = vi.fn();
const singleMock = vi.fn();
const eqSelectMock = vi.fn(() => ({ single: singleMock }));
const selectMock = vi.fn(() => ({ eq: eqSelectMock }));
const eqUpdateMock = vi.fn();
const updateMock = vi.fn(() => ({ eq: eqUpdateMock }));
const fromMock = vi.fn((table: string) => {
  if (table === "profiles") return { select: selectMock };
  if (table === "businesses") return { update: updateMock };
  throw new Error(`unexpected table ${table}`);
});

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: getUserMock },
    from: fromMock,
  })),
}));

import { PATCH } from "@/app/api/auth/complete-profile/route";

function makeRequest(body: unknown, token: string | null = "valid-token") {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  return new Request("http://localhost/api/auth/complete-profile", {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/auth/complete-profile", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    singleMock.mockReset();
    eqUpdateMock.mockReset();
    fromMock.mockClear();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
  });

  it("updates the business and returns ok", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    singleMock.mockResolvedValue({ data: { business_id: "biz-1" }, error: null });
    eqUpdateMock.mockResolvedValue({ error: null });

    const res = await PATCH(makeRequest({ businessName: "Ferretería El Tornillo", planId: "pro" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(updateMock).toHaveBeenCalledWith({
      name: "Ferretería El Tornillo",
      plan_id: "pro",
      needs_onboarding: false,
    });
  });

  it("returns 401 without a token", async () => {
    const res = await PATCH(makeRequest({ businessName: "X", planId: "pro" }, null));
    expect(res.status).toBe(401);
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid payload without calling Supabase", async () => {
    const res = await PATCH(makeRequest({ businessName: "", planId: "pro" }));
    expect(res.status).toBe(400);
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("returns 401 for an invalid token", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: { message: "invalid" } });
    const res = await PATCH(makeRequest({ businessName: "X", planId: "pro" }));
    expect(res.status).toBe(401);
  });
});
