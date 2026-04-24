import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** apple-touch-icon — iOS / „Dodaj do ekranu głównego”. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #5a9c3e 0%, #2d5a2d 100%)",
          borderRadius: 36,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: "42px solid transparent",
              borderRight: "42px solid transparent",
              borderBottom: "52px solid #f5f1e8",
            }}
          />
          <div
            style={{
              width: 84,
              height: 52,
              marginTop: -2,
              backgroundColor: "#f5f1e8",
              border: "4px solid #d4a017",
              borderTop: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
