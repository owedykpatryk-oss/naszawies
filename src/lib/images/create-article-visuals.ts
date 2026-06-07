import { createCoverImageBuffer } from "@/lib/images/create-cover-image";
import { optimizeImage } from "@/lib/images/optimize-image";

/** Generuje bufor okładki + opcjonalne wizualizacje sekcji (bez zapisu — użyj w skrypcie deploy). */
export async function createArticleVisuals(tytul: string, liczbaWizualizacji = 0) {
  const cover = await createCoverImageBuffer(tytul);
  const wizualizacje: Buffer[] = [];

  for (let i = 0; i < liczbaWizualizacji; i++) {
    const svg = `<svg width="800" height="500" xmlns="http://www.w3.org/2000/svg">
      <rect width="800" height="500" fill="#2d5a2d"/>
      <circle cx="400" cy="250" r="120" fill="#ffffff10"/>
    </svg>`;
    wizualizacje.push(await optimizeImage(Buffer.from(svg), { szerokosc: 800 }));
  }

  return { cover, wizualizacje };
}

export { createCoverImageBuffer as createCoverImage };
