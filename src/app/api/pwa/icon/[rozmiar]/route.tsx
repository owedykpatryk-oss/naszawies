import { ImageResponse } from "next/og";
import { PwaIkonaOgGrafika } from "@/lib/pwa/pwa-ikona-og";

export const runtime = "edge";

/** Ikony PNG dla manifestu PWA (192 / 512 itd.). */
export async function GET(
  _request: Request,
  { params }: { params: { rozmiar: string } },
) {
  const n = Number.parseInt(params.rozmiar, 10);
  const rozmiar = Number.isFinite(n) ? Math.min(512, Math.max(64, n)) : 192;

  return new ImageResponse(<PwaIkonaOgGrafika rozmiar={rozmiar} />, {
    width: rozmiar,
    height: rozmiar,
  });
}
