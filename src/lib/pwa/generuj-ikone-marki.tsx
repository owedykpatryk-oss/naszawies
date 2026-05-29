import { ImageResponse } from "next/og";
import { PwaIkonaOgGrafika } from "@/lib/pwa/pwa-ikona-og";

export function generujIkoneMarki(rozmiar: number) {
  return new ImageResponse(<PwaIkonaOgGrafika rozmiar={rozmiar} />, {
    width: rozmiar,
    height: rozmiar,
  });
}
