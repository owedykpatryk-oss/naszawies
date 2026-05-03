/**
 * Grafika ikony PWA / favicon dla {@link ImageResponse} (next/og).
 * Skalowana proporcjonalnie do kwadratu `rozmiar` px.
 */
export function PwaIkonaOgGrafika({ rozmiar }: { rozmiar: number }) {
  const k = rozmiar / 32;
  return (
    <div
      style={{
        width: rozmiar,
        height: rozmiar,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #5a9c3e 0%, #2d5a2d 100%)",
        borderRadius: rozmiar / 2,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          marginTop: k,
        }}
      >
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: `${7 * k}px solid transparent`,
            borderRight: `${7 * k}px solid transparent`,
            borderBottom: `${9 * k}px solid #f5f1e8`,
          }}
        />
        <div
          style={{
            width: 14 * k,
            height: 9 * k,
            marginTop: -k,
            backgroundColor: "#f5f1e8",
            border: `${1.5 * k}px solid #d4a017`,
            borderTop: "none",
            boxSizing: "border-box",
          }}
        />
      </div>
    </div>
  );
}
