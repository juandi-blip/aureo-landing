import { ImageResponse } from "next/og";

export const size = { width: 128, height: 128 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #2E4A6E 0%, #1E3352 100%)",
          borderRadius: "50%",
        }}
      >
        <svg width="86" height="86" viewBox="0 0 24 24">
          <defs>
            <radialGradient id="planet" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#fff5b3" />
              <stop offset="45%" stopColor="#ffd246" />
              <stop offset="100%" stopColor="#a8742b" />
            </radialGradient>
          </defs>
          <circle cx="12" cy="11" r="5.1" fill="url(#planet)" />
          <ellipse
            cx="12"
            cy="11"
            rx="10.6"
            ry="3.5"
            transform="rotate(-24 12 11)"
            fill="none"
            stroke="#ffd246"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
