# Aureo — Landing Page

Landing page de **Aureo**, el sistema de control logístico para ferreterías y negocios de bodega. Inventario, ventas y análisis ABC en un solo lugar.

## Stack

- **Next.js 16** (App Router, estático + 1 serverless function)
- **TypeScript** + **Tailwind CSS v4**
- **Motion (Framer)** — animaciones cinematográficas por sección
- **Supabase** — waitlist (tabla `waitlist`, RLS habilitado)
- **Vercel Blob** — video demo servido desde CDN
- **Upstash Redis** — rate limiting (5 req/min/IP, sliding window)
- **Vercel BotID** — detección de bots en el endpoint de waitlist

## Desarrollo local

```bash
pnpm install
cp .env.local.example .env.local   # completar con tus vars
pnpm dev
```

Abre [http://localhost:3001](http://localhost:3001) (el 3000 puede estar ocupado por Remotion).

## Variables de entorno

Ver `.env.local.example`. Las obligatorias para producción:

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (solo server-side) |
| `UPSTASH_REDIS_REST_URL` | URL del store Redis en Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | Token REST de Upstash |
| `NEXT_PUBLIC_DEMO_VIDEO_URL` | URL pública del video en Vercel Blob |

Sin `UPSTASH_*`: el rate limiting se desactiva (fail-open), el resto funciona.  
Sin `NEXT_PUBLIC_DEMO_VIDEO_URL`: el video se sirve desde `/public/aureo-video.mp4` (local).

## Subir video al Blob

```bash
$env:BLOB_READ_WRITE_TOKEN = "vercel_blob_rw_..."
node scripts/upload-video-to-blob.mjs
```

Requiere un Blob store público (`aureo-assets`) conectado al proyecto en Vercel.

## Seguridad del endpoint `/api/waitlist`

Capas de protección apiladas:
1. **Cross-origin check** — rechaza `Origin` externo (403)
2. **Vercel BotID** — challenge criptográfico en Vercel (fail-open local)
3. **Rate limiting** — Upstash Redis, 5 req/min por IP (429)
4. **Honeypot** — campo oculto `sitio_web`; si está lleno → 200 falso
5. **Validación** — email RFC + caps de longitud por campo

## Estructura

```
app/
  page.tsx              # página principal (estática)
  layout.tsx            # metadata, fonts, Analytics
  api/waitlist/route.ts # único endpoint serverless
components/             # secciones animadas de la landing
lib/
  validation.ts         # parseWaitlistPayload + honeypot
  ratelimit.ts          # checkRateLimit con Upstash
  supabase.ts           # getSupabaseAdmin (singleton)
  motion.ts             # variantes de animación compartidas
scripts/
  upload-video-to-blob.mjs
instrumentation-client.ts  # initBotId
```

## Deploy

Push a `main` triggerea deploy automático en Vercel (integración git).  
Rama de desarrollo activa: `feat/cinematic-redesign`.
