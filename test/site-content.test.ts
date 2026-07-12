import { describe, it, expect } from "vitest";
import { site, type Moneda, type Periodo } from "@/content/site";

describe("site.modulos", () => {
  it("incluye los 12 módulos del producto, incluyendo los nuevos", () => {
    expect(site.modulos).toHaveLength(12);
    const ids = site.modulos.map((m) => m.id);
    expect(ids).toEqual(
      expect.arrayContaining(["crm", "alertas", "reportes", "compras", "conteos", "permisos"]),
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

  it("tiene 6 capacidades mapeadas a los módulos reales", () => {
    expect(site.melyor.capacidades).toHaveLength(6);
  });

  it("ninguna capacidad implica que el dashboard es prescindible", () => {
    for (const cap of site.melyor.capacidades) {
      expect(cap.texto.toLowerCase()).not.toContain("sin abrir el dashboard");
    }
  });
});

describe("site.contacto", () => {
  it("tiene 3 puntos de confianza con título e icono no vacíos", () => {
    expect(site.contacto.confianza).toHaveLength(3);
    for (const c of site.contacto.confianza) {
      expect(c.titulo.length).toBeGreaterThan(0);
      expect(c.icono.length).toBeGreaterThan(0);
    }
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

  it("cada plan tiene precio anual menor al mensual (descuento por pago anual)", () => {
    for (const p of site.planes) {
      expect(p.precios.cop.anual).toBeLessThan(p.precios.cop.mensual);
    }
  });

  it("precioRegular es siempre mayor que precios (founder < regular) en todos los planes/monedas/periodos", () => {
    const monedas: Moneda[] = ["cop", "usd"];
    const periodos: Periodo[] = ["mensual", "anual"];

    for (const p of site.planes) {
      for (const moneda of monedas) {
        for (const periodo of periodos) {
          expect(p.precioRegular[moneda][periodo]).toBeGreaterThan(
            p.precios[moneda][periodo],
          );
        }
      }
    }
  });
});
