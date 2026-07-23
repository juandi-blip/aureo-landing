# Diseño: presencia visual e interactividad "motor de Aureo" en Melyor

Fecha: 2026-07-23

## Contexto

`aureo-demo/melyor.js` ya tiene el panel lateral rediseñado (ver
`docs/superpowers/specs/2026-07-23-melyor-side-panel-design.md` y el plan
correspondiente, ya implementados y en producción-lista): trigger en el
header, panel overlay 420px/full-screen mobile, persistencia de
abierto/cerrado, botón de nueva conversación, y markdown básico
(`renderMelyorMarkdown`/`applyInlineMarkdown`) para negrita y listas en
respuestas del asistente.

Problema: aun con ese rediseño, Melyor todavía se *siente* como un widget
de chat de soporte genérico — burbujas de texto, un "Pensando..." estático,
sin nada que comunique que es el motor de datos/optimización de Aureo, no
un chatbot de FAQ. El usuario quiere que la interfaz proyecte esa potencia
sin construir todavía ejecución real de acciones (eso es un proyecto
aparte: backend nuevo, permisos, confirmaciones — explícitamente fuera de
alcance de esta iteración).

## Decisiones (confirmadas con el usuario)

- **Alcance: solo visual/interacción.** Melyor sigue siendo consulta/chat
  sobre el contexto ya calculado (`buildMelyorContext()`, sin cambios). No
  ejecuta acciones reales todavía.
- **Indicador de "trabajando" contextual:** reemplaza el `"Pensando..."`
  estático por un mensaje elegido según palabras clave de la pregunta del
  usuario (mismo criterio de detección que ya usa `mockMelyorReply`),
  calculado antes de enviar el fetch y mostrado mientras `melyorBusy` es
  `true`.
- **Tarjetas de datos vía patrón de markdown, sin backend nuevo:** el
  parser existente (`renderMelyorMarkdown`) se extiende para reconocer el
  patrón "línea en `**negrita**` sola, seguida de una lista" y envolver
  ese bloque en un contenedor con tratamiento visual de tarjeta (fondo
  diferenciado, borde de acento, ícono de categoría). El backend sigue
  devolviendo markdown plano sin cambios de contrato — el "diseño de
  tarjeta" es interpretación 100% del frontend.
- **Chips de acción sugerida:** el backend puede terminar una respuesta con
  una línea marcador `SUGERENCIA: <texto de la acción>` (formato exacto,
  ver Arquitectura). El frontend detecta esa línea, la separa del cuerpo
  del mensaje, y la renderiza como un chip clickeable debajo de la
  burbuja. Click → llena el input con ese texto y lo envía como pregunta
  nueva (mismo flujo que escribir y enviar a mano) — NO ejecuta ninguna
  acción real, solo dispara una nueva consulta de chat.
- **Identidad visual con más presencia:** el trigger del header y el
  header del panel usan el gradiente de marca existente
  (`--accent-gold-gradient`, azul marino) con más protagonismo: glow sutil
  permanente en el trigger (no solo hover), pulso leve en el ícono/avatar
  mientras Melyor está "trabajando". No se introduce un color nuevo al
  sistema de diseño.
- **Chips de sugerencias en el estado vacío:** se reusa el mismo
  componente de chip para mostrar 3 sugerencias iniciales clickeables
  ("¿Qué productos están bajo stock?", "Clientes más valiosos", "Facturas
  pendientes") en lugar del texto estático actual del estado vacío.
- Explícitamente fuera de alcance: ejecución real de acciones, permisos,
  confirmaciones, cualquier cambio a `buildMelyorContext()` o al contrato
  `{ question, context, history }` → `{ reply }`.

## Arquitectura

Todo el cambio sigue contenido en los mismos 2 archivos de `aureo-demo`
del spec anterior, sin build ni dependencias nuevas:

```
melyor.js           → nueva función detectMelyorCategory(text), mensajes
                       de trabajo contextuales, extensión del parser de
                       markdown para tarjetas y chips de sugerencia,
                       chips del estado vacío, CSS de identidad visual
api/melyor-chat.js  → SYSTEM_PROMPT: instrucción para el marcador
                       SUGERENCIA: opcional al final de la respuesta
```

### Categoría compartida (`detectMelyorCategory`)

Una única función, reusada por el indicador de trabajo y por el ícono de
las tarjetas — evita mantener dos detectores de keywords separados:

```js
function detectMelyorCategory(text) {
    const q = text.toLowerCase();
    if (q.includes("stock") || q.includes("inventario") || q.includes("reorden")) return "stock";
    if (q.includes("cliente")) return "clientes";
    if (q.includes("factura") || q.includes("venta") || q.includes("kpi")) return "facturas";
    return "generico";
}
```

Mapeo categoría → mensaje de trabajo:

| Categoría | Mensaje mientras `melyorBusy` |
|---|---|
| `stock` | "Revisando inventario..." |
| `clientes` | "Cruzando datos de clientes..." |
| `facturas` | "Analizando facturación..." |
| `generico` | "Procesando tu consulta..." |

Mapeo categoría → ícono de tarjeta: reusa los mismos glifos ya presentes
en el sidebar de `index.html` para Inventario/Clientes/Facturación (no se
diseñan íconos nuevos) — para `generico`, un ícono simple de chispa/nodo
genérico. Sin color-coding por categoría (evita pisar el significado
semántico ya establecido de `--accent-rose`=error/`--accent-emerald`=éxito
en el resto de la app); todas las tarjetas usan el mismo tratamiento
neutro con borde de acento en azul marino.

### Tarjetas de datos (extensión de `renderMelyorMarkdown`)

Patrón a detectar dentro del texto ya escapado (misma disciplina de
seguridad que hoy: escapar primero, interpretar después): una línea que,
tras aplicarle `applyInlineMarkdown`, resulta enteramente envuelta en
`<strong>...</strong>` (es decir, la línea original era `**texto**` sola,
sin nada más), inmediatamente seguida de uno o más ítems de lista. Ese
bloque completo (título + lista) se envuelve en un `<div
class="melyor-card">` con el ícono de `detectMelyorCategory` aplicado
sobre el título de la tarjeta en vez de en un `<p><strong>`/`<ul>` sueltos.
Título+lista que NO cumplen el patrón exacto (ej. negrita en medio de una
oración) siguen renderizando como hoy (párrafo con `<strong>` inline).

### Chips de sugerencia de acción

Contrato del marcador: el backend puede agregar, como última línea de la
respuesta (después de una línea en blanco), exactamente:

```
SUGERENCIA: ¿texto de la acción en forma de pregunta?
```

El frontend, en `renderMelyorMarkdown` (o una función auxiliar que este
llama antes de procesar el resto), busca ese marcador con
`/^SUGERENCIA:\s*(.+)$/m` sobre el texto ya escapado, lo extrae y lo
excluye del cuerpo renderizado normalmente. Si hay match, se agrega un
`<button class="melyor-chip">` con el texto capturado, hijo del mismo
contenedor de la burbuja (no del cuerpo del mensaje), con un handler que
llena `#melyor-input` con ese texto y llama al mismo flujo de envío que
`handleMelyorSubmit` (reenviando el `<form>` o invocando `sendMelyorMessage`
directamente con ese texto).

Los chips de sugerencias del **estado vacío** usan el mismo componente
visual `.melyor-chip`, con textos fijos (no vienen de ningún backend):
"¿Qué productos están bajo stock?", "Clientes más valiosos", "Facturas
pendientes" — mismo handler de click (llenar input + enviar).

### Identidad visual

- `.melyor-trigger`: agrega un `box-shadow` con el glow del acento de
  marca (`var(--accent-gold-glow)`) de forma permanente (hoy solo existe
  en `:hover`), sutil pero visible en reposo.
- `.melyor-panel-header`: el gradiente ya existente
  (`var(--accent-gold-gradient)`) gana una sombra interna sutil
  (`box-shadow: inset ...`) para sensación de profundidad.
- Ícono/avatar del header: nueva clase `.melyor-pulse`, aplicada
  condicionalmente (vía JS, agregando/quitando la clase) mientras
  `melyorBusy` es `true` — animación CSS `@keyframes` de opacidad/escala
  sutil, sin dependencias nuevas.

### Backend — marcador de sugerencia en el prompt

`SYSTEM_PROMPT` en `api/melyor-chat.js` gana una instrucción adicional
(además de la ya existente sobre listas/negrita de la iteración anterior):
cuándo y cómo usar la línea `SUGERENCIA: ...` — solo cuando hay una acción
concreta de seguimiento con sentido (no en cada respuesta), como última
línea, formato exacto. No se puede probar contra la API real en este
entorno (sin `ANTHROPIC_API_KEY`, igual que la iteración anterior) — la
verificación es vía `AI_MOCK_MODE`/inyección manual en consola, igual que
se hizo para el markdown básico.

## Testing / verificación

Mismo enfoque que la iteración anterior — sin test runner ni build en
`aureo-demo`, verificación manual en navegador:

- Indicador de trabajo: enviar preguntas con distintas keywords, confirmar
  el mensaje contextual correcto mientras `melyorBusy` es `true`.
- Tarjetas: inyectar en consola un mensaje de asistente con el patrón
  `**Título**\n- item\n- item` y confirmar que renderiza como tarjeta con
  ícono, no como párrafo+lista sueltos.
- Chips de sugerencia: inyectar un mensaje con `SUGERENCIA: ...` al final,
  confirmar que aparece el chip y que el texto no se duplica en el cuerpo
  del mensaje; click en el chip debe enviar esa pregunta.
- Chips de estado vacío: abrir el panel sin historial, confirmar los 3
  chips, click en cada uno debe enviar la pregunta correspondiente.
- Identidad visual: confirmar glow permanente en el trigger (sin hover),
  confirmar que el ícono pulsa solo mientras `melyorBusy` es `true` y para
  al recibir respuesta.
- Regresión: re-confirmar que el estado `not_configured` y el flujo de
  markdown básico (negrita/listas fuera del patrón de tarjeta) de la
  iteración anterior siguen funcionando sin cambios.
