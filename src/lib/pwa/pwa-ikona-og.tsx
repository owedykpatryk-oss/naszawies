import { MARKA_SCIEZKI } from "@/lib/marka/sciezki";

const LOGO_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

/** Grafika ikony PWA / favicon — emblem z przezroczystym tłem. */
export function PwaIkonaOgGrafika({ rozmiar }: { rozmiar: number }) {
  return (
    <div
      style={{
        width: rozmiar,
        height: rozmiar,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(145deg, #c5e1a5 0%, #2d5a2d 100%)",
        borderRadius: rozmiar * 0.22,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${LOGO_URL}${MARKA_SCIEZKI.emblem512}`}
        alt=""
        width={Math.round(rozmiar * 0.88)}
        height={Math.round(rozmiar * 0.88)}
      />
    </div>
  );
}

/** Znak marki w poziomym układzie OG (1200×630). */
export function MarkaOgGrafika() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f5f1e8 0%, #e8f0e0 40%, #fff7ed 100%)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 48, padding: "0 64px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${LOGO_URL}${MARKA_SCIEZKI.emblem512}`}
          alt=""
          width={160}
          height={160}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "baseline", fontSize: 72, fontWeight: 700, letterSpacing: -2 }}>
            <span style={{ color: "#7cb342" }}>naszawies</span>
            <span style={{ color: "#d4a017", fontWeight: 600 }}>.pl</span>
          </div>
          <p style={{ margin: 0, fontSize: 32, color: "#44403c", maxWidth: 640, lineHeight: 1.35 }}>
            Cyfrowy dom polskiej wsi — bezpłatnie dla sołtysów i mieszkańców
          </p>
        </div>
      </div>
    </div>
  );
}
