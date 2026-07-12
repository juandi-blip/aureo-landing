# Aureo Landing — Content, Modules & Pricing Refresh Design Spec
**Date:** 2026-07-11
**Status:** Draft — pending user review
**Builds on:** `2026-06-25-aureo-animation-redesign-design.md` (motion system, palette — unchanged)

---

## 1. Objetivo

La app principal (`aureo/`) agregó módulos reales que la landing no refleja: CRM ligero, alertas proactivas, reportes exportables, compras/órdenes de compra, permisos por rol, y un asistente de IA (Melyor) que ahora corre como motor transversal, no solo como chat. Este spec actualiza el **contenido** de la landing (`content/site.ts`), el **orden de secciones** (`app/page.tsx`) y sube el nivel de **pulido de interacción/data-visuals** sobre el sistema de motion ya existente (`lib/motion.ts`, spec de 2026-06-25). No hay pivote de paleta ni de identidad visual — la base crema/navy/bronce se mantiene intacta.

## 2. No-goals

- No se cambia la paleta ni se adopta un modo oscuro (se evaluaron animejs.com / motion.dev / bklit.com como referencia, pero el interés confirmado por el usuario es la calidad de interacción/motion/data-viz, no el look oscuro).
- No se reactiva `SecuritySection` (sigue en fase lista de espera, sin pasarela de pago).
- No se toca el flujo de waitlist ni la lógica de referidos — solo contenido y presentación.

---

## 3. Contenido — `content/site.ts`

### 3.1 Módulos nuevos en `modulos`

Se agregan 4 entradas al array `modulos` (pasa de 6 a 10):

```ts
{ id: "crm", titulo: "CRM de clientes", beneficio: "Historial de compras, notas y clientes inactivos, sin hoja de cálculo aparte.", icono: "users" },
{ id: "alertas", titulo: "Alertas proactivas", beneficio: "Te avisa de stock bajo, clientes inactivos y facturas pendientes antes de que te cuesten una venta.", icono: "bell" },
{ id: "reportes", titulo: "Reportes exportables", beneficio: "Ventas, rotación, rentabilidad y por cliente, listos para exportar cuando los necesites.", icono: "file-text" },
{ id: "compras", titulo: "Compras inteligentes", beneficio: "Órdenes de compra agrupadas por proveedor, con numeración automática.", icono: "shopping-bag" },
```

`ModulesGrid`/`ModuleCard` ya son data-driven desde este array — no requieren cambios estructurales, solo acomodar 10 tarjetas en vez de 6 (grid ya responsive).

### 3.2 Melyor — identidad propia de modelo ("Melyor 1")

Objetivo: Melyor deja de leerse como "una sección de features" y se presenta con el tratamiento de marca que usan Anthropic/OpenAI/Google/Meta al lanzar un modelo — nombre + versión como wordmark, acento visual propio, capacidades presentadas como el "model card" de lo que sabe hacer. Este tratamiento queda **contenido a `MelyorSection`** (no se propaga a nav ni a otras tarjetas en este refresh).

**Naming:** "Melyor 1" — dos elementos tipográficos separados (nombre en la display font `Syne`, "1" en un badge monoespaciado aparte, como un tag de versión), no "Melyor v1.0" ni texto corrido.

**Acento propio, pero de familia Aureo:** en vez de introducir un color ajeno a la marca, el "momento Melyor" se logra **intensificando** tokens que ya existen — `--primary-strong` (`#1E3352`, navy profundo) como fondo/panel distintivo de la sección, y `--bronze`/`--bronze-glow` (ya definidos en el spec de animación del 25-06) como acento de highlight — el mismo lenguaje "premium" que ya usa `earlyBird` para el badge de fundador. No se crea ningún token de color nuevo:

```css
/* ya existen en globals.css / lib/motion.ts — MelyorSection los reutiliza, no los redefine */
--primary-strong: #1E3352;   /* panel/fondo distintivo de la sección Melyor */
--bronze: #A8742B;           /* acento del wordmark "1" y glow de las capacidades */
--bronze-glow: rgba(168,116,43,0.3);
```

Esto logra que Melyor se sienta como un sub-momento de marca (como Claude dentro de Anthropic) sin salirse de la paleta de Aureo — es la misma navy y el mismo bronce que ya usa el resto de la landing, solo concentrados y con más contraste en este bloque específico.

**Reescritura de `melyor`:**

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

`Module`/`FaqItem`/etc. types no cambian; `melyor` pasa de objeto libre a tener dos campos nuevos (`nombre`, `version`) que `MelyorSection.tsx` usa para renderizar el wordmark. No requiere un tipo TS nuevo — se puede tipar inline o con un `type MelyorContent = typeof site.melyor` si el archivo ya sigue ese patrón.

(5 capacidades en vez de 4 — cada una mapea 1:1 a un módulo real: compras, alertas, CRM, reportes, y el chat como interfaz directa. Se presentan en `MelyorSection` como una grilla tipo "model card" — cada capacidad es una celda con su título como si fuera el nombre de una métrica/benchmark, no como una lista de viñetas genérica.)

### 3.3 Planes — features y precios

**Starter** — sin cambios (no gana módulos nuevos, precio igual):
```
precios: { cop: { mensual: 24900, anual: 20750 }, usd: { mensual: 6, anual: 5 } }
precioRegular: { cop: { mensual: 34900, anual: 29100 }, usd: { mensual: 8, anual: 7 } }
```

**Pro** — gana CRM + alertas, precio sube ~18%:
```
precios: { cop: { mensual: 64900, anual: 54100 }, usd: { mensual: 16, anual: 13 } }
precioRegular: { cop: { mensual: 89900, anual: 74900 }, usd: { mensual: 22, anual: 18 } }
features: [
  "Todo lo de Starter",
  "Usuarios y roles: admin, depósito, caja",
  "Inventario ilimitado y conteos físicos",
  "CRM de clientes y alertas proactivas",
  "Reportes de ventas y rotación",
  "Varios dispositivos",
]
```

**Logística** — gana compras + permisos + reportes avanzados, precio sube ~21%:
```
precios: { cop: { mensual: 114900, anual: 95700 }, usd: { mensual: 29, anual: 24 } }
precioRegular: { cop: { mensual: 159900, anual: 133300 }, usd: { mensual: 39, anual: 32 } }
features: [
  "Todo lo de Pro",
  "Mapa de calor de bodega (WMS) y análisis ABC/Pareto",
  "Preparación de pedidos (picking) y reubicación inteligente",
  "Compras inteligentes con órdenes automáticas",
  "Permisos configurables por rol",
  "Reportes avanzados: rentabilidad y por cliente",
  "Multi-bodega",
]
```

Anuales calculados con el mismo descuento proporcional (~16.5%) que ya usa el archivo. `precioRegular` mantiene el mismo ratio founder/regular (~72%) que los planes actuales.

### 3.4 Sin cambios

`hero`, `problema`, `comoFunciona`, `comparativa`, `demo`, `fundadores`, `preciosTrial`, `preciosNota`, `earlyBird`, `faq`, `finalCta`, `footer`, `seguridad` (deshabilitada) quedan igual — fuera de alcance de este refresh.

---

## 4. Orden de secciones — `app/page.tsx`

Melyor sube de posición para dar protagonismo inmediato al diferenciador (motor de IA) antes de entrar en detalle de módulos:

**Orden actual:**
```
Hero → Problema → Comparativa → CómoFunciona → Módulos → Melyor → Demo → Fundadores → Precios → FAQ → CTA
```

**Orden nuevo:**
```
Hero → Problema → Melyor → Comparativa → CómoFunciona → Módulos → Demo → Fundadores → Precios → FAQ → CTA
```

Razonamiento: Problema (dolor) → Melyor (la respuesta/diferenciador) → Comparativa (prueba de por qué Aureo gana, ahora con Melyor ya presentado) → CómoFunciona/Módulos (detalle) → Demo (evidencia) → Fundadores (confianza) → Precios.

---

## 5. Interacción y data-visuals — pulido sobre el sistema existente

No se introduce una librería nueva de animación ni de charts — se extiende `lib/motion.ts` y los mocks SVG que ya existen en `DemoSection`/`DashboardMock`:

- **Charts que se dibujan al entrar en viewport**: las barras del mock de ABC/Pareto y el degradado del mapa de calor en `DemoSection` pasan de aparecer con `fadeUp` genérico a animar sus propios valores (altura de barra, opacidad de celda de calor) con `whileInView`, usando el mismo patrón `clipReveal`/spring ya definido en el spec de animación del 25-06.
- **Transiciones de layout**: el toggle mensual/anual en `PricingTable` y la expansión de `ModuleCard` (si aplica) usan `layout` de `motion` para que el cambio de tamaño/posición sea animado en vez de instantáneo.
- **Hover states**: se revisan los componentes que solo tienen `fadeUp` en scroll (varios de los 24 archivos que ya importan `motion`) y se les agrega un estado de hover sutil (scale/glow bronce, consistente con `--bronze-glow` ya definido) donde hoy no tienen ninguno — principalmente `ModuleCard`, `PricingCard`.

Esto es pulido incremental, no una reescritura — cada componente tocado debe seguir usando las variantes ya definidas en `lib/motion.ts` (`fadeUp`, `staggerContainer`, `clipReveal`) en vez de crear variantes nuevas ad-hoc, salvo que el efecto lo requiera explícitamente (ej. el "dibujado" de una barra de gráfico no es un fade).

---

## 6. Performance — prioridad explícita

Sumar 4 módulos y más motion es exactamente el tipo de cambio que degrada Core Web Vitals si no se cuida. Reglas para esta implementación:

- **Animar solo `transform`/`opacity`** en los nuevos "charts que se dibujan" (barras, mapa de calor) — nunca `width`/`height`/`top`/`left` en el hilo principal, para no forzar layout/paint por frame. El "crecimiento" de una barra se logra con `scaleY` + `transform-origin: bottom`, no cambiando su altura real.
- **`whileInView` con `once: true`** en todo lo nuevo (ya es el patrón del spec de animación) — nada se re-anima al volver a hacer scroll, evitando trabajo repetido.
- **No cargar `motion` de más**: los 4 `ModuleCard` nuevos reutilizan el mismo componente y las mismas variantes ya en el bundle — no agregan peso de JS nuevo, solo instancias.
- **Imágenes/SVG**: si el pulido de data-visuals requiere assets nuevos, deben ser SVG inline (como ya hace `DashboardMock`) en vez de PNG — cero peticiones extra, escalable sin blur.
- **Lighthouse antes/después**: correr `pnpm build` + Lighthouse (o el CLI de `aureo-landing:audit-website`) sobre la landing actual como baseline antes de tocar código, y comparar tras el refresh — el objetivo es no regresar LCP/CLS/TBT, no solo "que se vea bien".
- **CLS del toggle de precios**: la animación `layout` de `motion` en el toggle mensual/anual debe medirse con el mismo Lighthouse pass — `layout` de Framer/Motion puede introducir jank si el contenedor no tiene tamaño reservado; usar `layout="position"` en vez de `layout` completo si el ancho de las tarjetas no cambia.
- **10 módulos en el grid**: verificar que no se dispara un aumento de TBT por 10 `whileInView` observers simultáneos — usar `staggerContainer` (ya definido) para que las animaciones se secuencien desde un solo observer del contenedor padre, no uno por tarjeta, si el patrón actual no ya lo hace así.

## 7. Verificación

- Build/lint/typecheck limpios tras los cambios de `content/site.ts` (tipos `Module`, `Plan` ya existen — las nuevas entradas deben respetar esos tipos sin `any`).
- Revisión visual manual: 10 módulos no rompen el grid en mobile/tablet/desktop; orden de secciones nuevo se ve coherente al hacer scroll; toggle de precios anima sin salto de layout (CLS).
- FAQ y Comparativa no requieren edición en este refresh, pero se revisan de pasada por si algún texto ahora contradice el nuevo copy de Melyor (ej. la respuesta de FAQ sobre "qué es Melyor" si existe explícitamente — no se encontró ninguna en el `faq` actual, así que no aplica).
