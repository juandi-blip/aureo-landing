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

describe("site.melyor", () => {
  it("tiene identidad de modelo propia", () => {
    expect(site.melyor.nombre).toBe("Melyor");
    expect(site.melyor.version).toBe("1");
  });

  it("tiene 5 capacidades mapeadas a los módulos reales", () => {
    expect(site.melyor.capacidades).toHaveLength(5);
  });
});

describe("site.planes — precios", () => {
  it("Starter no cambia de precio", () => {
    const starter = site.planes.find((p) => p.nombre === "Starter")!;
    expect(starter.precios.cop.mensual).toBe(24900);
  });

  it("Pro sube a 64.900 COP/mes fundador", () => {
    const pro = site.planes.find((p) => p.nombre === "Pro")!;
    expect(pro.precios.cop.mensual).toBe(64900);
    expect(pro.features.some((f) => f.includes("CRM"))).toBe(true);
  });

  it("Logística sube a 114.900 COP/mes fundador", () => {
    const log = site.planes.find((p) => p.nombre === "Logística")!;
    expect(log.precios.cop.mensual).toBe(114900);
    expect(log.features.some((f) => f.includes("Compras inteligentes"))).toBe(true);
  });

  it("cada plan tiene precio anual estrictamente menor al mensual x12", () => {
    for (const p of site.planes) {
      expect(p.precios.cop.anual).toBeLessThan(p.precios.cop.mensual);
    }
  });
});
