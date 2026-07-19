# Diseño: demo pública limitada (gate + sesión con expiración)

Fecha: 2026-07-18

## Contexto

`aureo-demo` es una app estática cliente-only (HTML/JS/CSS, sin build, con
funciones serverless sueltas bajo `api/` estilo Vercel — ver
`api/melyor-chat.js`) con 3 usuarios hardcodeados (`admin`/`warehouse`/`cashier`,
ver `auth.js`) y todo el estado en `localStorage` (`aura_*`, `vulcan_*`, ver
`core.js`). Se enlaza desde `DemoSection.tsx` en `aureo-landing` vía
`NEXT_PUBLIC_DEMO_URL`, y hoy es de acceso libre, sin límite de tiempo, sin
captura de lead y sin ninguna restricción de uso.

Problema: cualquiera puede usarla indefinidamente como herramienta gratis,
sin dejar contacto, sin que los datos se reinicien (localStorage persiste
por visitante) y sin protección contra que alguien rompa módulos sensibles
(Permisos, Configuración, borrado masivo).

`aureo-landing` ya tiene infraestructura de captura de leads reutilizable:
`POST /api/waitlist` (`app/api/waitlist/route.ts`) con validación
(`lib/validation.ts`), rate limiting (`lib/ratelimit.ts`), BotID
(`checkBotId`) y Supabase (`lib/supabase.ts`). `aureo-demo` y `aureo-landing`
son dos proyectos Vercel independientes sin base de datos compartida.

## Decisiones (confirmadas con el usuario)

- Gate **antes** de entrar a la demo (no acceso libre con captura posterior).
- Gate real: bloquea también el acceso directo a la URL de la demo, no solo
  un funnel de UX en la landing.
- Sin compartir Supabase entre proyectos — token firmado (HMAC) con secreto
  compartido vía env var, validado en un endpoint serverless propio de
  `aureo-demo`.
- Sesión de demo: 30 minutos.
- Al expirar: reset de datos + vuelta al gate.
- Se bloquean módulos/acciones sensibles (Permisos, Configuración,
  cambio de password de usuarios demo, borrado masivo si existe).
- Banner persistente visible indicando modo demo + tiempo restante.

## Arquitectura

```
Landing (aureo-landing)                 Demo (aureo-demo, Vercel serverless)
──────────────────────                  ──────────────────────────────────
[Botón "Explorar demo" en DemoSection]
        │
        ▼
[Modal DemoGateForm: email + nombre opcional]
        │
        ▼
POST /api/waitlist  { email, nombre?, origen: "demo" }
        │  (guardas existentes: origin/content-type/size/botid/rate-limit)
        ▼
ok:true
        │
        ▼
POST /api/demo-token  { email }
        │  (mismas guardas; firma HMAC-SHA256 de `${email}.${exp}`
        │   con DEMO_TOKEN_SECRET, exp = now + 30min)
        ▼
{ ok: true, token }   token = base64url(`${email}.${exp}.${sig}`)
        │
        ▼
redirect → `${DEMO_URL}/login.html?token=${token}`
                                          │
                                          ▼
                                   demo-gate.js (nuevo, se carga antes
                                   que core.js/auth.js en index.html y
                                   login.html)
                                          │
                        ¿hay sesión de gate vigente en sessionStorage?
                          │ sí                    │ no
                          ▼                       ▼
                     deja pasar          ¿hay `?token=` en la URL?
                                            │ sí            │ no
                                            ▼               ▼
                                   GET /api/verify-demo-token   pantalla de
                                   ?token=...                    bloqueo con
                                            │                    link a la
                                    ok:true  │  ok:false          landing
                                       │     └──────► redirige a
                                       ▼               landing?demo=expired
                              limpia localStorage
                              (keys aura_*, vulcan_*)
                              guarda { exp } en sessionStorage
                              limpia ?token= de la URL (history.replaceState)
                              deja pasar
```

`DEMO_TOKEN_SECRET` es la única pieza compartida entre los dos proyectos
Vercel (mismo valor como env var en ambos). No hay llamada de red entre
`aureo-demo` y `aureo-landing` en tiempo de verificación: el endpoint de
`aureo-demo` valida la firma localmente.

## Parte 1 — Landing: `DemoGateForm` + `/api/demo-token`

### `DemoGateForm` (nuevo componente)

- Se abre como modal al hacer click en el CTA de `DemoSection.tsx` (hoy es
  un `<a href={DEMO_URL}>` directo bajo `{DEMO_URL && (...)}`; pasa a ser un
  `<button onClick={() => setOpen(true)}>`).
- Campos: `email` (requerido), `nombre` (opcional). Mismo patrón visual que
  `WaitlistForm.tsx`.
- Submit → `POST /api/waitlist` con `origen: "demo"` (permite distinguir
  estos leads del waitlist general en Supabase/reporting; no requiere
  cambios de schema, la columna `origen` ya existe).
- Si `ok:true` → `POST /api/demo-token` con `{ email }` → si `ok:true`,
  `window.location.href = \`${DEMO_URL}/login.html?token=${token}\``.
- Manejo de error: mismo patrón de `WaitlistForm` (mensaje inline, no
  bloquea reintento).
- Si `DEMO_URL` no está seteado (como hoy en algunos entornos), el CTA ni
  siquiera se renderiza — sin cambios en ese comportamiento.

### `POST /api/demo-token` (nuevo route handler)

`app/api/demo-token/route.ts`:

- Reusa `runGuards`-equivalente (origin, content-type, tamaño, botid, rate
  limit) — se extrae la función `runGuards` de `waitlist/route.ts` a un
  helper compartido (`lib/api-guards.ts`) para no duplicarla.
- Body: `{ email: string }`. Valida formato de email (reusa el validador de
  `lib/validation.ts`).
- Firma: `exp = Date.now() + 30*60*1000`; `payload = \`${email}.${exp}\``;
  `sig = HMAC-SHA256(payload, DEMO_TOKEN_SECRET)` (hex); `token =
  base64url(\`${payload}.${sig}\`)`.
- No escribe nada en Supabase — el registro del lead ya ocurrió en el paso
  del `/api/waitlist`. Este endpoint solo emite el token.
- Responde `{ ok: true, token }`.

## Parte 2 — Demo: `demo-gate.js` + `/api/verify-demo-token`

### `api/verify-demo-token.js` (nuevo, mismo estilo sin-dependencias que
`melyor-chat.js`)

- `GET ?token=...`.
- Decodifica base64url → `email.exp.sig`. Recalcula HMAC con
  `DEMO_TOKEN_SECRET` y compara con `sig` (comparación constant-time).
- Si la firma no matchea, o `Date.now() > exp` → `{ ok: false }`, 401.
- Si válida → `{ ok: true, exp }`, 200.

### `demo-gate.js` (nuevo, primer `<script>` cargado en `index.html` y
`login.html`, antes de `core.js`)

Constante: `DEMO_SESSION_KEY = "aura_demo_session"` (guarda `{ exp }` en
`sessionStorage`, no `localStorage` — así no sobrevive a cerrar la pestaña,
reforzando que es una sesión acotada).

Al cargar:

1. Lee `aura_demo_session` de `sessionStorage`. Si existe y `exp > now` →
   sigue cargando la app normalmente (no vuelve a pegarle al endpoint).
2. Si no hay sesión vigente, busca `?token=` en la URL:
   - Sin token → reemplaza el `<body>` por una pantalla de bloqueo simple
     ("Esta demo requiere acceso — volvé a la landing") con link a la
     landing. No renderiza el resto de la app.
   - Con token → `fetch('/api/verify-demo-token?token=...')`.
     - `ok:false` → limpia cualquier resto de `localStorage` de sesiones
       previas y redirige a `${LANDING_URL}/?demo=expired`.
     - `ok:true` → limpia todas las keys `aura_*` y `vulcan_*` de
       `localStorage` (reset a estado limpio; `core.js` las re-siembra
       desde `DEMO_DATA` como ya hace hoy cuando están vacías), guarda
       `{ exp }` en `sessionStorage`, limpia `?token=` de la URL vía
       `history.replaceState`, y deja continuar la carga normal.
3. Inyecta el banner persistente (ver Parte 3) y arranca un `setInterval` de
   1s que recalcula el tiempo restante contra `exp`; al llegar a 0, limpia
   `localStorage`/`sessionStorage` y redirige a
   `${LANDING_URL}/?demo=expired`.

`LANDING_URL` se resuelve igual que `AUTH_API` en `auth.js` hoy (constante
al tope del archivo, configurable).

### Landing: manejo de `?demo=expired`

`DemoSection.tsx` (o `page.tsx`) detecta el query param al montar y abre
`DemoGateForm` directamente con un mensaje corto ("Tu sesión de demo
expiró — dejá tu email para volver a entrar"), evitando que el usuario
tenga que volver a encontrar el botón.

## Parte 3 — Banner de modo demo

- Barra fija arriba de todo (`position: fixed; top: 0`), fuera del flujo
  normal del sidebar/contenido (ajustar `padding-top` del `body` o
  `.sidebar`/`.main-content` para no tapar nada — mismo enfoque que ya usa
  `desktop-only.html` para su propio aviso, si aplica un patrón similar).
- Texto: `MODO DEMO · datos de ejemplo, se reinician al expirar · 29:58`
  (mm:ss countdown en vivo).
- Estilo neutro/informativo (no rojo alarmante) — es un aviso, no un error.
- Se inyecta desde `demo-gate.js`, no requiere tocar cada HTML.

## Parte 4 — Acciones y módulos bloqueados

En `auth.js`, `getAllowedTabs()`-equivalente (`ROLE_TABS`/roles guardados en
`aura_roles`) se filtra con una bandera `window.AURA_DEMO_MODE = true`
(seteada por `demo-gate.js` antes de que corra `auth.js`):

- Se excluyen las tabs `permissions`/`settings` del set devuelto,
  independientemente de lo que diga el rol o los roles custom guardados —
  evita que alguien cree roles nuevos o reconfigure los 3 fijos y rompa la
  demo para el resto de su propia sesión (no afecta a otros visitantes,
  cada uno tiene su propio `localStorage`, pero igual generaría una demo
  inconsistente/rota dentro de esa sesión de 30 min).
- Se bloquea el cambio de password de los 3 usuarios demo (si existe esa
  función en algún módulo) mostrando un mensaje "No disponible en modo
  demo".
- Si existe alguna acción de borrado masivo (ej. "vaciar inventario",
  "borrar todos los clientes"), se deshabilita el botón correspondiente con
  el mismo mensaje. (A confirmar cuáles existen realmente al implementar —
  requiere grep de `confirm(` / acciones de borrado en `inventory-ui.js`,
  `clients.js`, etc.)

No se toca `permissions.js` en su lógica de negocio — el filtro de modo
demo es una capa encima, en `auth.js`, para no mezclar "qué puede ver un
rol" con "qué está disponible en modo demo".

## Fuera de alcance

- Revocación activa de tokens ya emitidos (requeriría estado compartido;
  se descartó a propósito — el token expira solo en 30 min).
- Verificación de email (magic link) — el gate captura el lead pero no
  confirma que el email sea real, igual que el waitlist actual.
- Persistencia de qué visitantes ya usaron la demo (no hay límite de "una
  demo por email"; alguien puede volver a pedir acceso las veces que
  quiera, cada vez deja un nuevo lead con `origen: "demo"`).
- Cambios al esquema de Supabase (la columna `origen` ya soporta el valor
  `"demo"` sin migración).

## Testing

- `aureo-landing`: unit test de la firma/verificación de token (si se
  extrae a un helper compartido, testear en ambos lados con el mismo
  secreto de prueba). Test de `runGuards` extraído (ya cubierto
  indirectamente hoy vía `waitlist/route.ts` tests, si existen).
- `aureo-demo`: no hay test runner hoy (proyecto sin build/npm); validar
  manualmente el flujo completo (gate → token → entrada → countdown →
  expiración → reset) vía navegador, igual que se testea `melyor-chat.js`
  manualmente hoy.
- Caso borde a verificar a mano: token válido pero manipulado (cambiar un
  carácter del email o del exp) → debe fallar la verificación de firma.
