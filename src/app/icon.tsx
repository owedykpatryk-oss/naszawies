import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Ikona karty przeglądarki — znak jak w logo (dach + ściany). */
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
          background: "linear-gradient(135deg, #5a9c3e 0%, #2d5a2d 100%)",
          borderRadius: 9999,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 1,
          }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: "7px solid transparent",
              borderRight: "7px solid transparent",
              borderBottom: "9px solid #f5f1e8",
            }}
          />
          <div
            style={{
              width: 14,
              height: 9,
              marginTop: -1,
              backgroundColor: "#f5f1e8",
              border: "1.5px solid #d4a017",
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
