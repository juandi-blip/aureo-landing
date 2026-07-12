import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Lazily initialized — avoids module-level Redis.fromEnv() call during build.
let ratelimit: Ratelimit | null = null;

function getRatelimit(): Ratelimit | null {
  if (ratelimit) return ratelimit;
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token || !url.startsWith("https")) {
    if (process.env.NODE_ENV === "production") {
      console.warn("[ratelimit] Upstash no configurado — /api/waitlist queda sin límite de tasa.");
    }
    return null;
  }
  ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(5, "60 s"),
    analytics: true,
    prefix: "waitlist",
  });
  return ratelimit;
}

/** Returns true if the request may proceed, false if rate-limited. */
export async function checkRateLimit(ip: string): Promise<boolean> {
  const rl = getRatelimit();
  if (!rl) return true; // not configured → don't block
  const { success } = await rl.limit(ip);
  return success;
}

/**
 * Client IP para la key del rate limit.
 *
 * Fuente de confianza: `x-real-ip`. En Vercel lo SETEA el edge con la IP real de
 * la conexión y sobrescribe cualquier valor que mande el cliente, así que no es
 * falsificable. Priorizarlo es lo que cierra el bypass: un atacante ya no puede
 * rotar `x-forwarded-for` para caer en keys distintas, porque cuando estamos
 * detrás del edge nunca leemos XFF.
 *
 * Fallback `x-forwarded-for`: solo aplica fuera de Vercel (dev local u otro
 * proxy), donde el spoofing no es una amenaza de producción. Usamos el PRIMER
 * valor, que es la IP original del cliente según documenta Vercel.
 */
export function getClientIp(request: Request): string {
  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return real;
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return "unknown";
}
