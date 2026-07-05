import { describe, it, expect, vi, beforeEach } from "vitest";

const insertMock = vi.fn();
vi.mock("@/lib/supabase", () => ({
  getSupabaseAdmin: () => ({
    from: () => ({ insert: insertMock }),
  }),
}));

import { POST } from "@/app/api/waitlist/route";

function req(body: unknown) {
  return new Request("http://localhost/api/waitlist", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => insertMock.mockReset());

describe("POST /api/waitlist", () => {
  it("inserta y responde 200 con email válido", async () => {
    insertMock.mockResolvedValue({ error: null });
    const res = await POST(req({ email: "a@b.com", negocio: "Ferre Sur" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(insertMock).toHaveBeenCalledOnce();
  });

  it("responde 400 con email inválido", async () => {
    const res = await POST(req({ email: "malo" }));
    expect(res.status).toBe(400);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("trata duplicado (código 23505) como éxito sin delatar que el email ya existe", async () => {
    insertMock.mockResolvedValue({ error: { code: "23505" } });
    const res = await POST(req({ email: "a@b.com" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    // Anti-enumeración: la respuesta debe ser indistinguible de un alta nueva.
    expect(json).not.toHaveProperty("duplicate");
  });

  it("responde 500 si Supabase falla con otro error", async () => {
    insertMock.mockResolvedValue({ error: { code: "XXXXX", message: "boom" } });
    const res = await POST(req({ email: "a@b.com" }));
    expect(res.status).toBe(500);
  });
});
