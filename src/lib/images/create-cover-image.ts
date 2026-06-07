import { optimizeImage } from "@/lib/images/optimize-image";

/** Gradientowa okładka SVG → WebP (bez zewnętrznego API). */
export async function createCoverImageBuffer(tytul: string): Promise<Buffer> {
  const skrot = tytul.slice(0, 80).replace(/[<>&"]/g, "");
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a4d1a"/>
      <stop offset="50%" style="stop-color:#2d5a2d"/>
      <stop offset="100%" style="stop-color:#3d7a3d"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <circle cx="980" cy="120" r="180" fill="#ffffff08"/>
  <circle cx="200" cy="520" r="240" fill="#ffffff06"/>
  <text x="80" y="280" font-family="Georgia, serif" font-size="52" fill="#f5f1e8" font-weight="300">${skrot}</text>
  <text x="80" y="340" font-family="Arial, sans-serif" font-size="28" fill="#c8e6c8">naszawies.pl — blog</text>
</svg>`;

  return optimizeImage(Buffer.from(svg), { szerokosc: 1200, format: "webp" });
}
