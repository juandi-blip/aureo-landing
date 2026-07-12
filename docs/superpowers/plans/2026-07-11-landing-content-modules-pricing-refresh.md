# Landing Content, Modules & Pricing Refresh — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reflejar en la landing (`aureo-landing/`) los módulos nuevos del producto (CRM, alertas, reportes, compras), reposicionar a Melyor como el motor de IA transversal con identidad propia ("Melyor 1"), subir los precios de Pro/Logística, y reordenar las secciones — todo sin tocar la paleta de marca existente ni introducir dependencias nuevas.

**Architecture:** Cambios de contenido puro en `content/site.ts` (tipado por inferencia, sin tipos nuevos), dos componentes existentes (`ModuleCard.tsx`, `MelyorSection.tsx`) reciben mapeos de íconos ampliados y un pequeño bloque de wordmark, y `app/page.tsx` cambia el orden de `<MelyorSection />`. Corrección respecto al spec original: el "mock de charts que se dibuja" ya existe y está bien implementado en `DashboardMock.tsx` (usado por el Hero, con `pathLength` sobre SVG — ya usa solo `transform`/`opacity`); `DemoSection` muestra un `<video>` real, no un mock, así que **no hay trabajo de animación de charts pendiente** — se retira esa tarea del alcance original (YAGNI: no se toca lo que ya funciona bien).

**Tech Stack:** Next.js 16 / React 19 / TypeScript, `motion` 12 (ya instalado, sin cambios de dependencias), `lucide-react` (para íconos nuevos: `Bell`, `FileText`, ya en el paquete), Vitest para el test de regresión de contenido.

## Global Constraints

- No se agregan dependencias nuevas (`motion`, `lucide-react` ya cubren todo lo necesario).
- No se introduce ningún color nuevo — Melyor reutiliza `--bg-navy`, `--bronze`, `--bronze-glow`, `--emerald` ya definidos (`app/globals.css`).
- No se toca `SecuritySection`, el flujo de waitlist, ni la lógica de referidos.
- Todas las animaciones nuevas o modificadas deben animar solo `transform`/`opacity` (no `width`/`height`/`top`/`left`) — spec 2026-07-11 §6.
- Precios: Starter sin cambios; Pro y Logística suben con el mismo ratio founder/regular y el mismo descuento anual (~16.6%) que ya usa el archivo — spec §3.3.
- Cada commit debe dejar `pnpm build`, `pnpm lint` y `pnpm test` en verde.

---

### Task 1: Módulos nuevos en `content/site.ts` + mapeo de íconos

**Files:**
- Modify: `content/site.ts` (array `modulos`, línea ~42-49)
- Modify: `components/ModuleCard.tsx` (líneas 5-15, `ICON_MAP`)
- Test: `test/site-content.test.ts` (nuevo)

**Interfaces:**
- Consumes: tipo `Module` ya existente (`content/site.ts:1`) — `{ id: string; titulo: string; beneficio: string; icono: string }`, sin cambios.
- Produces: `site.modulos` con 10 entradas (antes 6); `ICON_MAP` en `ModuleCard.tsx` resuelve los `icono` nuevos (`"users"`, `"bell"`, `"file-text"`, `"shopping-bag"`) a componentes de `lucide-react`.

- [ ] **Step 1: Escribir el test de regresión (falla primero)**

Crear `test/site-content.test.ts`:

```ts
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
```

- [ ] **Step 2: Correr el test y confirmar que falla**

Run: `pnpm test -- site-content`
Expected: FAIL — `expected 6 to be 10` (o similar, porque `modulos` todavía tiene 6 entradas).

- [ ] **Step 3: Agregar los 4 módulos nuevos a `content/site.ts`**

En `content/site.ts`, dentro del array `modulos` (después de la entrada `reubicacion`, antes del cierre `] as Module[]`), agregar:

```ts
    { id: "crm", titulo: "CRM de clientes", beneficio: "Historial de compras, notas y clientes inactivos, sin hoja de cálculo aparte.", icono: "users" },
    { id: "alertas", titulo: "Alertas proactivas", beneficio: "Te avisa de stock bajo, clientes inactivos y facturas pendientes antes de que te cuesten una venta.", icono: "bell" },
    { id: "reportes", titulo: "Reportes exportables", beneficio: "Ventas, rotación, rentabilidad y por cliente, listos para exportar cuando los necesites.", icono: "file-text" },
    { id: "compras", titulo: "Compras inteligentes", beneficio: "Órdenes de compra agrupadas por proveedor, con numeración automática.", icono: "shopping-bag" },
```

- [ ] **Step 4: Ampliar `ICON_MAP` en `components/ModuleCard.tsx`**

Reemplazar las líneas 5-15 de `components/ModuleCard.tsx`:

```tsx
import { ShoppingCart, Boxes, Map, BarChart2, Route, ArrowRightLeft, Users, Bell, FileText, ShoppingBag } from "lucide-react";
import type { Module } from "@/content/site";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "shopping-cart": ShoppingCart,
  boxes: Boxes,
  map: Map,
  "bar-chart": BarChart2,
  route: Route,
  "arrow-right-left": ArrowRightLeft,
  users: Users,
  bell: Bell,
  "file-text": FileText,
  "shopping-bag": ShoppingBag,
};
```

- [ ] **Step 5: Correr el test y confirmar que pasa**

Run: `pnpm test -- site-content`
Expected: PASS (2 tests)

- [ ] **Step 6: Verificar visualmente que la grilla no se rompe con 10 tarjetas**

Run: `pnpm dev`, abrir `http://localhost:3000#producto`, revisar en mobile (375px), tablet (768px) y desktop (1280px) que el grid `sm:grid-cols-2 lg:grid-cols-3` en `ModulesGrid.tsx` acomoda las 10 tarjetas sin overflow ni huecos raros. No requiere cambios de código si se ve bien — el grid ya es responsive.

- [ ] **Step 7: Commit**

```bash
git add content/site.ts components/ModuleCard.tsx test/site-content.test.ts
git commit -m "feat(modulos): agrega CRM, alertas, reportes y compras a la grilla de módulos"
```

---

### Task 2: Melyor — contenido con identidad "Melyor 1"

**Files:**
- Modify: `content/site.ts` (objeto `melyor`, líneas ~63-74)
- Test: `test/site-content.test.ts` (ampliar)

**Interfaces:**
- Consumes: nada nuevo — sigue siendo un objeto libre dentro de `site`, tipado por inferencia (`typeof site.melyor`), tal como `MelyorSection.tsx` ya lo consume vía `site.melyor.*`.
- Produces: `site.melyor.nombre` (`"Melyor"`), `site.melyor.version` (`"1"`), y `site.melyor.capacidades` con 5 entradas (antes 4) — Task 3 depende de estos dos campos nuevos y del nuevo orden de capacidades.

- [ ] **Step 1: Ampliar el test de regresión (falla primero)**

Agregar a `test/site-content.test.ts`:

```ts
describe("site.melyor", () => {
  it("tiene identidad de modelo propia", () => {
    expect(site.melyor.nombre).toBe("Melyor");
    expect(site.melyor.version).toBe("1");
  });

  it("tiene 5 capacidades mapeadas a los módulos reales", () => {
    expect(site.melyor.capacidades).toHaveLength(5);
  });
});
```

- [ ] **Step 2: Correr el test y confirmar que falla**

Run: `pnpm test -- site-content`
Expected: FAIL — `site.melyor.nombre` es `undefined` (el objeto `melyor` no tiene ese campo todavía).

- [ ] **Step 3: Reescribir el objeto `melyor` en `content/site.ts`**

Reemplazar el objeto `melyor` completo (líneas ~63-74) por:

```ts
  melyor: {
    eyebrow: "Exclusivo de Aureo",
    nombre: "Melyor",
    version: "1",
    titulo: "El motor de IA detrás de todo Aureo.",
    texto: "Melyor no es un chatbot de soporte. Es el motor de inteligencia que corre por debajo de cada módulo de Aureo — el que genera tus alertas, arma tus compras, detecta tus oportunidades de venta e interpreta tus reportes. Hablar con él por chat es solo una forma más de usarlo.",
    capacidades: [
      { titulo: "Compras óptimas", texto: "Sugiere cuánto y cuándo reabastecer según tu demanda real, y arma la orden de compra por ti." },
      { titulo: "Alertas antes de que duelan", texto: "Vigila tu stock, tus clientes inactivos y tus facturas pendientes — y te avisa antes de que se conviertan en un problema." },
      { titulo: "Venta cruzada que se te escapa", texto: "Detecta en tu historial de clientes a quién podrías venderle más, y te lo dice antes que tu competencia." },
      { titulo: "Reportes que se explican solos", texto: "No solo te muestra el reporte de rotación o rentabilidad — te dice qué significa y qué deberías hacer." },
      { titulo: "Pregúntale directamente", texto: "Además de todo esto, puedes chatear con Melyor sobre stock bajo, clientes inactivos o facturas pendientes, en lenguaje natural." },
    ],
    nota: "Incluido en Aureo. Se activa junto con tu cuenta — sin configuración adicional.",
  },
```

- [ ] **Step 4: Correr el test y confirmar que pasa**

Run: `pnpm test -- site-content`
Expected: PASS (4 tests en total del archivo)

- [ ] **Step 5: Commit**

```bash
git add content/site.ts test/site-content.test.ts
git commit -m "feat(melyor): reescribe el copy como motor transversal con identidad 'Melyor 1'"
```

---

### Task 3: `MelyorSection.tsx` — wordmark y 5 íconos de capacidad

**Files:**
- Modify: `components/MelyorSection.tsx`

**Interfaces:**
- Consumes: `site.melyor.nombre`, `site.melyor.version` (de Task 2); `fadeUp`, `staggerContainer`, `VIEWPORT` de `lib/motion.ts` (sin cambios, ya importados).
- Produces: ninguna interfaz nueva — es la hoja del árbol de dependencias para este refresh.

- [ ] **Step 1: Actualizar imports de íconos (línea 4)**

Reemplazar:

```tsx
import { ShoppingBag, Users, Ruler, MessageCircle } from "lucide-react";
```

por:

```tsx
import { ShoppingBag, Bell, Users, FileText, MessageCircle } from "lucide-react";
```

- [ ] **Step 2: Actualizar `CAPABILITY_ICONS` (línea 11) para las 5 capacidades nuevas, en el mismo orden que `site.melyor.capacidades`**

Reemplazar:

```tsx
const CAPABILITY_ICONS = [ShoppingBag, Users, Ruler, MessageCircle];
```

por:

```tsx
const CAPABILITY_ICONS = [ShoppingBag, Bell, Users, FileText, MessageCircle];
```

(Orden: Compras óptimas→ShoppingBag, Alertas→Bell, Venta cruzada→Users, Reportes→FileText, Pregúntale directamente→MessageCircle — 1:1 con `site.melyor.capacidades` de Task 2.)

- [ ] **Step 3: Agregar el wordmark "Melyor 1" antes del título, dentro del bloque `<div className="mt-5">` (línea 65-67)**

Reemplazar:

```tsx
          <div className="mt-5">
            <SectionHeading light>{site.melyor.titulo}</SectionHeading>
          </div>
```

por:

```tsx
          <motion.div
            className="mt-5 flex items-center justify-center gap-2"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
          >
            <span className="font-display text-2xl font-bold text-[var(--text-cream)]">
              {site.melyor.nombre}
            </span>
            <span className="rounded-md border border-[var(--bronze)]/40 bg-[var(--bronze)]/15 px-2 py-0.5 font-mono text-sm font-semibold text-[var(--bronze)]">
              {site.melyor.version}
            </span>
          </motion.div>

          <div className="mt-3">
            <SectionHeading light>{site.melyor.titulo}</SectionHeading>
          </div>
```

(El wordmark usa `--text-cream` y `--bronze` — ambos ya definidos, ningún token nuevo. Anima con la misma variante `fadeUp` que el resto de la sección, sin observers adicionales porque comparte el `whileInView` de un elemento hermano — no encadena un nuevo IntersectionObserver más allá de los que ya existen en la sección.)

- [ ] **Step 4: Verificar visualmente**

Run: `pnpm dev`, abrir la landing, hacer scroll hasta la sección Melyor (ahora será la segunda sección tras el reorder de Task 5, pero es visible igual antes de ese cambio). Confirmar: el wordmark "Melyor" + badge "1" se ve antes del título, las 5 tarjetas de capacidad muestran íconos distintos (compras, campana, usuarios, documento, chat) sin ícono repetido ni faltante.

- [ ] **Step 5: Correr build/lint completos**

Run: `pnpm lint && pnpm build`
Expected: ambos sin errores (confirma que no quedó ningún import sin usar, p.ej. `Ruler` ya no se importa).

- [ ] **Step 6: Commit**

```bash
git add components/MelyorSection.tsx
git commit -m "feat(melyor): agrega wordmark 'Melyor 1' y 5 íconos de capacidad"
```

---

### Task 4: Precios — Pro y Logística suben, Starter sin cambios

**Files:**
- Modify: `content/site.ts` (array `planes`, líneas ~90-136)
- Test: `test/site-content.test.ts` (ampliar)

**Interfaces:**
- Consumes: tipos `Plan`/`PlanPrecios` ya existentes (`content/site.ts:5-8`), sin cambios de forma.
- Produces: `site.planes[1]` (Pro) y `site.planes[2]` (Logística) con nuevos montos y features; `site.planes[0]` (Starter) sin cambios.

- [ ] **Step 1: Ampliar el test de regresión (falla primero)**

Agregar a `test/site-content.test.ts`:

```ts
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
```

- [ ] **Step 2: Correr el test y confirmar que falla**

Run: `pnpm test -- site-content`
Expected: FAIL — `expected 54900 to be 64900` (Pro todavía tiene el precio viejo).

- [ ] **Step 3: Reemplazar el plan Pro completo en `content/site.ts`**

```ts
    {
      nombre: "Pro",
      resumen: "Para operar en serio, con equipo y reportes.",
      destacado: false,
      precios: { cop: { mensual: 64900, anual: 54100 }, usd: { mensual: 16, anual: 13 } },
      precioRegular: { cop: { mensual: 89900, anual: 74900 }, usd: { mensual: 22, anual: 18 } },
      features: [
        "Todo lo de Starter",
        "Usuarios y roles: admin, depósito, caja",
        "Inventario ilimitado y conteos físicos",
        "CRM de clientes y alertas proactivas",
        "Reportes de ventas y rotación",
        "Varios dispositivos",
      ],
      cta: "Unirme a la lista de espera",
    },
```

- [ ] **Step 4: Reemplazar el plan Logística completo en `content/site.ts`**

```ts
    {
      nombre: "Logística",
      resumen: "La inteligencia logística que te diferencia.",
      destacado: true,
      precios: { cop: { mensual: 114900, anual: 95700 }, usd: { mensual: 29, anual: 24 } },
      precioRegular: { cop: { mensual: 159900, anual: 133300 }, usd: { mensual: 39, anual: 32 } },
      features: [
        "Todo lo de Pro",
        "Mapa de calor de bodega (WMS) y análisis ABC/Pareto",
        "Preparación de pedidos (picking) y reubicación inteligente",
        "Compras inteligentes con órdenes automáticas",
        "Permisos configurables por rol",
        "Reportes avanzados: rentabilidad y por cliente",
        "Multi-bodega",
      ],
      cta: "Unirme a la lista de espera",
    },
```

- [ ] **Step 5: Correr el test y confirmar que pasa**

Run: `pnpm test -- site-content`
Expected: PASS (todos los tests del archivo, ~9 en total)

- [ ] **Step 6: Verificar visualmente el toggle de precios**

Run: `pnpm dev`, ir a `#precios`, alternar Mensual/Anual y COP/USD. Confirmar: los montos nuevos aparecen, el toggle sigue animando la píldora activa sin salto de layout (usa `layoutId` ya existente en `PricingTable.tsx`, sin tocar ese código), y las tarjetas Pro/Logística muestran las features nuevas sin desbordar el card.

- [ ] **Step 7: Commit**

```bash
git add content/site.ts test/site-content.test.ts
git commit -m "feat(precios): sube Pro y Logística reflejando los módulos nuevos, Starter sin cambios"
```

---

### Task 5: Reordenar secciones — Melyor sube de posición

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: componentes ya existentes (`ProblemSection`, `MelyorSection`, `ComparisonSection`, etc.) — ningún cambio de props.
- Produces: nada consumido por otra tarea — es el último cambio estructural del refresh.

- [ ] **Step 1: Mover `<MelyorSection />` en el JSX**

En `app/page.tsx`, dentro de `<main>`, el orden actual es:

```tsx
        <Hero />
        <ProblemSection />
        <ComparisonSection />
        <HowItWorks />
        <ModulesGrid />
        <MelyorSection />
        <DemoSection />
```

Reemplazar por:

```tsx
        <Hero />
        <ProblemSection />
        <MelyorSection />
        <ComparisonSection />
        <HowItWorks />
        <ModulesGrid />
        <DemoSection />
```

(Los imports en la parte superior del archivo no cambian de línea, solo el orden de uso en el JSX.)

- [ ] **Step 2: Verificar que no hay anclas rotas**

Run: `grep -n "href=\"#" components/Nav.tsx` — confirmar que el nav no ancla a un `id` específico de Melyor que dependa del orden (Melyor no tiene `id` en su `<section>`, así que no hay anclas que romper). Si algún otro componente linkea a `#melyor`, ajustarlo; si no, no se requiere cambio.

- [ ] **Step 3: Verificar visualmente el flujo completo**

Run: `pnpm dev`, hacer scroll de principio a fin. Confirmar el orden: Hero → Problema → Melyor → Comparativa → Cómo Funciona → Módulos → Demo → Fundadores → Precios → FAQ → CTA. Confirmar que la transición de color de fondo (Melyor y Demo usan `--bg-navy`, quedan ahora separados por Comparativa/CómoFunciona en vez de consecutivos) se ve bien y no genera dos bloques navy pegados uno tras otro de forma extraña. Si se ven dos secciones navy consecutivas en algún punto del nuevo orden y no favorece el ritmo visual, ese es un ajuste de contraste a resolver en revisión visual, no un bug de código.

- [ ] **Step 4: Correr build completo**

Run: `pnpm build`
Expected: build exitoso, sin errores de tipos ni de lint.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx
git commit -m "feat(landing): sube MelyorSection justo después de ProblemSection"
```

---

### Task 6: Verificación final de performance y regresión completa

**Files:**
- Ninguno nuevo — tarea de verificación pura.

**Interfaces:**
- Consumes: todos los cambios de Tasks 1-5.
- Produces: confirmación de que el refresh no regresó performance ni tests.

- [ ] **Step 1: Correr la suite completa de tests**

Run: `pnpm test`
Expected: todos los tests pasan, incluyendo `test/site-content.test.ts` (Tasks 1, 2, 4) y los tests preexistentes (`ratelimit.test.ts`, `validation.test.ts`, `waitlist-route.test.ts`) sin regresión.

- [ ] **Step 2: Lint y build**

Run: `pnpm lint && pnpm build`
Expected: ambos limpios.

- [ ] **Step 3: Lighthouse baseline vs. post-cambio**

Si existe un baseline previo (spec 2026-07-11 §6 lo pide antes de tocar código): correr Lighthouse (Chrome DevTools o `aureo-landing:audit-website`) sobre `pnpm build && pnpm start` local, comparar LCP/CLS/TBT contra el baseline. Si no se corrió un baseline antes de empezar, correrlo ahora igual y dejarlo documentado como referencia para el próximo cambio — no bloquea el merge de este refresh, pero se reporta el resultado.

- [ ] **Step 4: E2E de waitlist sigue pasando (no debería verse afectado, pero se confirma)**

Run: `pnpm e2e`
Expected: `waitlist.spec.ts` pasa sin cambios — el refresh no tocó el formulario ni su lógica.

- [ ] **Step 5: Commit final si hubo algún ajuste de la verificación**

```bash
git add -A
git commit -m "chore: verificación final del refresh de contenido/módulos/precios"
```

(Si no hubo ajustes, no hay nada que commitear en este paso — es un checkpoint, no un commit obligatorio.)

---

## Self-Review

- **Cobertura del spec:** §3.1 (módulos) → Task 1. §3.2 (Melyor + identidad) → Tasks 2-3. §3.3 (precios) → Task 4. §4 (orden de secciones) → Task 5. §6 (performance) → Task 6, más las reglas de `transform`/`opacity` y `once: true` ya aplicadas en Task 3 (el wordmark reutiliza `fadeUp`/`VIEWPORT` existentes, no crea un observer nuevo). §5 del spec original (charts que se dibujan) se retiró explícitamente del alcance tras confirmar que `DemoSection` usa video real y `DashboardMock` ya implementa el patrón correctamente — no hay tarea huérfana, está documentado en "Architecture" arriba.
- **Placeholders:** ninguno — cada paso tiene código completo, comandos exactos y el output esperado.
- **Consistencia de tipos:** `Module`, `Plan`, `PlanPrecios` no cambian de forma en ningún task; `site.melyor.nombre`/`version` se usan con los mismos nombres en Task 2 (donde se crean) y Task 3 (donde se consumen). El orden de `CAPABILITY_ICONS` en Task 3 coincide 1:1 con el orden de `capacidades` definido en Task 2.
