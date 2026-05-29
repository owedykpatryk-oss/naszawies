/**
 * Grafika ikony PWA / favicon dla {@link ImageResponse} (next/og).
 * Ten sam znak co {@link ZnakNaszawiesSvg} — chałupa w zielonym kole.
 */
export function PwaIkonaOgGrafika({ rozmiar }: { rozmiar: number }) {
  return (
    <svg width={rozmiar} height={rozmiar} viewBox="0 0 48 48">
      <defs>
        <linearGradient id="naszawiesZnakOg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5a9c3e" />
          <stop offset="100%" stopColor="#2d5a2d" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="24" fill="url(#naszawiesZnakOg)" />
      <path
        d="M14 32V20L24 12L34 20V32H28V24H20V32H14Z"
        fill="#f5f1e8"
        stroke="#d4a017"
        strokeWidth="1.2"
      />
      <circle cx="24" cy="18" r="1.5" fill="#d4a017" />
    </svg>
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 48,
          padding: "0 64px",
        }}
      >
        <svg width={160} height={160} viewBox="0 0 48 48">
          <defs>
            <linearGradient id="naszawiesZnakOgHero" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5a9c3e" />
              <stop offset="100%" stopColor="#2d5a2d" />
            </linearGradient>
          </defs>
          <circle cx="24" cy="24" r="24" fill="url(#naszawiesZnakOgHero)" />
          <path
            d="M14 32V20L24 12L34 20V32H28V24H20V32H14Z"
            fill="#f5f1e8"
            stroke="#d4a017"
            strokeWidth="1.2"
          />
          <circle cx="24" cy="18" r="1.5" fill="#d4a017" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "baseline", fontSize: 72, fontWeight: 700, letterSpacing: -2 }}>
            <span style={{ color: "#2d5a2d" }}>nasza</span>
            <span style={{ color: "#5a9c3e" }}>wies</span>
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
