# Melyor — presencia de "motor de Aureo" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Que Melyor se sienta como el motor de datos/optimización de Aureo (tipo Claude/Claude Code) en vez de un widget de chat genérico, vía indicadores de trabajo contextuales, tarjetas de datos, chips de acción sugerida, y una identidad visual con más presencia — sin agregar ejecución real de acciones.

**Architecture:** Extiende `aureo-demo/melyor.js` (ya tiene el panel lateral del plan anterior) con: detección de categoría compartida, mensajes de "trabajando" contextuales, un parser de markdown que reconoce el patrón título+lista como tarjeta, extracción de un marcador `SUGERENCIA:` para chips clickeables, chips de sugerencias en el estado vacío, y CSS de identidad visual (glow permanente, pulso). Una sola línea de arquitectura toca el backend: `aureo-demo/api/melyor-chat.js` gana instrucciones de prompt para el formato título+lista y el marcador `SUGERENCIA:`. El contrato `{ question, context, history }` → `{ reply: string }` no cambia.

**Tech Stack:** HTML/CSS/JS vanilla, sin framework, sin bundler. Backend: función serverless de Vercel sin dependencias npm (sin cambios de esa parte).

## Global Constraints

- `aureo-demo` **no es un repositorio git**. Ningún paso incluye `git commit` para archivos de `aureo-demo`.
- `aureo-demo` **no tiene test runner, build ni `package.json`**. Verificación manual en navegador contra un servidor estático local (`python -m http.server`), o vía inyección directa en la consola del navegador cuando así se indique.
- **No desplegar a producción como parte de este plan.** El deploy se solicita aparte, explícitamente, por el usuario.
- **Setup de prueba local** (repetido en las tareas que requieren ver el panel funcionando): `demo-gate.js` bloquea el acceso sin token válido, incluso en local. Abrir la consola del navegador y correr, en una página SIN `demo-gate.js` del mismo origen (ej. `aureo-demo/desktop-only.html`) antes de navegar a `index.html`:
  ```js
  sessionStorage.setItem("aura_demo_session", JSON.stringify({ exp: Date.now() + 30 * 60 * 1000 }));
  ```
- Esta plan se apoya sobre el estado actual de `aureo-demo/melyor.js` y `aureo-demo/api/melyor-chat.js` tal como quedaron después del plan anterior (`2026-07-23-melyor-side-panel.md`, ya implementado y verificado: trigger en el header, panel overlay responsive, persistencia de abierto/cerrado, botón de nueva conversación, markdown básico con escape-primero). Los fragmentos "antes" de cada paso de este plan citan el código EXACTO tal como existe ahora mismo en esos archivos — no son hipotéticos.
- Todo texto visible es en español, tono directo (consistente con `SYSTEM_PROMPT` y el resto de `aureo-demo`).
- Los colores/tokens de diseño son los ya definidos en `aureo-demo/styles.css` (`--accent-gold`, `--accent-gold-gradient`, `--accent-gold-glow`, `--bg-base`, `--bg-surface`, `--border-subtle`, `--text-primary`, `--text-muted`) — no se introduce ningún color nuevo al sistema de diseño (decisión explícita del spec: "más presencia del acento existente", no un color nuevo).
- **Regla de seguridad no negociable, heredada del plan anterior:** todo texto que venga del usuario o del modelo se escapa con `escapeHtml()` ANTES de cualquier interpretación de markdown/marcador. Ningún paso de este plan introduce una ruta que inyecte HTML sin escapar.
- **Cuidado con doble-escape:** cuando un paso extrae una subcadena de una variable que YA pasó por `escapeHtml()` (ej. el texto de `SUGERENCIA:` en la Tarea 3, extraído de la variable `escaped`), esa subcadena NO se vuelve a pasar por `escapeHtml()` — ya está escapada. Volver a escapar produce texto visiblemente roto (`&amp;amp;` en vez de `&amp;`), no un problema de seguridad, pero sí un bug de corrección. Los pasos de este plan ya están escritos con esto resuelto — no "corregir" agregando un escape extra donde el código mostrado no lo tiene.

---

### Task 1: Categoría compartida + indicador de "trabajando" contextual

**Files:**
- Modify: `aureo-demo/melyor.js` (consts, `sendMelyorMessage`, `renderMelyorMessages`, nuevas funciones `detectMelyorCategory`/`getMelyorWorkingMessage`)

**Interfaces:**
- Produces: `detectMelyorCategory(text)` → `"stock" | "clientes" | "facturas" | "generico"`; `getMelyorWorkingMessage(text)` → string; variable de módulo `melyorWorkingMessage`. Las Tareas 2 y 6 (vía el prompt) reusan `detectMelyorCategory`; ninguna otra tarea depende de `melyorWorkingMessage` directamente.

- [x] **Step 1: Agregar los mensajes de trabajo y el estado**

En `aureo-demo/melyor.js`, reemplazar (línea 24):

```js
const MELYOR_PANEL_OPEN_KEY = "melyor_panel_open";

let melyorMessages = []; // { role: 'user' | 'assistant', text: string }
let melyorOpen = false;
let melyorBusy = false;
```

por:

```js
const MELYOR_PANEL_OPEN_KEY = "melyor_panel_open";

const MELYOR_WORKING_MESSAGES = {
    stock: "Revisando inventario...",
    clientes: "Cruzando datos de clientes...",
    facturas: "Analizando facturación...",
    generico: "Procesando tu consulta...",
};

let melyorMessages = []; // { role: 'user' | 'assistant', text: string }
let melyorOpen = false;
let melyorBusy = false;
let melyorWorkingMessage = MELYOR_WORKING_MESSAGES.generico;
```

- [x] **Step 2: Agregar las funciones de detección**

Inmediatamente después del cierre de `startNewMelyorConversation` (antes del comentario `// RENDER —`), agregar:

```js
function detectMelyorCategory(text) {
    const q = text.toLowerCase();
    if (q.includes("stock") || q.includes("inventario") || q.includes("reorden")) return "stock";
    if (q.includes("cliente")) return "clientes";
    if (q.includes("factura") || q.includes("venta") || q.includes("kpi")) return "facturas";
    return "generico";
}

function getMelyorWorkingMessage(text) {
    return MELYOR_WORKING_MESSAGES[detectMelyorCategory(text)];
}
```

- [x] **Step 3: Calcular el mensaje contextual al enviar**

En `sendMelyorMessage`, reemplazar:

```js
async function sendMelyorMessage(text) {
    melyorMessages.push({ role: "user", text });
    melyorBusy = true;
    renderMelyorMessages();
```

por:

```js
async function sendMelyorMessage(text) {
    melyorMessages.push({ role: "user", text });
    melyorBusy = true;
    melyorWorkingMessage = getMelyorWorkingMessage(text);
    renderMelyorMessages();
```

- [x] **Step 4: Usar el mensaje contextual en el indicador**

En `renderMelyorMessages`, reemplazar:

```js
    const typingIndicator = melyorBusy
        ? '<div class="melyor-msg melyor-msg-bot melyor-typing">Pensando...</div>'
        : "";
```

por:

```js
    const typingIndicator = melyorBusy
        ? `<div class="melyor-msg melyor-msg-bot melyor-typing">${escapeHtml(melyorWorkingMessage)}</div>`
        : "";
```

- [x] **Step 5: Verificación manual en navegador**

Con el servidor local corriendo y la sesión simulada activa (ver Global Constraints), abrir el panel y la consola del navegador. Ejecutar, sin esperar (el fetch real fallará/mostrará "no configurado", pero `melyorWorkingMessage` se fija de forma síncrona antes de eso):

```js
sendMelyorMessage("¿cuánto stock tenemos?"); melyorWorkingMessage
```

Esperado: `"Revisando inventario..."`, y ese texto visible brevemente en la burbuja de "trabajando" antes de que llegue la respuesta de "no configurado". Repetir con una pregunta que mencione "cliente" (→ `"Cruzando datos de clientes..."`), una que mencione "factura" (→ `"Analizando facturación..."`), y una genérica como "hola" (→ `"Procesando tu consulta..."`).

- [x] **Step 6: No hay commit — `aureo-demo` no tiene repositorio git.**

---

### Task 2: Tarjetas de datos (patrón título+lista)

**Files:**
- Modify: `aureo-demo/melyor.js` (`renderMelyorMarkdown`, nuevas `MELYOR_CATEGORY_ICONS` / `renderMelyorCard`, CSS)

**Interfaces:**
- Consumes: `detectMelyorCategory` (Task 1), `applyInlineMarkdown` (ya existente).
- Produces: `renderMelyorCard(title, items)` → string HTML. `renderMelyorMarkdown` sigue devolviendo un string plano en esta tarea (el cambio a objeto `{bodyHtml, suggestion}` es de la Tarea 3, no de esta).

- [x] **Step 1: Reescribir `renderMelyorMarkdown` con detección de tarjeta**

Reemplazar la función completa:

```js
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
```

por:

```js
function renderMelyorMarkdown(rawText) {
    const escaped = escapeHtml(rawText);
    const lines = escaped.split("\n");
    const htmlParts = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];
        const titleMatch = line.match(/^\*\*(.+)\*\*$/);
        const nextIsListItem = titleMatch && lines[i + 1] && /^\s*-\s+/.test(lines[i + 1]);

        if (titleMatch && nextIsListItem) {
            const title = titleMatch[1];
            const items = [];
            i += 1;
            while (i < lines.length && /^\s*-\s+(.+)$/.test(lines[i])) {
                items.push(lines[i].match(/^\s*-\s+(.+)$/)[1]);
                i += 1;
            }
            htmlParts.push(renderMelyorCard(title, items));
            continue;
        }

        const listMatch = line.match(/^\s*-\s+(.+)$/);
        if (listMatch) {
            const items = [listMatch[1]];
            i += 1;
            while (i < lines.length && /^\s*-\s+(.+)$/.test(lines[i])) {
                items.push(lines[i].match(/^\s*-\s+(.+)$/)[1]);
                i += 1;
            }
            htmlParts.push(`<ul class="melyor-md-list">${items.map((it) => `<li>${applyInlineMarkdown(it)}</li>`).join("")}</ul>`);
            continue;
        }

        if (line.trim() === "") {
            htmlParts.push("<br>");
        } else {
            htmlParts.push(`<p>${applyInlineMarkdown(line)}</p>`);
        }
        i += 1;
    }

    return htmlParts.join("");
}
```

- [x] **Step 2: Agregar los íconos de categoría y el render de tarjeta**

Inmediatamente después de `applyInlineMarkdown` (antes de `function handleMelyorSubmit`), agregar:

```js
const MELYOR_CATEGORY_ICONS = {
    stock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    clientes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    facturas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="12" y1="4" x2="12" y2="20"/><line x1="2" y1="12" x2="22" y2="12"/></svg>',
    generico: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>',
};

function renderMelyorCard(title, items) {
    const icon = MELYOR_CATEGORY_ICONS[detectMelyorCategory(title)];
    const itemsHtml = items.map((it) => `<li>${applyInlineMarkdown(it)}</li>`).join("");
    return `<div class="melyor-card"><div class="melyor-card-title">${icon}<span>${applyInlineMarkdown(title)}</span></div><ul class="melyor-card-list">${itemsHtml}</ul></div>`;
}
```

- [x] **Step 3: Agregar el CSS de la tarjeta**

Dentro de `injectMelyorStyles`, después del bloque `.melyor-msg-bot strong { ... } .melyor-msg-user strong { ... }`, agregar:

```css
        .melyor-card {
            background: var(--bg-base, #F7F3EA);
            border: 1px solid var(--border-subtle, #E7DCC8);
            border-left: 3px solid var(--accent-gold, #2E4A6E);
            border-radius: 8px;
            padding: 0.6rem 0.8rem;
            margin: 0.3rem 0;
        }
        .melyor-card-title {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            font-weight: 700;
            color: var(--accent-gold, #2E4A6E);
            margin-bottom: 0.4rem;
        }
        .melyor-card-title svg { width: 16px; height: 16px; flex-shrink: 0; }
        .melyor-card-list {
            margin: 0;
            padding-left: 1.1rem;
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }
```

- [x] **Step 4: Verificación manual en navegador**

Con el panel abierto y la sesión simulada activa, en la consola:

```js
melyorMessages.push({
    role: "assistant",
    text: "**Productos bajo stock mínimo**\n- Tornillo hex. M8x40 (12 uds, mín 50)\n- Disco de corte 115mm (8 uds, mín 24)"
});
renderMelyorMessages();
```

Esperado: un bloque con fondo diferenciado, borde izquierdo de acento, ícono de caja/check y el título en negrita, con la lista debajo — NO un párrafo suelto con negrita seguido de una lista aparte.

Regresión (del patrón de Task 5 del plan anterior, negrita DENTRO de una oración, no en su propia línea):

```js
melyorMessages.push({
    role: "assistant",
    text: "Encontré **4 artículos** por debajo del mínimo:\n- Tornillo hex. M8x40 (12 uds, mín 50)\n- Disco de corte 115mm (8 uds, mín 24)"
});
renderMelyorMessages();
```

Esperado: esto NO debe renderizar como tarjeta (la negrita no ocupa toda la primera línea) — debe verse igual que antes de esta tarea: párrafo con "4 artículos" en negrita, seguido de una lista suelta sin el contenedor de tarjeta.

- [x] **Step 5: No hay commit — `aureo-demo` no tiene repositorio git.**

---

### Task 3: Chips de acción sugerida (marcador `SUGERENCIA:`)

**Files:**
- Modify: `aureo-demo/melyor.js` (`renderMelyorMarkdown` — cambia su tipo de retorno —, `renderMelyorMessages`, `initMelyorWidget`, nueva `handleMelyorChipClick`, CSS)

**Interfaces:**
- Consumes: `renderMelyorMarkdown` de la Tarea 2 (esta tarea lo modifica más).
- Produces: `renderMelyorMarkdown(rawText)` ahora devuelve `{ bodyHtml: string, suggestion: string|null }` — CAMBIO DE TIPO respecto a la Tarea 2, donde devolvía solo un string. `handleMelyorChipClick(evt)`. La Tarea 4 reusa la clase CSS `.melyor-chip` y el patrón `data-melyor-suggestion` que esta tarea introduce.

- [x] **Step 1: Cambiar `renderMelyorMarkdown` para extraer el marcador y devolver un objeto**

Reemplazar las primeras líneas de la función (dejando el resto del cuerpo — el `while` de la Tarea 2 — intacto):

```js
function renderMelyorMarkdown(rawText) {
    const escaped = escapeHtml(rawText);
    const lines = escaped.split("\n");
```

por:

```js
function renderMelyorMarkdown(rawText) {
    let escaped = escapeHtml(rawText);
    let suggestion = null;
    const suggestionMatch = escaped.match(/\n?SUGERENCIA:\s*(.+)$/);
    if (suggestionMatch) {
        suggestion = suggestionMatch[1].trim();
        escaped = escaped.slice(0, suggestionMatch.index);
    }

    const lines = escaped.split("\n");
```

Y reemplazar el final de la función (tal como quedó al cierre de la Tarea 2 — el `while` reemplazó el `forEach` viejo, este es el único final válido en este punto del plan):

```js
        i += 1;
    }

    return htmlParts.join("");
}
```

por:

```js
        i += 1;
    }

    return { bodyHtml: htmlParts.join(""), suggestion };
}
```

- [x] **Step 2: Actualizar el mapeo de burbujas para usar el nuevo objeto y renderizar el chip**

En `renderMelyorMessages`, reemplazar:

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

por:

```js
    const bubbles = melyorMessages
        .map((m) => {
            const cls = m.role === "assistant" ? "melyor-msg-bot" : "melyor-msg-user";
            if (m.role !== "assistant") {
                const html = escapeHtml(m.text).replace(/\n/g, "<br>");
                return `<div class="melyor-msg ${cls}">${html}</div>`;
            }
            const { bodyHtml, suggestion } = renderMelyorMarkdown(m.text);
            const chipHtml = suggestion
                ? `<button type="button" class="melyor-chip" data-melyor-suggestion="${suggestion}">${suggestion}</button>`
                : "";
            return `<div class="melyor-msg ${cls}">${bodyHtml}</div>${chipHtml}`;
        })
        .join("");
```

**Importante (ver Global Constraints):** `suggestion` viene de `escaped` (ya escapado dentro de `renderMelyorMarkdown`), así que NO se le vuelve a aplicar `escapeHtml()` acá — usarlo tal cual, tanto en el atributo `data-melyor-suggestion` como en el texto visible del botón.

- [x] **Step 3: Agregar el handler de click delegado**

Inmediatamente después de `renderMelyorMarkdown` (y de `applyInlineMarkdown`/`MELYOR_CATEGORY_ICONS`/`renderMelyorCard` de la Tarea 2), agregar:

```js
function handleMelyorChipClick(evt) {
    const chip = evt.target.closest(".melyor-chip");
    if (!chip || melyorBusy) return;
    const text = chip.dataset.melyorSuggestion;
    if (text) sendMelyorMessage(text);
}
```

- [x] **Step 4: Conectar el listener delegado**

En `initMelyorWidget`, después de:

```js
    panel.querySelector("#melyor-form").addEventListener("submit", handleMelyorSubmit);
```

agregar:

```js
    panel.querySelector("#melyor-messages").addEventListener("click", handleMelyorChipClick);
```

- [x] **Step 5: Agregar el CSS del chip**

Dentro de `injectMelyorStyles`, después del bloque `.melyor-card-list { ... }` (agregado en la Tarea 2), agregar:

```css
        .melyor-chip {
            display: inline-block;
            margin-top: 0.4rem;
            padding: 0.4rem 0.75rem;
            border-radius: 999px;
            border: 1px solid var(--accent-gold, #2E4A6E);
            background: var(--bg-surface, #fff);
            color: var(--accent-gold, #2E4A6E);
            font-size: 0.8rem;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.15s ease, color 0.15s ease;
        }
        .melyor-chip:hover {
            background: var(--accent-gold, #2E4A6E);
            color: #fff;
        }
```

- [x] **Step 6: Verificación manual en navegador**

Con el panel abierto y la sesión simulada activa, en la consola:

```js
melyorMessages.push({
    role: "assistant",
    text: "Hay 4 productos por debajo del mínimo.\n\nSUGERENCIA: ¿Armo el pedido de reposición?"
});
renderMelyorMessages();
```

Esperado: la burbuja muestra solo "Hay 4 productos por debajo del mínimo." (SIN la línea `SUGERENCIA:` visible en el cuerpo), y debajo aparece un chip/botón redondeado con el texto exacto "¿Armo el pedido de reposición?". Click en el chip (o `document.querySelector(".melyor-chip").click()` desde la consola): debe agregar un nuevo mensaje de usuario con ese texto exacto a `melyorMessages` (confirmar con `melyorMessages[melyorMessages.length - 1]`).

Confirmar además que un mensaje SIN el marcador (los de las Tareas 1-2) sigue sin mostrar ningún chip.

- [x] **Step 7: No hay commit — `aureo-demo` no tiene repositorio git.**

---

### Task 4: Chips de sugerencias en el estado vacío

**Files:**
- Modify: `aureo-demo/melyor.js` (consts, `renderMelyorMessages`, CSS)

**Interfaces:**
- Consumes: clase `.melyor-chip` y el patrón `data-melyor-suggestion` + `handleMelyorChipClick` (Tarea 3) — el listener ya está delegado sobre `#melyor-messages`, así que los chips nuevos que esta tarea agrega quedan cubiertos automáticamente, sin listener adicional.

- [x] **Step 1: Agregar las sugerencias fijas**

Después de `MELYOR_WORKING_MESSAGES` (Tarea 1), agregar:

```js
const MELYOR_EMPTY_SUGGESTIONS = [
    "¿Qué productos están bajo stock?",
    "Clientes más valiosos",
    "Facturas pendientes",
];
```

- [x] **Step 2: Renderizar los chips en el estado vacío**

En `renderMelyorMessages`, reemplazar:

```js
    if (melyorMessages.length === 0) {
        el.innerHTML =
            '<div class="melyor-empty">Preguntame sobre stock bajo, clientes inactivos, facturas pendientes o los KPIs del dashboard.</div>';
        return;
    }
```

por:

```js
    if (melyorMessages.length === 0) {
        const chips = MELYOR_EMPTY_SUGGESTIONS
            .map((s) => `<button type="button" class="melyor-chip" data-melyor-suggestion="${escapeHtml(s)}">${escapeHtml(s)}</button>`)
            .join("");
        el.innerHTML = `
            <div class="melyor-empty">Preguntame sobre stock bajo, clientes inactivos, facturas pendientes o los KPIs del dashboard.</div>
            <div class="melyor-empty-chips">${chips}</div>
        `;
        return;
    }
```

**Nota:** acá SÍ corresponde `escapeHtml(s)` — a diferencia del `suggestion` de la Tarea 3 (que ya venía escapado), `MELYOR_EMPTY_SUGGESTIONS` son strings literales crudos que nunca pasaron por `escapeHtml()`.

- [x] **Step 3: Agregar el CSS**

Dentro de `injectMelyorStyles`, después del bloque `.melyor-empty { ... }`, agregar:

```css
        .melyor-empty-chips {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
            margin-top: 0.75rem;
        }
```

- [x] **Step 4: Verificación manual en navegador**

Con el panel abierto y sin historial (usar el botón "+" si hace falta limpiar), confirmar que se ven 3 chips debajo del texto orientativo: "¿Qué productos están bajo stock?", "Clientes más valiosos", "Facturas pendientes". Click en uno (o vía consola: `document.querySelectorAll(".melyor-chip")[0].click()`): debe agregar un mensaje de usuario con ese texto exacto y arrancar el flujo normal de envío (mismo comportamiento que escribir y enviar a mano).

- [x] **Step 5: No hay commit — `aureo-demo` no tiene repositorio git.**

---

### Task 5: Identidad visual — glow permanente, header con profundidad, pulso al trabajar

**Files:**
- Modify: `aureo-demo/melyor.js` (markup del header del panel en `initMelyorWidget`, `renderMelyorMessages`, CSS)

**Interfaces:**
- Consumes: `melyorBusy` (ya existente).
- Produces: elemento `#melyor-header-icon`; clase CSS `.melyor-pulse` aplicada/quitada dinámicamente sobre `#melyor-header-icon` y el `<svg>` del trigger. No usado por otras tareas de este plan.

- [x] **Step 1: Agregar el ícono al header del panel**

En `initMelyorWidget`, dentro del template de `panel.innerHTML`, reemplazar:

```html
            <span class="melyor-panel-title">Melyor</span>
```

por:

```html
            <div class="melyor-panel-title-group">
                <svg class="melyor-header-icon" id="melyor-header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 L20 7 L20 17 L12 22 L4 17 L4 7 Z"/><path d="M7.5 15.5 L7.5 8.5 L12 13 L16.5 8.5 L16.5 15.5"/></svg>
                <span class="melyor-panel-title">Melyor</span>
            </div>
```

- [x] **Step 2: Alternar el pulso según `melyorBusy`**

En `renderMelyorMessages`, reemplazar:

```js
function renderMelyorMessages() {
    const el = document.getElementById("melyor-messages");
    if (!el) return;

    if (melyorMessages.length === 0) {
```

por:

```js
function renderMelyorMessages() {
    const el = document.getElementById("melyor-messages");
    if (!el) return;

    const headerIcon = document.getElementById("melyor-header-icon");
    const triggerSvg = document.querySelector("#melyor-trigger svg");
    if (headerIcon) headerIcon.classList.toggle("melyor-pulse", melyorBusy);
    if (triggerSvg) triggerSvg.classList.toggle("melyor-pulse", melyorBusy);

    if (melyorMessages.length === 0) {
```

- [x] **Step 3: CSS — glow permanente del trigger**

Reemplazar:

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
            box-shadow: 0 0 8px var(--accent-gold-glow, rgba(46, 74, 110, 0.15));
            transition: border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
        }
        .melyor-trigger:hover {
            border-color: var(--accent-gold, #2E4A6E);
            color: var(--accent-gold, #2E4A6E);
            box-shadow: 0 0 16px var(--accent-gold-glow, rgba(46, 74, 110, 0.15));
        }
```

- [x] **Step 4: CSS — profundidad del header y estilos del ícono nuevo**

Reemplazar:

```css
        .melyor-panel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.9rem 1rem;
            background: var(--accent-gold-gradient, var(--accent-gold));
            color: #fff;
            font-weight: 600;
            flex-shrink: 0;
        }
```

por:

```css
        .melyor-panel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.9rem 1rem;
            background: var(--accent-gold-gradient, var(--accent-gold));
            color: #fff;
            font-weight: 600;
            flex-shrink: 0;
            box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.12), inset 0 1px 12px rgba(0, 0, 0, 0.15);
        }
        .melyor-panel-title-group {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .melyor-header-icon {
            width: 18px;
            height: 18px;
            flex-shrink: 0;
        }
```

- [x] **Step 5: CSS — animación de pulso**

Reemplazar:

```css
        .melyor-typing { font-style: italic; color: var(--text-muted, #9C907E); }
```

por:

```css
        .melyor-typing { font-style: italic; color: var(--text-muted, #9C907E); }
        @keyframes melyorPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.55; transform: scale(0.92); }
        }
        .melyor-pulse { animation: melyorPulse 1.1s ease-in-out infinite; }
```

- [x] **Step 6: Verificación manual en navegador**

Con el panel abierto: confirmar que el trigger tiene un glow visible en reposo (sin pasar el mouse), y que se intensifica en hover. Confirmar que el header del panel se ve con más profundidad (no un azul plano). En consola:

```js
melyorBusy = true; renderMelyorMessages();
```

Confirmar que tanto el ícono del header del panel como el ícono del trigger empiezan a pulsar (animación de opacidad/escala). Luego:

```js
melyorBusy = false; renderMelyorMessages();
```

Confirmar que el pulso se detiene en ambos.

- [x] **Step 7: No hay commit — `aureo-demo` no tiene repositorio git.**

---

### Task 6: Backend — instrucciones de formato título+lista y marcador `SUGERENCIA:`

**Files:**
- Modify: `aureo-demo/api/melyor-chat.js:32-43` (`SYSTEM_PROMPT`)

**Interfaces:**
- Consumes: nada nuevo.
- Produces: nada que otras tareas consuman — el contrato `{ reply: string }` no cambia. El formato que este prompt le pide al modelo debe coincidir exactamente con lo que el frontend sabe interpretar (Tareas 2 y 3): título en `**negrita**` solo en su línea seguido de lista para tarjetas, y una última línea `SUGERENCIA: <texto>` para chips.

- [x] **Step 1: Reemplazar el `SYSTEM_PROMPT`**

Reemplazar el const completo:

```js
const SYSTEM_PROMPT = `Sos Melyor, el socio operativo de IA de Aureo, un sistema de gestión de inventario, ventas y logística.
Tono: directo y ejecutivo. Frases cortas, sin relleno ni cortesías innecesarias. Vas al grano y das la
acción concreta a tomar cuando aplica (ej. "Encargá 40 unidades de X antes del jueves" en vez de
"Podrías considerar reabastecer X"). Nada de emojis ni exclamaciones motivacionales.
Respondé siempre en español. Podés usar markdown liviano cuando ayude a la
claridad: listas con "- " para enumerar ítems y **negrita** para resaltar
cifras o la acción concreta a tomar. Nada de encabezados, tablas ni bloques
de código: la interfaz solo soporta listas y negrita.
Basate únicamente en el CONTEXTO ACTUAL DEL SISTEMA que se te provee en cada mensaje — es un resumen
ya calculado del estado real (alertas, stock bajo, clientes, KPIs). No inventes cifras que no estén ahí.
Si la pregunta no se puede responder con ese contexto, decilo en una línea y señalá el módulo de Aureo
donde el usuario puede encontrar esa información (Inventario, Facturación, Clientes, Compras, Logística/WMS).`;
```

por:

```js
const SYSTEM_PROMPT = `Sos Melyor, el socio operativo de IA de Aureo, un sistema de gestión de inventario, ventas y logística.
Tono: directo y ejecutivo. Frases cortas, sin relleno ni cortesías innecesarias. Vas al grano y das la
acción concreta a tomar cuando aplica (ej. "Encargá 40 unidades de X antes del jueves" en vez de
"Podrías considerar reabastecer X"). Nada de emojis ni exclamaciones motivacionales.
Respondé siempre en español. Podés usar markdown liviano cuando ayude a la
claridad: listas con "- " para enumerar ítems y **negrita** para resaltar
cifras o la acción concreta a tomar. Nada de encabezados, tablas ni bloques
de código: la interfaz solo soporta listas y negrita.
Cuando dés una lista de datos concretos (productos, clientes, facturas), poné un título corto en
**negrita** solo en su propia línea, inmediatamente seguido de la lista con "- " — sin texto antes
del título en esa línea. Eso activa una tarjeta visual en la interfaz.
Si después de responder hay una acción de seguimiento concreta y útil (no en cada respuesta, solo
cuando tiene sentido), agregá como última línea, después de una línea en blanco, exactamente:
SUGERENCIA: ¿texto de la acción en forma de pregunta?
Basate únicamente en el CONTEXTO ACTUAL DEL SISTEMA que se te provee en cada mensaje — es un resumen
ya calculado del estado real (alertas, stock bajo, clientes, KPIs). No inventes cifras que no estén ahí.
Si la pregunta no se puede responder con ese contexto, decilo en una línea y señalá el módulo de Aureo
donde el usuario puede encontrar esa información (Inventario, Facturación, Clientes, Compras, Logística/WMS).`;
```

- [x] **Step 2: Verificar el archivo**

Confirmar que `SYSTEM_PROMPT` sigue siendo un único template literal válido (un solo backtick de apertura en la línea del `const`, un solo backtick de cierre seguido de `;` al final del prompt). Si hay Node disponible, correr `node --check aureo-demo/api/melyor-chat.js` desde `aureo-demo` como chequeo de sintaxis.

No es posible probar el efecto real contra Claude en este entorno (sin `ANTHROPIC_API_KEY` configurada). Queda pendiente para cuando se configure la key de producción — no es parte del alcance de este plan.

- [x] **Step 3: No hay commit — `aureo-demo` no tiene repositorio git.**

---

### Task 7: QA manual final cruzando todas las decisiones del spec

**Files:** Ninguno (solo verificación, sin cambios de código).

**Interfaces:** N/A.

- [x] **Step 1: Checklist completo en navegador**

Con el servidor local corriendo y la sesión simulada activa:

1. **Indicador contextual:** enviar preguntas con distintas keywords (stock/cliente/factura/genérica), confirmar el mensaje de "trabajando" correcto en cada caso.
2. **Tarjetas:** inyectar el patrón título+lista, confirmar tarjeta con ícono; inyectar negrita-dentro-de-oración+lista, confirmar que NO se convierte en tarjeta (sigue como antes).
3. **Chips de sugerencia:** inyectar un mensaje con `SUGERENCIA: ...`, confirmar chip visible y cuerpo sin la línea del marcador; click debe enviar esa pregunta.
4. **Chips de estado vacío:** panel sin historial, confirmar 3 chips, click en cada uno debe enviar la pregunta correspondiente.
5. **Identidad visual:** glow permanente en el trigger sin hover; header del panel con sombra interna; pulso visible en header-icon y trigger mientras `melyorBusy` es `true`, detenido cuando es `false`.
6. **Regresión — plan anterior:** trigger en el header, panel overlay 420px desktop / full-screen mobile sin scrim, persistencia de abierto/cerrado, botón "+" limpia historial sin cerrar, estado `not_configured` intacto, ningún indicador "En línea" ni botón "?" (seguían fuera de alcance).
7. **Seguridad:** repetir la inyección XSS de la iteración anterior (`<img src=x onerror=alert(1)>` como texto de un mensaje de asistente) y confirmar que sigue mostrándose como texto literal, sin ejecutar nada — la Tarea 3 tocó el tipo de retorno de `renderMelyorMarkdown`, así que vale la pena re-confirmar que el escape-primero se mantuvo intacto en el nuevo flujo.

- [x] **Step 2: Reportar resultado**

Si algún punto falla, volver a la tarea correspondiente y corregir antes de dar el plan por completo. Si todo pasa, el trabajo queda listo para que el usuario pida el deploy explícitamente (fuera de alcance de este plan).
