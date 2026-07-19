import { describe, it, expect, beforeEach } from "vitest";

beforeEach(() => {
  process.env.DEMO_TOKEN_SECRET = "test-secret";
});

import { POST } from "@/app/api/demo-token/route";

function req(body: unknown) {
  return new Request("http://localhost/api/demo-token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/demo-token", () => {
  it("responde 200 con un token para un email válido", async () => {
    const res = await POST(req({ email: "a@b.com" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(typeof json.token).toBe("string");
  });

  it("normaliza el email (trim, minúsculas) antes de firmar", async () => {
    const res = await POST(req({ email: "  A@B.com  " }));
    expect(res.status).toBe(200);
  });

  it("responde 400 con email inválido", async () => {
    const res = await POST(req({ email: "malo" }));
    expect(res.status).toBe(400);
  });

  it("responde 400 si falta el email", async () => {
    const res = await POST(req({}));
    expect(res.status).toBe(400);
  });

  it("responde 500 si falta DEMO_TOKEN_SECRET en el entorno", async () => {
    delete process.env.DEMO_TOKEN_SECRET;
    const res = await POST(req({ email: "a@b.com" }));
    expect(res.status).toBe(500);
  });
});
