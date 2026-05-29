import { ImageResponse } from "next/og";
import { MarkaOgGrafika } from "@/lib/pwa/pwa-ikona-og";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const alt = "naszawies.pl — cyfrowy dom polskiej wsi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(<MarkaOgGrafika />, { ...size });
}
