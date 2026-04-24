import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "naszawies.pl — cyfrowy dom polskiej wsi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Obraz Open Graph przy udostępnianiu linku (Slack, Messenger itd.). */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(165deg, #f5f1e8 0%, #e8e4dc 45%, #dce8d4 100%)",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
            marginBottom: 36,
          }}
        >
          <div
            style={{
              width: 120,
              height: 120,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #5a9c3e 0%, #2d5a2d 100%)",
              borderRadius: 9999,
              boxShadow: "0 12px 40px rgba(45, 90, 45, 0.25)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "28px solid transparent",
                  borderRight: "28px solid transparent",
                  borderBottom: "34px solid #f5f1e8",
                }}
              />
              <div
                style={{
                  width: 56,
                  height: 34,
                  marginTop: -2,
                  backgroundColor: "#f5f1e8",
                  border: "3px solid #d4a017",
                  borderTop: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: -2, lineHeight: 1 }}>
              <span style={{ color: "#2d5a2d" }}>nasza</span>
              <span style={{ color: "#5a9c3e" }}>wies</span>
              <span style={{ color: "#d4a017", fontWeight: 600 }}>.pl</span>
            </div>
            <div
              style={{
                fontSize: 32,
                color: "#3d5c33",
                fontWeight: 500,
                maxWidth: 900,
                lineHeight: 1.35,
              }}
            >
              Cyfrowy dom polskiej wsi
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
