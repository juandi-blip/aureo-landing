# Diseño: enriquecimiento de waitlist en 2 pasos + sección comparativa

Fecha: 2026-07-06

## Contexto

La landing sigue en fase lista de espera. `waitlist` en Supabase ya tiene columnas
`nombre`, `negocio`, `ciudad` (ver `supabase/schema.sql`) y `lib/validation.ts` ya
las acepta, pero `WaitlistForm.tsx` solo pide `email`. Además, tras un submit
exitoso el estado `success` deja un hueco visual raro en `Hero.tsx` porque el
`<p>{site.hero.nota}</p>` sigue mostrándose debajo de un mensaje corto (ver
capturas del usuario).

Se pide además una nueva sección que compare el "antes" (cuaderno/Excel, otro
software genérico) contra Aureo, para reforzar el dolor descrito en
`ProblemSection` antes de explicar la solución en `HowItWorks`.

## Parte 1 — Formulario de waitlist en 2 pasos

### Flujo

1. **Paso 1 (sin cambios de fondo):** el usuario llena solo `email` y da
   "Unirme". `POST /api/waitlist` inserta la fila como hoy (`email`, `origen`).
   Éxito → `state = "success"`.
2. **Paso 2 (nuevo):** en vez de solo mostrar el mensaje de éxito, `WaitlistForm`
   muestra un mini-formulario opcional para enriquecer el registro:
   - `nombre` — texto libre.
   - `negocio` — `<select>` nativo: Ferretería / Distribuidora / Depósito de
     construcción / Repuestos / Otro (con input de texto que aparece si elige
     "Otro").
   - `ciudad` — texto libre.
   - Botón primario "Completar perfil" y link secundario "Ahora no" que oculta
     el mini-form y deja solo el mensaje de éxito.
   - Al enviar, `PATCH /api/waitlist` con `{ email, nombre?, negocio?, ciudad? }`.
     Tras respuesta (éxito o error silencioso), se oculta el mini-form y se
     muestra un mensaje de agradecimiento final ("¡Gracias! Te avisaremos
     apenas lancemos.").

### Componente `WaitlistForm.tsx`

Nuevo estado interno: `step: "email" | "detalle" | "done"` (reemplaza el
booleano implícito de `state === "success"`).

- `state === "success"` (paso 1 ok) → `step = "detalle"`.
- Envío del mini-form o click en "Ahora no" → `step = "done"`.
- Render:
  - `step === "email"` → formulario actual (sin cambios).
  - `step === "detalle"` → mensaje corto de éxito + mini-form.
  - `step === "done"` → solo mensaje de éxito final.

`Hero.tsx` y `FinalCTA.tsx` no necesitan cambios propios para esto: el
componente ya encapsula todo. Único cambio en `Hero.tsx`: ocultar
`<p>{site.hero.nota}</p>` cuando el formulario ya no está en `step === "email"`
(pasar un callback `onStepChange` o exponer el estado vía prop `render`/hook
simple). Para no acoplar de más, `WaitlistForm` acepta un prop opcional
`onStateChange?: (step: Step) => void` que Hero usa solo para decidir si
mostrar la nota — así el hueco visual desaparece porque el mini-form ocupa
ese espacio.

### API

`app/api/waitlist/route.ts` gana un handler `PATCH`:

- Mismas guardas de origen/content-type/tamaño/rate-limit que `POST`.
- Body: `{ email: string, nombre?, negocio?, ciudad? }`. Reusa
  `parseWaitlistPayload` (ya soporta estos campos) pero en modo "update": si
  `email` no es válido, 400; los demás campos son opcionales y se recortan
  igual que hoy (`cap`).
- Ejecuta `update` (no insert/upsert) sobre `waitlist` filtrando por `email`,
  seteando solo las columnas presentes en el payload. Si no matchea ninguna
  fila, responde `{ ok: true }` igual (no revela si el email existe).
- **No** dispara `notifyNewSignup` — ese correo es solo para el registro
  inicial. El PATCH es enriquecimiento silencioso.

No se toca el `POST` existente ni el schema de Supabase (las columnas ya
existen).

### Testing

- Unit: `parseWaitlistPayload` ya cubierto; agregar caso de payload solo con
  `email` + un subconjunto de campos opcionales para el PATCH.
- E2E (`e2e/`): flujo feliz — enviar email, ver mini-form, llenar nombre +
  seleccionar negocio "Otro" (verifica que aparece el input libre) + ciudad,
  enviar, ver mensaje final. Caso "Ahora no" oculta el mini-form directo.

## Parte 2 — Sección comparativa

### Ubicación

Nuevo componente `components/ComparisonSection.tsx`, importado en
`app/page.tsx` entre `<ProblemSection />` y `<HowItWorks />`.

### Contenido (`content/site.ts`)

Nueva entrada `site.comparativa`:

```ts
comparativa: {
  titulo: "Por qué Aureo gana donde el cuaderno y el Excel se quedan cortos.",
  columnas: ["Cuaderno o Excel", "Otro software", "Aureo"],
  filas: [
    { criterio: "Ubicar productos sin perder tiempo", valores: ["no", "parcial", "si"] },
    { criterio: "Saber qué rota y qué no", valores: ["no", "parcial", "si"] },
    { criterio: "Despacho rápido y guiado", valores: ["no", "no", "si"] },
    { criterio: "Inventario que siempre cuadra", valores: ["no", "parcial", "si"] },
    { criterio: "Precio para negocio pequeño", valores: ["si", "no", "si"] },
    { criterio: "Empieza a usarse en minutos", valores: ["si", "no", "si"] },
  ],
},
```

`valores` usa el tipo `"si" | "no" | "parcial"` para renderizar ✓ / ✗ / ~ con
color (`--emerald`, `--terracotta`, `--text-muted`), mismo lenguaje visual que
los checks de `PricingCard`.

### Estructura visual

- Mismo patrón de sección que `ProblemSection`: fondo `--bg-navy` o
  `--bg-base` (definir por contraste con las secciones vecinas — usar
  `--bg-base` ya que `ProblemSection` usa navy y no conviene repetir fondo
  oscuro dos veces seguidas), `SectionHeading`, eyebrow tipo "La comparación".
- Tabla responsive: en desktop, tabla real de 4 columnas (criterio + 3);
  en mobile, se colapsa a tarjetas apiladas por criterio (mismo criterio que
  usa `PricingTable`/`ModulesGrid` para su grid responsive — revisar patrón
  existente antes de reinventar).
- Columna "Aureo" destacada con fondo sutil `--bronze`/10 y borde, igual
  tratamiento que la card `destacado` en `PricingCard`.
- Animación: `fadeUp`/`staggerContainer` de `lib/motion`, igual que el resto
  de secciones.

### Testing

- Visual/manual: revisar en mobile que la tabla colapsa legible.
- No hay lógica de negocio nueva (contenido estático), no requiere tests
  unitarios más allá de un smoke render si el proyecto ya tiene ese patrón
  para otras secciones estáticas.

## Fuera de alcance

- No se reactiva `SecuritySection` (sigue deshabilitada, sin pasarela de
  pago).
- No se agregan competidores reales nombrados.
- No se cambia el schema de Supabase (columnas ya existen).
