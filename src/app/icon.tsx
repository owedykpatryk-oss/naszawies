import { ImageResponse } from "next/og";
import { PwaIkonaOgGrafika } from "@/lib/pwa/pwa-ikona-og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Ikona karty przeglądarki — znak jak w logo (dach + ściany). */
export default function Icon() {
  return new ImageResponse(<PwaIkonaOgGrafika rozmiar={32} />, { ...size });
}
