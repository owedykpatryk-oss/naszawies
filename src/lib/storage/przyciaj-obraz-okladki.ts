import sharp from "sharp";

const SZEROKOSC_OKLADKI = 1280;
const WYSOKOSC_OKLADKI = 720;

/** Przycina i skaluje obraz do 16:9 (cover, środek) — okładki mini-stron organizacji. */
export async function przyciajObrazDoOkladki16x9(
  buf: Buffer,
  mime: string,
): Promise<{ buf: Buffer; mime: string; rozszerzenie: string }> {
  const obraz = sharp(buf, { failOn: "none" }).rotate();
  const meta = await obraz.metadata();
  if (!meta.width || !meta.height) {
    return {
      buf,
      mime,
      rozszerzenie: mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg",
    };
  }

  const pipeline = obraz.resize(SZEROKOSC_OKLADKI, WYSOKOSC_OKLADKI, {
    fit: "cover",
    position: "centre",
  });

  if (mime === "image/png") {
    const out = await pipeline.png({ compressionLevel: 8 }).toBuffer();
    return { buf: out, mime: "image/png", rozszerzenie: "png" };
  }

  const out = await pipeline.webp({ quality: 82 }).toBuffer();
  return { buf: out, mime: "image/webp", rozszerzenie: "webp" };
}
