import { ImageResponse } from "next/og";
import { PwaIkonaOgGrafika } from "@/lib/pwa/pwa-ikona-og";

export const runtime = "edge";

const rozmiar = 180;

/** Ikona „Dodaj do ekranu początkowego” (iOS / Safari). */
export default function AppleIcon() {
  return new ImageResponse(<PwaIkonaOgGrafika rozmiar={rozmiar} />, {
    width: rozmiar,
    height: rozmiar,
  });
}
