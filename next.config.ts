import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

// Content-Security-Policy. 'unsafe-inline' on script-src is required because
// Next.js injects inline hydration scripts without a nonce. Tightening to a
// nonce-based CSP needs middleware (future hardening).
// Supabase and Resend are server-side only — the browser never talks to them,
// so they stay out of connect-src/img-src (less exfiltration surface if an XSS
// ever lands). next/font self-hosts Google fonts, so fonts.gstatic.com is not
// needed either.
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
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/",
        headers: [
          { key: "Cache-Control", value: "public, max-age=60, stale-while-revalidate=300" },
        ],
      },
      {
        // Media pesada de public/: cache de 1h en navegador + SWR de 1 día.
        // No immutable: los nombres no llevan hash y podrían reemplazarse.
        source: "/:file(aureo-video.mp4|aureo-video-poster.jpg)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" },
        ],
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default withBotId(nextConfig);
