import { describe, it, expect } from "vitest";
import { site } from "@/content/site";

describe("site.modulos", () => {
  it("incluye los 10 módulos del producto, incluyendo los nuevos", () => {
    expect(site.modulos).toHaveLength(10);
    const ids = site.modulos.map((m) => m.id);
    expect(ids).toEqual(
      expect.arrayContaining(["crm", "alertas", "reportes", "compras"]),
    );
  });

  it("cada módulo tiene título y beneficio no vacíos", () => {
    for (const m of site.modulos) {
      expect(m.titulo.length).toBeGreaterThan(0);
      expect(m.beneficio.length).toBeGreaterThan(0);
    }
  });
});
