import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

// Content-Security-Policy. 'unsafe-inline' on script-src is required because Next
// injects inline hydration scripts without a nonce; tightening to a nonce-based
// CSP needs middleware (future hardening). Vercel Analytics needs its script +
// same-origin beacon endpoint (/_vercel/insights, covered by 'self').
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com",
  "font-src 'self'",
  "media-src 'self' https://*.public.blob.vercel-storage.com",
  "connect-src 'self' https://va.vercel-scripts.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false, // strip X-Powered-By: Next.js
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

// withBotId injects the proxy rewrites BotID needs for bot challenges.
export default withBotId(nextConfig);
