import { czyUrlToObiektR2, pobierzZnaneBazyPubliczneR2 } from "@/lib/cloudflare/r2-url-pomoc";

/** Presety miniaturek — Cloudflare Image Resizing (`/cdn-cgi/image/…`) na domenie CDN. */
export type PresetObrazuR2 = "miniatura" | "karta" | "pelny" | "avatar";

const PRESETY: Record<PresetObrazuR2, { width?: number; height?: number; quality: number; fit?: string }> = {
  miniatura: { width: 160, height: 160, quality: 82, fit: "cover" },
  karta: { width: 640, quality: 85 },
  pelny: { width: 1280, quality: 88 },
  avatar: { width: 256, height: 256, quality: 85, fit: "cover" },
};

/** Czy włączyć transformacje obrazów przez CDN Cloudflare (wymaga Image Resizing na strefie). */
export function czyWlaczoneCdnObrazowR2(): boolean {
  const v = process.env.NEXT_PUBLIC_R2_CDN_IMAGES?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

function opcjePresetu(preset: PresetObrazuR2): string {
  const p = PRESETY[preset];
  const czesci = [`quality=${p.quality}`, "format=auto"];
  if (p.width) czesci.push(`width=${p.width}`);
  if (p.height) czesci.push(`height=${p.height}`);
  if (p.fit) czesci.push(`fit=${p.fit}`);
  return czesci.join(",");
}

/**
 * Zwraca URL zoptymalizowany przez Cloudflare CDN (mniejszy transfer, WebP/AVIF).
 * Gdy CDN wyłączony lub URL spoza R2 — zwraca oryginał.
 */
export function zbudujUrlObrazuR2(
  url: string | null | undefined,
  preset: PresetObrazuR2 = "karta",
): string | null {
  if (!url?.trim()) return null;
  const oryginal = url.trim();
  if (!czyWlaczoneCdnObrazowR2() || !czyUrlToObiektR2(oryginal)) {
    return oryginal;
  }
  const baza = pobierzZnaneBazyPubliczneR2().find((b) => oryginal.startsWith(`${b}/`));
  if (!baza) return oryginal;
  const sciezka = oryginal.slice(baza.length);
  if (!sciezka.startsWith("/")) return oryginal;
  return `${baza}/cdn-cgi/image/${opcjePresetu(preset)}${sciezka}`;
}

/** srcSet dla kart siatki (1x + 2x retina). */
export function zbudujSrcSetObrazuR2(url: string | null | undefined, preset: PresetObrazuR2 = "karta"): string | undefined {
  const glowny = zbudujUrlObrazuR2(url, preset);
  if (!glowny || glowny === url?.trim()) return undefined;
  const retina = zbudujUrlObrazuR2(url, preset === "miniatura" ? "karta" : "pelny");
  if (!retina || retina === glowny) return `${glowny} 1x`;
  return `${glowny} 1x, ${retina} 2x`;
}
