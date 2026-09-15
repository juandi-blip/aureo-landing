"use client";
import { Analytics, type BeforeSend } from "@vercel/analytics/next";

// /auth/reset y /auth/confirm llevan token_hash y email en el query string —
// Vercel Web Analytics registra la URL completa de cada pageview, así que sin
// esto un token de un solo uso (todavía sin consumir) y el correo de la
// cuenta terminarían en el dashboard de analítica de un tercero.
const stripAuthTokens: BeforeSend = (event) => {
  try {
    const url = new URL(event.url, "https://placeholder.invalid");
    if (url.pathname === "/auth/reset" || url.pathname === "/auth/confirm") {
      url.search = "";
    }
    return { ...event, url: url.pathname + url.search + url.hash };
  } catch {
    return event;
  }
};

export function AnalyticsWithTokenStrip() {
  return <Analytics beforeSend={stripAuthTokens} />;
}
