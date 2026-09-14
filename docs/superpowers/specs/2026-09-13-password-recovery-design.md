# Recuperación de contraseña — design

Feature independiente, posterior al sub-proyecto B (auth/multi-tenant
foundation). Reutiliza la infraestructura de auth ya construida ahí
(`lib/supabase.ts`, `lib/api-guards.ts`, `lib/auth-validation.ts`,
`components/ui/AuthCard.tsx` / `AuthAmbient.tsx`, `lib/motion.ts`) y el
patrón de confirmación por clic explícito introducido para arreglar el
bug de escáneres de spam consumiendo links de un solo uso
(`components/ConfirmAccount.tsx`, `app/auth/confirm/page.tsx`).

## Goal

Los usuarios que olvidan su contraseña hoy no tienen ninguna forma de
recuperar acceso a su cuenta — no existe UI de "olvidé mi contraseña" en
`aureo-landing`. Construir ese flujo con garantías de seguridad
explícitas: no revelar si un correo existe, cerrar sesiones activas al
cambiar la contraseña, notificar al dueño real de la cuenta, y exigir
contraseñas más fuertes (mayúscula + minúscula + número) tanto en este
flujo como en el registro.

## Contexto

- Canal único: **correo**. No se pide ni se guarda teléfono en el
  registro hoy, así que recuperación por SMS queda fuera de alcance —
  se puede agregar después si hace falta, pero implicaría pedir/verificar
  teléfono en signup y un proveedor de SMS (Twilio u otro), costo por
  mensaje incluido.
- Supabase Auth ya soporta el flujo de recovery
  (`resetPasswordForEmail` + `verifyOtp({type:"recovery"})` +
  `updateUser({password})`), pero su plantilla de correo por defecto usa
  `{{ .ConfirmationURL }}` — el mismo link que se autoconsume con un
  simple GET y que causó el bug de confirmación de cuenta (un escáner de
  spam de Gmail lo visitaba antes de que el usuario le diera clic). Este
  flujo debe usar desde el día uno el patrón de `{{ .TokenHash }}` +
  página propia que requiere una acción real del usuario.
- `@supabase/supabase-js` 2.108.2 ya está instalado y soporta
  `signOut({ scope: "others" | "local" | "global" })` — no hace falta
  service role ni lógica custom para cerrar sesiones ajenas.
- No hay carpeta de tests ni framework configurado en este repo;
  verificación es manual, igual que el resto del proyecto.
- Remitente actual (`onboarding@resend.dev`, sandbox de Resend) solo
  entrega al correo dueño de la cuenta de Resend — limitación ya conocida
  y fuera de alcance de este spec (se resuelve verificando un dominio
  propio, tarea aparte).

## Decisiones tomadas durante el brainstorming

1. **Canales:** solo correo por ahora. Sin teléfono/SMS.
2. **No enumeración:** `/api/auth/forgot-password` responde siempre el
   mismo mensaje genérico, exista o no la cuenta.
3. **Cierre de sesiones:** al cambiar la contraseña exitosamente, se
   cierran todas las demás sesiones activas (`scope: "others"`), dejando
   viva solo la sesión donde se hizo el cambio.
4. **Notificación:** correo de aviso "tu contraseña cambió" enviado
   desde el servidor tras un cambio exitoso. No bloquea el flujo si
   falla — la contraseña ya cambió, eso es lo crítico.
5. **Rate limiting:** se reutiliza el limiter genérico ya aplicado por
   `runGuards()` (5 req/60s por IP) — no se agrega un segundo limiter
   dedicado, para no duplicar infraestructura sin necesidad concreta.
6. **Fuerza de contraseña:** mínimo 8 caracteres, al menos 1 mayúscula,
   1 minúscula, 1 número. Sin símbolo obligatorio (fricción innecesaria,
   NIST ya no lo recomienda como requisito). Aplica **tanto** al registro
   como al reset — un solo validador compartido.

## Flujo

1. `/login` gana un link "¿Olvidaste tu contraseña?" → `/forgot-password`.
2. Usuario escribe su correo → `POST /api/auth/forgot-password`.
3. La ruta llama a `supabase.auth.resetPasswordForEmail(email, { redirectTo: `${SITE_URL}/auth/reset` })`
   y responde siempre `{ ok: true }` con mensaje genérico.
4. La plantilla "Reset password" en el dashboard de Supabase se actualiza
   (igual que se hizo para "Confirm sign up") para apuntar a:
   `{{ .SiteURL }}/auth/reset?token_hash={{ .TokenHash }}&type=recovery`
   — un link que no hace nada hasta que el usuario interactúa con la
   página.
5. Usuario abre `/auth/reset`, ve un formulario de nueva contraseña
   (+ confirmar contraseña). Al enviar, `ResetPasswordForm.tsx` ejecuta
   en orden:
   1. `supabase.auth.verifyOtp({ token_hash, type: "recovery" })` —
      establece sesión, consume el token.
   2. `supabase.auth.updateUser({ password })` — cambia la contraseña.
   3. `supabase.auth.signOut({ scope: "others" })` — cierra otras
      sesiones, best-effort (no bloquea el flujo si falla).
   4. `fetch("/api/auth/notify-password-changed", { headers: { Authorization: "Bearer " + access_token } })`
      — dispara el correo de aviso, best-effort.
   5. Redirige a `/login`.

## Componentes

**Páginas nuevas** (mismo estilo visual que `/login` y `/registro`):
- `app/forgot-password/page.tsx` + `components/ForgotPasswordForm.tsx`
  — un campo de correo, reusa `AuthCard`/`AuthAmbient`/`lib/motion.ts`.
- `app/auth/reset/page.tsx` + `components/ResetPasswordForm.tsx` — lee
  `token_hash`/`type` de `useSearchParams()` (mismo patrón que
  `ConfirmAccount.tsx`), formulario de nueva contraseña + confirmación.

**Rutas API nuevas:**
- `app/api/auth/forgot-password/route.ts` — `runGuards()` +
  `parseForgotPasswordPayload` (solo valida forma de correo) +
  `resetPasswordForEmail`. Se agrega a `instrumentation-client.ts` →
  `protect: [...]` (lección del bug de BotID: una ruta ausente ahí
  bloquea usuarios reales).
- `app/api/auth/notify-password-changed/route.ts` — recibe el access
  token en `Authorization: Bearer <token>`, lo valida con
  `supabase.auth.getUser(token)` (401 si inválido), y manda el correo de
  aviso vía `lib/email.ts` (Resend). No pasa por BotID — no lo invoca un
  formulario público, requiere una sesión válida recién creada.

**Validación compartida (`lib/auth-validation.ts`):**
- `isValidPassword` se reemplaza por una versión que exige 8-72
  caracteres + al menos 1 mayúscula + 1 minúscula + 1 número. La usan
  `parseSignupPayload` (ya existe) y el nuevo
  `parseResetPasswordPayload` (nuevo, valida la nueva contraseña en el
  cliente antes de llamar a `updateUser`, y opcionalmente en una versión
  server-side si se decide validar también ahí — ver Riesgos).
- Mensaje de error: "Debe tener mínimo 8 caracteres, con mayúscula,
  minúscula y número."

## Manejo de errores

- **`/api/auth/forgot-password`:** cualquier resultado de Supabase
  (correo no existe, error de red, lo que sea) → mismo `{ ok: true }`
  genérico. Solo correo mal formado o bot detectado dan 400/403 — la
  distinción entre "no existe" y "sí existe" nunca llega al cliente.
- **`ResetPasswordForm.tsx`:**
  - `verifyOtp` falla (token expirado/ya usado) → "Este enlace ya
    expiró o fue usado" + botón para pedir uno nuevo (vuelve a llamar a
    `/api/auth/forgot-password`, pidiendo el correo de nuevo ya que en
    este punto no hay sesión ni se conoce el correo con certeza).
  - `updateUser` falla (contraseña no cumple el esquema) → mensaje de
    validación normal; la sesión de `verifyOtp` sigue viva, el usuario
    puede reintentar sin gastar el token de nuevo.
  - `signOut({scope:"others"})` o el aviso por correo fallan → no
    bloquean el flujo (`console.error` server-side donde aplique, pero
    el usuario sigue a `/login` con la contraseña ya cambiada).
  - Toda la cadena envuelta en try/catch (lección de la revisión de
    código en `ConfirmAccount.tsx`: sin esto, un fallo de red deja el
    botón colgado en "Cambiando…" para siempre).

## Riesgos / cabos sueltos

- La validación de fuerza de contraseña en `updateUser` solo corre
  client-side salvo que se decida replicarla server-side también; dado
  que Supabase Auth ya rechaza contraseñas fuera de longitud, pero no
  fuerza mayúscula/minúscula/número por sí mismo, un cliente que se
  salte el JS (poco realista para un usuario real) podría en teoría
  mandar una contraseña débil directo a `updateUser`. Impacto bajo (no
  es un endpoint público sin auth), pero queda anotado.
- El correo de aviso "tu contraseña cambió" comparte la misma
  limitación de sandbox de Resend que ya bloquea pruebas con correos
  que no sean el dueño de la cuenta — no se puede probar de extremo a
  extremo con un correo de prueba distinto hasta verificar un dominio.
- No hay UI para "olvidé mi contraseña Y mi correo" (cuenta huérfana) —
  fuera de alcance, ese caso requiere soporte manual.

## Testing (manual)

- Pedir reset con correo real → click en el link → cambiar contraseña →
  verificar en Supabase (Auth Logs + Users) que el cambio se aplicó y
  que la sesión anterior quedó invalidada.
- Correo inexistente → confirmar que la respuesta es byte-idéntica a la
  de un correo existente (Network tab).
- Link usado dos veces → segundo intento muestra el mensaje de
  expirado + botón de reenviar.
- Contraseña que no cumple el esquema nuevo (ej. solo minúsculas) →
  mensaje de validación, sin gastar el token.
- Reventar el rate limit (6+ requests rápidos a `/forgot-password`) →
  confirmar bloqueo.
- Confirmar llegada del correo de aviso (sujeto a la limitación de
  sandbox de Resend mencionada arriba).
