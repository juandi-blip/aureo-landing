"use client";
import { Analytics, type BeforeSend } from "@vercel/analytics/next";

// /auth/reset y /auth/confirm llevan token_hash y email en el query string, y
// /auth/oauth-callback recibe access_token/refresh_token en el fragmento (#)
// del flujo implícito de OAuth — Vercel Web Analytics registra la URL
// completa de cada pageview, así que sin esto un token de un solo uso (o,
// peor, un access token y un refresh token de larga duración) terminarían en
// el dashboard de analítica de un tercero.
const stripAuthTokens: BeforeSend = (event) => {
  try {
    const url = new URL(event.url, "https://placeholder.invalid");
    if (
      url.pathname === "/auth/reset" ||
      url.pathname === "/auth/confirm" ||
      url.pathname === "/auth/oauth-callback"
    ) {
      url.search = "";
      url.hash = "";
    }
    return { ...event, url: url.pathname + url.search + url.hash };
  } catch {
    return event;
  }
};

export function AnalyticsWithTokenStrip() {
  return <Analytics beforeSend={stripAuthTokens} />;
}
