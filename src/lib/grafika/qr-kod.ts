/** Generuje data URL kodu QR (tylko w przeglądarce). */
export async function generujQrDataUrl(tekst: string, rozmiar = 160): Promise<string | null> {
  if (typeof window === "undefined" || !tekst.trim()) return null;
  try {
    const QRCode = (await import("qrcode")).default;
    return await QRCode.toDataURL(tekst, {
      width: rozmiar,
      margin: 1,
      color: { dark: "#14532d", light: "#ffffff" },
    });
  } catch {
    return null;
  }
}

export function domyslnyUrlQrWies(sciezkaWsi: string): string {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://naszawies.pl";
  return `${origin}${sciezkaWsi.startsWith("/") ? sciezkaWsi : `/${sciezkaWsi}`}`;
}
