import { describe, it, expect, vi, beforeEach } from "vitest";

const insertMock = vi.fn();
const eqMock = vi.fn();
const updateMock = vi.fn(() => ({ eq: eqMock }));
vi.mock("@/lib/supabase", () => ({
  getSupabaseAdmin: () => ({
    from: () => ({ insert: insertMock, update: updateMock }),
  }),
}));

import { POST, PATCH } from "@/app/api/waitlist/route";

function req(body: unknown, method: string = "POST") {
  return new Request("http://localhost/api/waitlist", {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  insertMock.mockReset();
  updateMock.mockClear();
  eqMock.mockReset();
});

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
    expect(json).not.toHaveProperty("duplicate");
  });

  it("responde 500 si Supabase falla con otro error", async () => {
    insertMock.mockResolvedValue({ error: { code: "XXXXX", message: "boom" } });
    const res = await POST(req({ email: "a@b.com" }));
    expect(res.status).toBe(500);
  });
});

describe("PATCH /api/waitlist", () => {
  it("actualiza los campos presentes y responde 200", async () => {
    eqMock.mockResolvedValue({ error: null });
    const res = await PATCH(req({ email: "a@b.com", nombre: "Ana", ciudad: "Cali" }, "PATCH"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(updateMock).toHaveBeenCalledWith({ nombre: "Ana", ciudad: "Cali" });
    expect(eqMock).toHaveBeenCalledWith("email", "a@b.com");
  });

  it("responde 200 sin tocar la base si no hay campos para actualizar", async () => {
    const res = await PATCH(req({ email: "a@b.com" }, "PATCH"));
    expect(res.status).toBe(200);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("responde 400 con email inválido", async () => {
    const res = await PATCH(req({ email: "malo", nombre: "Ana" }, "PATCH"));
    expect(res.status).toBe(400);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("responde 500 si Supabase falla", async () => {
    eqMock.mockResolvedValue({ error: { code: "XXXXX", message: "boom" } });
    const res = await PATCH(req({ email: "a@b.com", nombre: "Ana" }, "PATCH"));
    expect(res.status).toBe(500);
  });
});
