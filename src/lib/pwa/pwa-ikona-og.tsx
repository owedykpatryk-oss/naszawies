const LOGO_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

/** Grafika ikony PWA / favicon — oficjalne logo z `/public/marka/`. */
export function PwaIkonaOgGrafika({ rozmiar }: { rozmiar: number }) {
  return (
    <div
      style={{
        width: rozmiar,
        height: rozmiar,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#1a3d1a",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${LOGO_URL}/marka/logo-naszawies.png`}
        alt=""
        width={rozmiar}
        height={rozmiar}
        style={{ borderRadius: rozmiar * 0.18 }}
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
          src={`${LOGO_URL}/marka/logo-naszawies.png`}
          alt=""
          width={160}
          height={160}
          style={{ borderRadius: 28 }}
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
