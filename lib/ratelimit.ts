import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Sliding-window limiter backed by Upstash Redis (distributed, works across
// serverless instances). Disabled gracefully when env vars are absent (local
// dev) so the endpoint still works — the other guards stay active.
const configured =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const ratelimit = configured
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, "60 s"), // 5 req/min per IP
      analytics: true,
      prefix: "waitlist",
    })
  : null;

/** Returns true if the request may proceed, false if rate-limited. */
export async function checkRateLimit(ip: string): Promise<boolean> {
  if (!ratelimit) return true; // not configured → don't block
  const { success } = await ratelimit.limit(ip);
  return success;
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function getClientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
