# Diseño: credibilidad de la landing + reflejar el rediseño de Melyor

Fecha: 2026-08-04

## Contexto

El pedido original era mucho más amplio: agregar login/registro real de
usuarios a la landing, auditar la landing en general, resolver si un login
choca con la lista de espera, y reflejar cambios recientes de producto. Se
decompuso en sub-proyectos independientes (ver decisión más abajo); este
spec cubre solo el de landing — auditoría de credibilidad + reflejar el
rediseño visual de Melyor. El login/registro real (que implicaría construir
el producto Aureo desde cero, hoy inexistente fuera del prototipo estático
`aureo-demo`) y la futura app móvil para Play Store quedan **fuera de
alcance**, como iniciativas propias a diseñar por separado.

Estado actual verificado:
- `aureo-landing`: Next.js 16, waitlist vía `/api/waitlist` (Supabase),
  demo gateado por email vía `/api/demo-token` (token HMAC efímero).
  `Nav.tsx` solo tiene un CTA ("Unirme" → `#waitlist`), sin ningún link de
  login.
- `aureo-demo`: prototipo estático (HTML/JS) del producto, con auth
  hardcodeada de 3 roles (`admin`/`warehouse`/`cashier`) solo para la
  experiencia de demo — no es un sistema de cuentas real.
- `aureo`: vacío (solo config de `shadcn`), el producto real todavía no
  existe como app.
- `MelyorSection.tsx` en la landing es texto + iconos genéricos; no refleja
  el rediseño visual que ya está en producción en `aureo-demo/melyor.js`
  (panel lateral, glow de marca, chips de sugerencia, tarjetas de datos vía
  markdown — specs `2026-07-23-melyor-side-panel-design.md` y
  `2026-07-23-melyor-power-presence-design.md`).
- `SecuritySection.tsx` está deshabilitada a propósito (sin pasarela de
  pago aún) — se conserva así, sin cambios en este spec.
- `fundadores.socialProofPlaceholder` en `content/site.ts` ya usa un
  placeholder honesto ("Primeras implementaciones en curso") en vez de
  prueba social inventada — patrón a preservar, no a "arreglar".

## Decisiones (confirmadas con el usuario)

- **No se agrega login/"Iniciar sesión" a la landing.** Sin cuenta real
  detrás sería un placeholder engañoso. El Nav queda con un único CTA
  ("Unirme"). Se retoma como parte del diseño del producto real, el día
  que exista.
- **Foco del audit: credibilidad/confianza**, no SEO/performance/copy
  general (esos quedan para una iteración futura si hace falta).
- **No se menciona la app móvil / Play Store en la landing** en este
  ciclo. No comprometer públicamente algo sin nada real que mostrar.
- **No se agregan fotos de los fundadores en este ciclo.** `FoundersStory`
  queda como está (solo texto); se revisita cuando haya fotos reales
  disponibles.
- **Melyor se muestra con capturas reales**, no solo texto actualizado —
  mostrar el producto real en desarrollo activo es en sí mismo una señal
  de confianza.

## Alcance

### 1. Reflejar el rediseño de Melyor con capturas reales

- Levantar `aureo-demo` (local) y capturar 1–2 screenshots del panel de
  Melyor: el trigger con el glow de marca, y una conversación que muestre
  una tarjeta de datos (patrón `**negrita** + lista`) junto con un chip de
  sugerencia clickeable.
- Optimizar y guardar como PNG/WebP en `public/` de `aureo-landing`.
- Reestructurar `MelyorSection.tsx`: la captura pasa a ser la pieza visual
  principal (vía `next/image`), acompañada de 3–4 bullets cortos (reducir
  desde los 6 actuales) que hablen de lo que la captura muestra —
  chips de sugerencia, tarjetas de datos, respuesta en lenguaje natural —
  en vez de listar las 6 capacidades genéricas actuales.
- Actualizar `melyor.nota` en `content/site.ts` para reflejar que Melyor
  sigue evolviendo, sin prometer fechas ni features futuras concretas.

### 2. Cerrar gaps de credibilidad

- **FAQ:** agregar una entrada nueva en `content/site.ts` → `faq` que
  responda (indirectamente) la objeción silenciosa "¿y si el proyecto no
  despega?" — reforzando que no se pide tarjeta y que el precio de
  fundador queda congelado (reusa lo que ya dice `preciosNota`).
- **Footer:** agregar una mención mínima de "operamos desde Colombia" en
  `Footer.tsx` (hoy ese dato solo vive enterrado en `/terminos`).
- **`socialProofPlaceholder`:** no se toca a menos que el usuario
  provea un dato concreto y verdadero para reemplazarlo (ej. número real
  de conversaciones, un rubro piloto). Si no hay nada concreto al momento
  de implementar, se deja como está — no se inventa prueba social.

### Fuera de alcance (explícito)

- Login/registro real de usuarios y el producto Aureo en sí (diseño
  aparte, proyecto grande).
- App móvil / Play Store (sin fecha, sin mención pública todavía).
- Reactivar `SecuritySection` (bloqueado por falta de pasarela de pago
  real, no relacionado a este trabajo).
- Fotos de los fundadores en `FoundersStory`.
- SEO, performance, y coherencia de copy generales (no era el foco
  elegido para este ciclo).

## Testing

- Visual: verificar en desktop y mobile que `MelyorSection` con imagen no
  rompe el layout ni el contraste de texto sobre el fondo `--bg-navy`.
- `pnpm test` / `pnpm e2e` existentes no deberían verse afectados (son
  cambios de contenido/imagen, no de lógica de API ni de guards).
- Revisión manual de que el nuevo FAQ item y la línea de footer no
  contradicen el copy de `preciosNota`/`garantias` ya existente.
