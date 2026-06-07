import sharp from "sharp";

export type OpcjeOptymalizacji = {
  szerokosc?: number;
  jakosc?: number;
  format?: "webp" | "avif" | "jpeg";
};

/** Kompresja bufora obrazu — WebP domyślnie (Lighthouse). */
export async function optimizeImage(
  wejscie: Buffer,
  opcje: OpcjeOptymalizacji = {},
): Promise<Buffer> {
  const { szerokosc = 1200, jakosc = 82, format = "webp" } = opcje;
  let pipeline = sharp(wejscie).rotate().resize({ width: szerokosc, withoutEnlargement: true });

  switch (format) {
    case "avif":
      pipeline = pipeline.avif({ quality: jakosc });
      break;
    case "jpeg":
      pipeline = pipeline.jpeg({ quality: jakosc, mozjpeg: true });
      break;
    default:
      pipeline = pipeline.webp({ quality: jakosc });
  }

  return pipeline.toBuffer();
}
