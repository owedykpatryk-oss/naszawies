import { ImageResponse } from "next/og";
import { PwaIkonaOgGrafika } from "@/lib/pwa/pwa-ikona-og";

export const runtime = "edge";
export const alt = "naszawies.pl — cyfrowy dom polskiej wsi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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
          background: "linear-gradient(145deg, #f5f1e8 0%, #e8f0e3 50%, #d4e4cc 100%)",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <PwaIkonaOgGrafika rozmiar={120} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 72, fontWeight: 700, color: "#2d5a2d", lineHeight: 1.1 }}>
              nasza<span style={{ color: "#5a9c3e" }}>wies</span>
              <span style={{ color: "#d4a017", fontWeight: 500 }}>.pl</span>
            </div>
            <div style={{ marginTop: 16, fontSize: 28, color: "#5a6b5a" }}>
              Cyfrowy dom polskiej wsi
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
