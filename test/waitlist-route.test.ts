import { describe, it, expect, vi, beforeEach } from "vitest";

const singleMock = vi.fn();
const selectMock = vi.fn(() => ({ single: singleMock }));
const insertMock = vi.fn(() => ({ select: selectMock }));

const eq2Mock = vi.fn();
const eq1Mock = vi.fn(() => ({ eq: eq2Mock }));
const updateMock = vi.fn(() => ({ eq: eq1Mock }));

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
  insertMock.mockClear();
  selectMock.mockClear();
  singleMock.mockReset();
  updateMock.mockClear();
  eq1Mock.mockClear();
  eq2Mock.mockReset();
});

describe("POST /api/waitlist", () => {
  it("inserta, responde 200 y devuelve un token con email válido", async () => {
    singleMock.mockResolvedValue({ data: { id: "row-uuid-1" }, error: null });
    const res = await POST(req({ email: "a@b.com", negocio: "Ferre Sur" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.token).toBe("row-uuid-1");
    expect(insertMock).toHaveBeenCalledOnce();
  });

  it("responde 400 con email inválido", async () => {
    const res = await POST(req({ email: "malo" }));
    expect(res.status).toBe(400);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("trata duplicado (código 23505) como éxito sin devolver token", async () => {
    singleMock.mockResolvedValue({ data: null, error: { code: "23505" } });
    const res = await POST(req({ email: "a@b.com" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json).not.toHaveProperty("token");
    expect(json).not.toHaveProperty("duplicate");
  });

  it("responde 500 si Supabase falla con otro error", async () => {
    singleMock.mockResolvedValue({ data: null, error: { code: "XXXXX", message: "boom" } });
    const res = await POST(req({ email: "a@b.com" }));
    expect(res.status).toBe(500);
  });
});

describe("PATCH /api/waitlist", () => {
  it("actualiza los campos presentes filtrando por email y token, y responde 200", async () => {
    eq2Mock.mockResolvedValue({ error: null });
    const res = await PATCH(req({ email: "a@b.com", token: "row-uuid-1", nombre: "Ana", ciudad: "Cali" }, "PATCH"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(updateMock).toHaveBeenCalledWith({ nombre: "Ana", ciudad: "Cali" });
    expect(eq1Mock).toHaveBeenCalledWith("email", "a@b.com");
    expect(eq2Mock).toHaveBeenCalledWith("id", "row-uuid-1");
  });

  it("no actualiza nada si falta el token (evita que cualquiera con el email ajeno sobrescriba el perfil)", async () => {
    const res = await PATCH(req({ email: "a@b.com", nombre: "Ana" }, "PATCH"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("responde 200 sin tocar la base si no hay campos para actualizar", async () => {
    const res = await PATCH(req({ email: "a@b.com", token: "row-uuid-1" }, "PATCH"));
    expect(res.status).toBe(200);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("responde 400 con email inválido", async () => {
    const res = await PATCH(req({ email: "malo", token: "x", nombre: "Ana" }, "PATCH"));
    expect(res.status).toBe(400);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("responde 500 si Supabase falla", async () => {
    eq2Mock.mockResolvedValue({ error: { code: "XXXXX", message: "boom" } });
    const res = await PATCH(req({ email: "a@b.com", token: "row-uuid-1", nombre: "Ana" }, "PATCH"));
    expect(res.status).toBe(500);
  });
});
