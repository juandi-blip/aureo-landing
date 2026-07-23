# Panel lateral de Melyor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el widget flotante de Melyor (botón + popup chico abajo-izquierda) por un panel responsive: overlay anclado a la derecha en desktop, full-screen en mobile, con trigger en el header, persistencia del estado abierto/cerrado, botón de nueva conversación y soporte de markdown básico en las respuestas.

**Architecture:** Todo el cambio vive en 2 archivos estáticos de `aureo-demo` (sin build, sin dependencias): `melyor.js` (trigger + panel + estilos inyectados + lógica de chat) y `api/melyor-chat.js` (una línea de prompt). No se toca `index.html` — el trigger se inyecta vía JS dentro de `.header-actions`, que ya existe en el DOM antes de que `melyor.js` se ejecute (carga al final del `<body>`).

**Tech Stack:** HTML/CSS/JS vanilla, sin framework, sin bundler. Backend: función serverless de Vercel (`api/melyor-chat.js`, Node.js, sin dependencias npm, `fetch` nativo).

## Global Constraints

- `aureo-demo` **no es un repositorio git** (confirmado: `git status` devuelve "not a git repository"). Ningún paso de este plan incluye `git commit` para archivos de `aureo-demo` — no hay mecanismo de versionado local, y no hay que inventarlo.
- `aureo-demo` **no tiene test runner, build ni `package.json`** (confirmado: no hay `*.test.js` ni `*.spec.js` en el proyecto). La verificación de cada tarea es manual, en navegador, contra un servidor estático local (`python -m http.server`) — no hay paso de "correr tests".
- **No desplegar a producción como parte de este plan.** `vercel --prod` es una acción visible/compartida que requiere pedido explícito del usuario en cada ocasión (ya establecido en este proyecto). La última tarea termina en verificación manual local; el deploy se solicita aparte.
- **Setup de prueba local (repetido en cada tarea que requiere ver el panel funcionando):** `demo-gate.js` bloquea el acceso sin un token válido, incluso en local (no hay bypass de localhost). Para probar sin pasar por el flujo completo de la landing, abrir la consola del navegador ANTES de que cargue la página (o recargar tras ejecutarlo) y correr:
  ```js
  sessionStorage.setItem("aura_demo_session", JSON.stringify({ exp: Date.now() + 30 * 60 * 1000 }));
  ```
  Esto simula una sesión de demo válida por 30 minutos. Luego navegar/recargar `index.html` normalmente — `auth.js` autologuea como `admin` si no hay sesión de usuario propia.
- Todo texto visible es en español, tono directo (consistente con el resto de `aureo-demo` y con `SYSTEM_PROMPT` de Melyor).
- Los colores/tokens de diseño a usar son los ya definidos en `aureo-demo/styles.css` (`--bg-surface`, `--border-subtle`, `--text-primary`, `--accent-gold`, `--radius-md`, etc.) — no introducir valores hardcodeados nuevos fuera de los ya usados en el archivo.

---

### Task 1: Mover el trigger al header y restylearlo

**Files:**
- Modify: `aureo-demo/melyor.js:37-74` (`initMelyorWidget`)
- Modify: `aureo-demo/melyor.js:76-86` (`toggleMelyorPanel`)
- Modify: `aureo-demo/melyor.js:296-439` (`injectMelyorStyles` — reglas `.melyor-launcher`)

**Interfaces:**
- Consumes: `.header-actions` (contenedor ya existente en `aureo-demo/index.html:207`, junto a `.date-badge` y `.notifications-btn`).
- Produces: elemento `#melyor-trigger` (reemplaza a `#melyor-launcher`) dentro de `.header-actions`; clase CSS `.melyor-trigger` (con modificador `.active`). Tareas siguientes (2, 3, 4) siguen usando `#melyor-panel`, `toggleMelyorPanel()`, `melyorOpen` sin cambios de nombre.

- [ ] **Step 1: Reemplazar la creación del botón en `initMelyorWidget`**

En `aureo-demo/melyor.js`, reemplazar (líneas 37-48):

```js
function initMelyorWidget() {
    if (document.getElementById("melyor-launcher")) return; // ya inicializado
    injectMelyorStyles();

    const launcher = document.createElement("button");
    launcher.id = "melyor-launcher";
    launcher.type = "button";
    launcher.className = "melyor-launcher";
    launcher.setAttribute("aria-label", "Abrir Melyor");
    launcher.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 L20 7 L20 17 L12 22 L4 17 L4 7 Z"/><path d="M7.5 15.5 L7.5 8.5 L12 13 L16.5 8.5 L16.5 15.5"/></svg>';
    launcher.addEventListener("click", toggleMelyorPanel);
```

por:

```js
function initMelyorWidget() {
    if (document.getElementById("melyor-trigger")) return; // ya inicializado
    const headerActions = document.querySelector(".header-actions");
    if (!headerActions) return; // esta página no tiene top-header
    injectMelyorStyles();

    const trigger = document.createElement("button");
    trigger.id = "melyor-trigger";
    trigger.type = "button";
    trigger.className = "melyor-trigger";
    trigger.setAttribute("aria-label", "Abrir Melyor");
    trigger.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 L20 7 L20 17 L12 22 L4 17 L4 7 Z"/><path d="M7.5 15.5 L7.5 8.5 L12 13 L16.5 8.5 L16.5 15.5"/></svg>';
    trigger.addEventListener("click", toggleMelyorPanel);
```

Y reemplazar (líneas 67-68):

```js
    document.body.appendChild(launcher);
    document.body.appendChild(panel);
```

por:

```js
    headerActions.appendChild(trigger);
    document.body.appendChild(panel);
```

- [ ] **Step 2: Renombrar referencias en `toggleMelyorPanel`**

Reemplazar (líneas 76-86):

```js
function toggleMelyorPanel() {
    melyorOpen = !melyorOpen;
    const panel = document.getElementById("melyor-panel");
    const launcher = document.getElementById("melyor-launcher");
    if (panel) panel.classList.toggle("open", melyorOpen);
    if (launcher) launcher.classList.toggle("active", melyorOpen);
    if (melyorOpen) {
        const input = document.getElementById("melyor-input");
        if (input) setTimeout(() => input.focus(), 60);
    }
}
```

por:

```js
function toggleMelyorPanel() {
    melyorOpen = !melyorOpen;
    const panel = document.getElementById("melyor-panel");
    const trigger = document.getElementById("melyor-trigger");
    if (panel) panel.classList.toggle("open", melyorOpen);
    if (trigger) trigger.classList.toggle("active", melyorOpen);
    if (melyorOpen) {
        const input = document.getElementById("melyor-input");
        if (input) setTimeout(() => input.focus(), 60);
    }
}
```

- [ ] **Step 3: Restylear el botón en `injectMelyorStyles`**

Reemplazar el bloque CSS (líneas 301-321):

```css
        .melyor-launcher {
            position: fixed;
            bottom: 2.5rem;
            left: 2.5rem;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            border: none;
            background: var(--accent-gold-gradient, var(--accent-gold));
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
            z-index: 1900;
            transition: transform 0.15s ease;
        }
        .melyor-launcher:hover { transform: scale(1.06); }
        .melyor-launcher svg { width: 26px; height: 26px; }
        .melyor-launcher.active { background: var(--accent-rose-gradient, var(--accent-rose)); }
```

por:

```css
        .melyor-trigger {
            position: relative;
            width: 44px;
            height: 44px;
            border-radius: var(--radius-md, 12px);
            border: 1px solid var(--border-subtle, #E7DCC8);
            background: var(--bg-surface, #fff);
            color: var(--text-primary, #241F1A);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            flex-shrink: 0;
            transition: border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
        }
        .melyor-trigger:hover {
            border-color: var(--accent-gold, #2E4A6E);
            color: var(--accent-gold, #2E4A6E);
            box-shadow: 0 0 10px var(--accent-gold-glow, rgba(46, 74, 110, 0.15));
        }
        .melyor-trigger svg { width: 20px; height: 20px; stroke-width: 2; }
        .melyor-trigger.active {
            background: var(--accent-gold, #2E4A6E);
            border-color: var(--accent-gold, #2E4A6E);
            color: #fff;
        }
```

- [ ] **Step 4: Verificación manual en navegador**

1. Servir `aureo-demo` localmente: `cd aureo-demo && python -m http.server 8000`.
2. Abrir `http://localhost:8000/index.html`, abrir devtools y correr el snippet de sesión del apartado "Setup de prueba local" en Global Constraints, luego recargar la página.
3. Confirmar que el ícono de Melyor aparece dentro del header, a la izquierda del botón de notificaciones (mismo tamaño 44×44px, mismo estilo de borde que el botón de notificaciones).
4. Confirmar que YA NO aparece ningún botón circular flotante abajo a la izquierda.
5. Click en el ícono: debe ponerse en estado activo (fondo azul marino) y el panel debe abrirse (todavía con la posición/tamaño viejos — se corrige en la Tarea 2).
6. Click de nuevo: vuelve a estado inactivo y el panel se cierra.

- [ ] **Step 5: No hay commit — `aureo-demo` no tiene repositorio git (ver Global Constraints).**

---

### Task 2: Panel responsive — overlay derecho en desktop, full-screen en mobile

**Files:**
- Modify: `aureo-demo/melyor.js` (bloque CSS `.melyor-panel` dentro de `injectMelyorStyles`, y el `@media (max-width: 640px)` final)

**Interfaces:**
- Consumes: clase `.open` en `#melyor-panel` (ya manejada por `toggleMelyorPanel`, Task 1).
- Produces: breakpoint de 1024px para `.melyor-panel` (mismo breakpoint que ya usa el drawer del sidebar en `styles.css:3211`). Tareas siguientes no dependen de nombres nuevos acá, solo de que `#melyor-panel` siga existiendo.

- [ ] **Step 1: Reemplazar el bloque de posicionamiento del panel**

Reemplazar (dentro de `injectMelyorStyles`, bloque `.melyor-panel` / `.melyor-panel.open`):

```css
        .melyor-panel {
            position: fixed;
            bottom: 6.5rem;
            left: 2.5rem;
            width: 340px;
            max-width: calc(100vw - 3rem);
            height: 460px;
            max-height: calc(100vh - 9rem);
            background: var(--bg-surface, #fff);
            border: 1px solid var(--border-subtle, #E7DCC8);
            border-radius: var(--radius-md, 12px);
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
            display: flex;
            flex-direction: column;
            opacity: 0;
            transform: translateY(12px);
            pointer-events: none;
            transition: opacity 0.15s ease, transform 0.15s ease;
            z-index: 1901;
            overflow: hidden;
        }
        .melyor-panel.open {
            opacity: 1;
            transform: translateY(0);
            pointer-events: auto;
        }
```

por:

```css
        .melyor-panel {
            position: fixed;
            top: 0;
            right: 0;
            bottom: 0;
            width: 420px;
            max-width: 100vw;
            height: 100vh;
            background: var(--bg-surface, #fff);
            border-left: 1px solid var(--border-subtle, #E7DCC8);
            box-shadow: -20px 0 50px rgba(0, 0, 0, 0.25);
            display: flex;
            flex-direction: column;
            transform: translateX(100%);
            pointer-events: none;
            transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 1901;
            overflow: hidden;
        }
        .melyor-panel.open {
            transform: translateX(0);
            pointer-events: auto;
        }
```

- [ ] **Step 2: Reemplazar el media query final**

Reemplazar (bloque al final de la plantilla de estilos):

```css
        @media (max-width: 640px) {
            .melyor-panel { left: 1rem; bottom: 5.75rem; width: calc(100vw - 2rem); }
            .melyor-launcher { left: 1rem; bottom: 1.5rem; }
        }
```

por:

```css
        @media (max-width: 1024px) {
            .melyor-panel {
                width: 100%;
                border-left: none;
            }
        }
```

- [ ] **Step 3: Verificación manual en navegador**

1. Con el servidor local corriendo y la sesión simulada activa (ver Task 1, Step 4.2), recargar `index.html` en una ventana ancha (≥1024px, ej. maximizada en un monitor de escritorio).
2. Abrir el panel desde el trigger del header: debe deslizar desde la derecha, ancho fijo (~420px), alto completo, sin bordes redondeados, con el dashboard detrás totalmente visible y clickeable (probar hacer click en una card del dashboard con el panel abierto — debe responder normalmente).
3. Con las devtools abiertas, activar el modo responsive y bajar el viewport a 768px (o cualquier valor <1024px): el panel debe pasar a ocupar el 100% del ancho, sin dejar ver la barra de navegación de AUREO detrás.
4. Volver a ≥1024px: el panel debe volver al modo overlay de 420px.

- [ ] **Step 4: No hay commit — `aureo-demo` no tiene repositorio git.**

---

### Task 3: Persistencia del estado abierto/cerrado (localStorage)

**Files:**
- Modify: `aureo-demo/melyor.js` (consts, `initMelyorWidget`, `toggleMelyorPanel`)

**Interfaces:**
- Consumes: `melyorOpen` (variable de módulo ya existente, línea 25).
- Produces: constante `MELYOR_PANEL_OPEN_KEY`; el panel y el trigger nacen con la clase `.open`/`.active` ya aplicada si corresponde (sin animación de apertura en la carga de página).

- [ ] **Step 1: Agregar la constante de storage**

En `aureo-demo/melyor.js`, después de la línea 22 (`const MELYOR_HISTORY_LIMIT = 8;`), agregar:

```js
const MELYOR_PANEL_OPEN_KEY = "melyor_panel_open";
```

- [ ] **Step 2: Leer el estado guardado antes de crear el panel**

En `initMelyorWidget` (tras el guard de `headerActions`, antes de crear `trigger`), agregar:

```js
    try {
        melyorOpen = localStorage.getItem(MELYOR_PANEL_OPEN_KEY) === "1";
    } catch (e) {
        melyorOpen = false; // localStorage no disponible (modo privado, cuota llena)
    }
```

- [ ] **Step 3: Aplicar la clase inicial sin animación**

Modificar la creación de `trigger` y `panel` para incluir la clase desde el inicio (evita que el navegador anime el `transform` al cargar). Reemplazar:

```js
    trigger.className = "melyor-trigger";
```

por:

```js
    trigger.className = "melyor-trigger" + (melyorOpen ? " active" : "");
```

Y reemplazar:

```js
    panel.className = "melyor-panel";
```

por:

```js
    panel.className = "melyor-panel" + (melyorOpen ? " open" : "");
```

- [ ] **Step 4: Persistir el cambio al togglear**

En `toggleMelyorPanel`, reemplazar:

```js
function toggleMelyorPanel() {
    melyorOpen = !melyorOpen;
    const panel = document.getElementById("melyor-panel");
```

por:

```js
function toggleMelyorPanel() {
    melyorOpen = !melyorOpen;
    try {
        localStorage.setItem(MELYOR_PANEL_OPEN_KEY, melyorOpen ? "1" : "0");
    } catch (e) {
        /* localStorage no disponible: el estado simplemente no persiste */
    }
    const panel = document.getElementById("melyor-panel");
```

- [ ] **Step 5: Verificación manual en navegador**

1. Con la sesión simulada activa, recargar la página, abrir el panel de Melyor.
2. Cambiar de módulo con la sidebar (ej. a "Inventario") — como `index.html` es una SPA de una sola página (`switchTab`, sin recarga real), el panel debe seguir abierto sin hacer nada adicional (ya vive fuera del contenido de cada tab).
3. Recargar la página completa (F5) manteniendo la sesión simulada: el panel debe abrir ya en estado abierto, SIN animación de deslizamiento visible (aparece directamente abierto, no desliza desde afuera).
4. Cerrar el panel, recargar de nuevo: debe permanecer cerrado.
5. En devtools → Application → Local Storage, confirmar que existe la clave `melyor_panel_open` con valor `"1"` o `"0"` según el último estado.

- [ ] **Step 6: No hay commit — `aureo-demo` no tiene repositorio git.**

---

### Task 4: Botón de nueva conversación

**Files:**
- Modify: `aureo-demo/melyor.js` (`initMelyorWidget`, nueva función `startNewMelyorConversation`, CSS)

**Interfaces:**
- Consumes: `melyorMessages`, `melyorBusy`, `renderMelyorMessages()` (ya existentes).
- Produces: función `startNewMelyorConversation()`, botón `#melyor-new-btn`. No usado por otras tareas de este plan.

- [ ] **Step 1: Agregar el botón al header del panel**

En `initMelyorWidget`, reemplazar el `innerHTML` del panel (bloque del header, dentro de la plantilla de `panel.innerHTML`):

```html
        <div class="melyor-panel-header">
            <span class="melyor-panel-title">Melyor</span>
            <button type="button" class="melyor-close-btn" aria-label="Cerrar Melyor">&times;</button>
        </div>
```

por:

```html
        <div class="melyor-panel-header">
            <span class="melyor-panel-title">Melyor</span>
            <div class="melyor-panel-header-actions">
                <button type="button" class="melyor-new-btn" id="melyor-new-btn" aria-label="Nueva conversación" title="Nueva conversación">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
                <button type="button" class="melyor-close-btn" aria-label="Cerrar Melyor">&times;</button>
            </div>
        </div>
```

- [ ] **Step 2: Conectar el listener**

Después de la línea (en `initMelyorWidget`):

```js
    panel.querySelector(".melyor-close-btn").addEventListener("click", toggleMelyorPanel);
```

agregar:

```js
    panel.querySelector("#melyor-new-btn").addEventListener("click", startNewMelyorConversation);
```

- [ ] **Step 3: Implementar la función**

Agregar, inmediatamente después del cierre de `toggleMelyorPanel` (antes del comentario `// RENDER —`):

```js
function startNewMelyorConversation() {
    melyorMessages = [];
    melyorBusy = false;
    renderMelyorMessages();
    const input = document.getElementById("melyor-input");
    if (input) input.focus();
}
```

- [ ] **Step 4: Agregar el CSS**

Dentro de `injectMelyorStyles`, después del bloque `.melyor-close-btn { ... }`, agregar:

```css
        .melyor-panel-header-actions {
            display: flex;
            align-items: center;
            gap: 0.4rem;
        }
        .melyor-new-btn {
            background: none;
            border: none;
            color: #fff;
            cursor: pointer;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 6px;
            transition: background 0.15s ease;
        }
        .melyor-new-btn:hover { background: rgba(255, 255, 255, 0.15); }
        .melyor-new-btn svg { width: 18px; height: 18px; }
```

- [ ] **Step 5: Verificación manual en navegador**

1. Con la sesión simulada activa, abrir el panel y escribir 2-3 mensajes (con `AI_MOCK_MODE` en `false`, van a mostrar el mensaje "Melyor aún no está activado" — es el comportamiento esperado hoy, sirve igual para ver las burbujas en el historial).
2. Click en el botón "+" del header: el historial debe vaciarse instantáneamente, volviendo al estado vacío ("Preguntame sobre stock bajo…"), y el panel debe seguir abierto (no se cierra).
3. Confirmar que el input queda enfocado después de limpiar.

- [ ] **Step 6: No hay commit — `aureo-demo` no tiene repositorio git.**

---

### Task 5: Markdown básico en las respuestas (frontend)

**Files:**
- Modify: `aureo-demo/melyor.js` (`renderMelyorMessages`, nuevas funciones `renderMelyorMarkdown` / `applyInlineMarkdown`, CSS)

**Interfaces:**
- Consumes: `escapeHtml` (función global ya definida en `core.js`, cargado antes que `melyor.js`).
- Produces: `renderMelyorMarkdown(rawText)` → string HTML seguro (input ya escapado antes de aplicar transformaciones). Usada solo para mensajes con `role === "assistant"`; los mensajes de usuario siguen renderizando como texto plano (el usuario no escribe markdown, y así se evita ambigüedad sobre qué se interpreta).

- [ ] **Step 1: Reemplazar el mapeo de burbujas**

En `renderMelyorMessages`, reemplazar (líneas ~102-108):

```js
    const bubbles = melyorMessages
        .map((m) => {
            const safeText = escapeHtml(m.text).replace(/\n/g, "<br>");
            const cls = m.role === "assistant" ? "melyor-msg-bot" : "melyor-msg-user";
            return `<div class="melyor-msg ${cls}">${safeText}</div>`;
        })
        .join("");
```

por:

```js
    const bubbles = melyorMessages
        .map((m) => {
            const cls = m.role === "assistant" ? "melyor-msg-bot" : "melyor-msg-user";
            const html = m.role === "assistant"
                ? renderMelyorMarkdown(m.text)
                : escapeHtml(m.text).replace(/\n/g, "<br>");
            return `<div class="melyor-msg ${cls}">${html}</div>`;
        })
        .join("");
```

- [ ] **Step 2: Implementar el parser de markdown**

Agregar, inmediatamente después del cierre de `renderMelyorMessages` (antes de `function handleMelyorSubmit`):

```js
// --------------------------------------------------------------------------
//   MARKDOWN BÁSICO — el texto SIEMPRE se escapa primero (escapeHtml) y
//   recién sobre ese resultado ya escapado se aplican las transformaciones
//   de listas/negritas. Nunca se inyecta markdown crudo sin escapar.
// --------------------------------------------------------------------------
function renderMelyorMarkdown(rawText) {
    const escaped = escapeHtml(rawText);
    const lines = escaped.split("\n");
    const htmlParts = [];
    let inList = false;

    lines.forEach((line) => {
        const listMatch = line.match(/^\s*-\s+(.+)$/);
        if (listMatch) {
            if (!inList) {
                htmlParts.push('<ul class="melyor-md-list">');
                inList = true;
            }
            htmlParts.push(`<li>${applyInlineMarkdown(listMatch[1])}</li>`);
            return;
        }
        if (inList) {
            htmlParts.push("</ul>");
            inList = false;
        }
        if (line.trim() === "") {
            htmlParts.push("<br>");
        } else {
            htmlParts.push(`<p>${applyInlineMarkdown(line)}</p>`);
        }
    });

    if (inList) htmlParts.push("</ul>");
    return htmlParts.join("");
}

function applyInlineMarkdown(escapedLine) {
    return escapedLine.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}
```

- [ ] **Step 3: Agregar el CSS de listas/negrita**

Dentro de `injectMelyorStyles`, después del bloque `.melyor-typing { ... }`, agregar:

```css
        .melyor-msg p { margin: 0 0 0.4rem 0; }
        .melyor-msg p:last-child { margin-bottom: 0; }
        .melyor-md-list {
            margin: 0.2rem 0 0.4rem 1.1rem;
            padding: 0;
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }
        .melyor-md-list:last-child { margin-bottom: 0; }
        .melyor-md-list li { line-height: 1.4; }
        .melyor-msg-bot strong { font-weight: 700; color: var(--accent-gold, #2E4A6E); }
        .melyor-msg-user strong { font-weight: 700; }
```

- [ ] **Step 4: Verificación manual en navegador**

No hay `ANTHROPIC_API_KEY` configurada en este entorno (a propósito, ver contexto del spec), así que no se puede probar contra una respuesta real de Claude todavía. Verificar el render directamente desde la consola del navegador:

1. Con el panel de Melyor abierto y la sesión simulada activa, abrir la consola del navegador y ejecutar:
   ```js
   melyorMessages.push({
       role: "assistant",
       text: "Encontré **4 artículos** por debajo del mínimo:\n- Tornillo hex. M8x40 (12 uds, mín 50)\n- Disco de corte 115mm (8 uds, mín 24)\n\nRevisá el módulo de Inventario."
   });
   renderMelyorMessages();
   ```
2. Confirmar visualmente: "4 artículos" en negrita azul marino, los dos ítems como lista con viñetas, el párrafo final separado, y NADA de asteriscos ni guiones crudos visibles.
3. Ejecutar además:
   ```js
   melyorMessages.push({ role: "assistant", text: "<img src=x onerror=alert(1)>" });
   renderMelyorMessages();
   ```
   Confirmar que se muestra como texto literal (`<img src=x onerror=alert(1)>`) y NO se ejecuta ningún `alert` — así se verifica que el escape sigue aplicándose antes del parseo de markdown.

- [ ] **Step 5: No hay commit — `aureo-demo` no tiene repositorio git.**

---

### Task 6: Permitir markdown liviano en el prompt del backend

**Files:**
- Modify: `aureo-demo/api/melyor-chat.js:36`

**Interfaces:**
- Consumes: nada nuevo.
- Produces: nada que otras tareas consuman — cambio de contenido de texto únicamente, el contrato `{ reply: string }` no cambia.

- [ ] **Step 1: Editar la línea del `SYSTEM_PROMPT`**

En `aureo-demo/api/melyor-chat.js`, reemplazar (línea 36):

```js
Respondé siempre en español, en texto plano (sin markdown pesado).
```

por:

```js
Respondé siempre en español. Podés usar markdown liviano cuando ayude a la
claridad: listas con "- " para enumerar ítems y **negrita** para resaltar
cifras o la acción concreta a tomar. Nada de encabezados, tablas ni bloques
de código: la interfaz solo soporta listas y negrita.
```

(Nota: `SYSTEM_PROMPT` es un template literal de una sola línea larga en el archivo original — al pegar el reemplazo, mantenerlo dentro del mismo template literal existente, como una sola cadena continua, no como líneas JS separadas.)

- [ ] **Step 2: Verificar el archivo**

Confirmar con un `grep`/lectura del archivo que `SYSTEM_PROMPT` sigue siendo sintácticamente un único template literal válido (backtick de apertura en la línea 32, backtick de cierre al final del prompt) y que no quedaron backticks sin cerrar.

No es posible probar el efecto real contra Claude en este entorno (sin `ANTHROPIC_API_KEY` configurada — ver contexto del spec). La verificación end-to-end del formato de respuesta real queda pendiente para cuando se configure la key de producción; no es parte del alcance de este plan.

- [ ] **Step 3: No hay commit — `aureo-demo` no tiene repositorio git.**

---

### Task 7: QA manual final cruzando todas las decisiones del spec

**Files:** Ninguno (solo verificación, sin cambios de código).

**Interfaces:** N/A.

- [ ] **Step 1: Checklist completo en navegador**

Con el servidor local corriendo y la sesión simulada activa (ver Global Constraints), recorrer:

1. **Trigger:** ícono visible en el header en desktop y en mobile (mismo ícono, mismo lugar).
2. **Desktop (≥1024px):** panel overlay de 420px desde la derecha, sin oscurecer el dashboard, dashboard clickeable con el panel abierto.
3. **Mobile (<1024px, devtools responsive):** panel ocupa 100% de la pantalla, nav de AUREO no visible detrás.
4. **Persistencia de apertura:** abrir el panel, recargar (F5) → sigue abierto sin animación de entrada. Cerrar, recargar → sigue cerrado.
5. **Historial NO persiste:** con el panel abierto y mensajes cargados (ver Task 4, Step 5), recargar la página → el historial vuelve a estar vacío (se perdió, como se definió en el spec).
6. **Botón "+":** limpia el historial sin cerrar el panel.
7. **Markdown:** repetir la verificación de Task 5 Step 4 (negrita + listas se renderizan, HTML inyectado se muestra como texto literal).
8. **Estado "no configurado":** con `AI_MOCK_MODE = false` (valor por defecto, no tocar), escribir cualquier pregunta real en el input y enviar → debe mostrar "Melyor aún no está activado — contacta al administrador." (sin cambios respecto al comportamiento actual, confirmar que no hay regresión).
9. **Sin elementos fuera de alcance:** confirmar que NO aparece ningún indicador "En línea" ni botón de ayuda "?" en el header del panel (explícitamente descartados en el spec).

- [ ] **Step 2: Reportar resultado**

Si algún punto del checklist falla, volver a la tarea correspondiente y corregir antes de considerar el plan completo. Si todo pasa, el trabajo está listo para que el usuario pida el deploy a producción explícitamente (fuera del alcance de este plan — ver Global Constraints).
