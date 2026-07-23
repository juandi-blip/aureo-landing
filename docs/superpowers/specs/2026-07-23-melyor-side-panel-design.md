# Diseño: panel lateral de Melyor (aureo-demo)

Fecha: 2026-07-23

## Contexto

Melyor es el asistente de IA embebido en `aureo-demo` (ver `melyor.js` +
`api/melyor-chat.js`), la feature diferencial del MVP de Aureo. Hoy es un
widget flotante: un botón circular abajo a la izquierda que abre un popup
chico (340×460px). El backend (`api/melyor-chat.js`) es una función
serverless de Vercel sin dependencias npm que hace de proxy hacia la API de
Anthropic (modelo `claude-haiku-4-5`), inactiva hoy a propósito (sin
`ANTHROPIC_API_KEY` configurada — no hay clientes pagos aún) y responde
`{ error: "not_configured" }`, que el frontend ya muestra como mensaje
amigable.

`aureo-demo` es una app estática sin build ni framework (HTML/CSS/JS plano,
sin git). Este spec vive en `aureo-landing` por convención del proyecto
(único repo con git de los dos), pero todos los archivos que cambian están
en `aureo-demo`.

Problema: el widget flotante actual subestima visualmente la feature más
importante del producto, y no está pensado para el plan de convertir
`aureo-demo` en una app de Play Store a futuro (el patrón "popup flotante"
no se traduce a una pantalla nativa).

## Decisiones (confirmadas con el usuario)

- Se reemplaza el widget flotante por un panel que cambia de forma según
  el viewport:
  - **Desktop (≥1024px):** panel *overlay* anclado al borde derecho, ancho
    fijo ~420px, alto completo (100vh), sin scrim — el dashboard detrás
    queda totalmente interactivo (Melyor es un copiloto en paralelo, no
    un modal que interrumpe).
  - **Mobile (<1024px):** panel *full-screen*, entra deslizando desde la
    derecha, ocupa el 100% del viewport (la barra de navegación de AUREO
    no queda visible detrás). Es el patrón que se reusará 1:1 en la futura
    app nativa de Play Store.
  - El breakpoint de 1024px reutiliza el que ya usa el drawer del sidebar
    (`@media (max-width: 1024px)` en `styles.css`), para consistencia.
- **Trigger único** (mismo botón para desktop y mobile): ícono nuevo dentro
  de `.header-actions` en el `<header class="top-header">` de
  `index.html`, al lado del botón de notificaciones existente. Reusa el
  estilo visual de `.notifications-btn` (44×44px, fondo blanco, borde
  arena, hover azul marino) — no un botón flotante (FAB) nuevo.
- **Persistencia de estado abierto/cerrado:** vía `localStorage` — si el
  usuario lo dejó abierto, sigue abierto al cambiar de módulo
  (`switchTab`) o recargar la página.
- **Historial de conversación:** NO persiste — vive solo en memoria
  (`melyorMessages`, como hoy) y se pierde al recargar. Evita mostrar
  contexto potencialmente desactualizado (stock/facturas ya cambiaron).
- **Botón "+" (nueva conversación):** limpia `melyorMessages` sin cerrar
  el panel.
- Explícitamente fuera de alcance: indicador "En línea" (sería cosmético,
  no hay estado de conexión real que mostrar) y botón "?" de ayuda (sin
  destino definido).
- **Formato de respuestas — markdown básico:** `SYSTEM_PROMPT` en
  `api/melyor-chat.js` deja de pedir "texto plano, sin markdown pesado" y
  pasa a permitir listas (`- item`) y negritas (`**texto**`) cuando la
  respuesta incluye datos tabulares (ej. productos bajo stock mínimo). El
  backend sigue devolviendo `{ reply: string }` sin cambios de contrato.
  El frontend escapa el texto crudo primero (`escapeHtml`, como hoy) y
  recién sobre ese texto ya escapado aplica un parser liviano de markdown
  — nunca se inyecta markdown sin escapar. No se implementan tarjetas de
  datos estructuradas (JSON tipado) en esta iteración.

## Arquitectura

Todo el cambio queda contenido en 3 archivos de `aureo-demo`, sin build ni
dependencias nuevas:

```
index.html          → agrega el botón trigger dentro de .header-actions
melyor.js           → reemplaza el markup/CSS del panel (launcher+popup
                       chico → trigger+panel responsive) y agrega:
                       - lectura/escritura de localStorage (estado abierto)
                       - botón "+" nueva conversación
                       - parser de markdown básico en renderMelyorMessages()
api/melyor-chat.js  → una línea: SYSTEM_PROMPT permite markdown liviano
```

No se toca `buildMelyorContext()`, el contrato `{ question, context,
history }` → `{ reply }`, ni el manejo de errores/`not_configured`
existente — todo eso ya funciona y queda igual.

### Componentes del panel

- **Header:** nombre "Melyor" + ícono/avatar, botón "+" (nueva
  conversación), botón cerrar (×).
- **Área de mensajes:** igual que hoy (burbujas usuario/asistente,
  indicador "Pensando..."), más el parser de markdown básico.
- **Estado vacío:** mismo texto orientativo que hoy
  ("Preguntame sobre stock bajo, clientes inactivos..."). No se agregan
  chips de sugerencias en esta iteración (no estaba en las decisiones
  confirmadas — YAGNI, se puede sumar después si se ve la necesidad).
- **Input inferior:** igual que hoy (campo + botón enviar), sin el botón
  "?" del mockup de referencia.

### Estados del panel (CSS)

Reemplaza las clases actuales (`.melyor-launcher`, `.melyor-panel` con
posición fija abajo-izquierda) por:

- `.melyor-trigger` — vive dentro de `.header-actions`, mismo tamaño/estilo
  que `.notifications-btn`, con estado `.active` cuando el panel está
  abierto (mismo criterio visual que ya usa `.melyor-launcher.active` hoy).
- `.melyor-panel` — comportamiento por breakpoint:
  - Desktop (≥1024px): `position: fixed; top:0; right:0; bottom:0; width: 420px;`
    con `transform: translateX(100%)` → `translateX(0)` al abrir
    (mismo patrón de animación que ya usa `.sidebar` para el drawer mobile,
    pero en sentido inverso — desde la derecha).
  - Mobile (<1024px): `position: fixed; inset: 0; width: 100%;` con la
    misma transición de `translateX`.
- Sin `.melyor-panel-overlay` / scrim — se elimina esa posibilidad de
  diseño, no se implementa.

### Persistencia (localStorage)

Nueva clave, ej. `melyor_panel_open` (`"1"` / ausente), escrita en
`toggleMelyorPanel()` y leída en `initMelyorWidget()` para fijar el estado
inicial del panel al cargar la página. Es independiente de las claves
`aura_*` / `vulcan_*` que el modo demo resetea al expirar la sesión
(`demo-gate.js`) — cuando esas se limpian, `melyor_panel_open` puede
persistir sin problema porque no contiene datos de negocio, solo una
preferencia de UI.

## Testing / verificación

`aureo-demo` no tiene test runner ni build (confirmado: no hay
`package.json`, `*.test.js` ni `*.spec.js` en el proyecto). La
verificación es manual en navegador, igual que el resto de la app:

- Desktop: abrir/cerrar desde el trigger del header, confirmar que el
  dashboard sigue siendo clickeable con el panel abierto, confirmar que
  el estado persiste al cambiar de tab y al recargar.
- Mobile (viewport <1024px o dispositivo real): confirmar que el panel
  ocupa el 100% de la pantalla y no deja ver la nav de AUREO detrás.
- Confirmar que "+`" limpia el historial visual sin cerrar el panel.
- Confirmar que una respuesta con lista markdown (`- item`, `**texto**`)
  se renderiza como viñetas/negritas y no como texto crudo con asteriscos.
- Confirmar que el estado `not_configured` (sin `ANTHROPIC_API_KEY`) sigue
  mostrando el mensaje amigable existente, sin regresión.
