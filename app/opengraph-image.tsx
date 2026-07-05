import { ImageResponse } from "next/og";

// No runtime override: the image is statically generated at build time
// instead of rendering on demand per request.
export const alt = "Aureo — Inventario, ventas y bodega para tu negocio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "#1E3352",
          padding: "72px 80px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background rings — Saturn motif */}
        <div
          style={{
            position: "absolute",
            right: -60,
            top: "50%",
            width: 520,
            height: 520,
            borderRadius: "50%",
            border: "1.5px solid rgba(168,116,43,0.25)",
            transform: "translateY(-50%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 20,
            top: "50%",
            width: 380,
            height: 380,
            borderRadius: "50%",
            border: "1px solid rgba(168,116,43,0.15)",
            transform: "translateY(-50%)",
            display: "flex",
          }}
        />

        {/* Logo mark */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 40 }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#A8742B" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="11" r="5.1" />
            <ellipse cx="12" cy="11" rx="10.6" ry="3.5" transform="rotate(-24 12 11)" />
          </svg>
          <span style={{ fontSize: 28, fontWeight: 800, color: "#F7F3EA", letterSpacing: "-0.5px" }}>
            Aureo
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: "#F7F3EA",
            lineHeight: 1.08,
            letterSpacing: "-1px",
            maxWidth: 700,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>El control de tu</span>
          <span>inventario, ventas y</span>
          <span style={{ color: "#A8742B" }}>bodega.</span>
        </div>

        {/* Subline */}
        <p
          style={{
            fontSize: 20,
            color: "rgba(247,243,234,0.65)",
            marginTop: 24,
            maxWidth: 580,
            lineHeight: 1.5,
            display: "flex",
          }}
        >
          Inteligencia logística para ferreterías, distribuidoras y negocios con stock.
        </p>

        {/* CTA pill */}
        <div
          style={{
            marginTop: 36,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "#A8742B",
            borderRadius: 40,
            padding: "12px 28px",
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>
            Únete a la lista de espera
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
