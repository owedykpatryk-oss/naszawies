/**
 * Generuje wersje logo z przezroczystym tłem (emblem + pełne logo + rozmiary PWA).
 * Uruchom: node scripts/przetworz-logo-marki.mjs
 */
import sharp from "sharp";
import { readFileSync, copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MARKA = path.join(__dirname, "..", "public", "marka");
const ZRODLO_EMBLEM = path.join(MARKA, "znak-okrag.png");
const ZRODLO_PELNE = path.join(MARKA, "zrodlo-logo-pelne.png");

function usunKolorTla(data, info, { cel, prog = 28 }) {
  const { width, height, channels } = info;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      let usun = false;
      if (cel === "bialy") {
        usun = r > 255 - prog && g > 255 - prog && b > 255 - prog;
      } else if (cel === "czarny") {
        usun = r < prog && g < prog && b < prog;
      }
      if (usun) data[i + 3] = 0;
    }
  }
}

async function zapiszZPrzezroczystymTlem(wejscie, wyjscie, cel, prog) {
  const { data, info } = await sharp(wejscie).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  usunKolorTla(data, info, { cel, prog });
  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toFile(wyjscie);
  console.log("✓", path.basename(wyjscie));
}

async function rozmiar(wyjscie, px) {
  const docelowy = wyjscie.replace(".png", `-${px}.png`);
  await sharp(wyjscie).resize(px, px, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(docelowy);
  console.log("✓", path.basename(docelowy));
}

if (!existsSync(ZRODLO_EMBLEM)) {
  console.error("Brak", ZRODLO_EMBLEM);
  process.exit(1);
}

const emblemOut = path.join(MARKA, "emblem-naszawies.png");
await zapiszZPrzezroczystymTlem(ZRODLO_EMBLEM, emblemOut, "bialy", 24);
for (const px of [32, 64, 192, 512]) await rozmiar(emblemOut, px);

if (existsSync(ZRODLO_PELNE)) {
  const pelneOut = path.join(MARKA, "logo-pelne.png");
  await zapiszZPrzezroczystymTlem(ZRODLO_PELNE, pelneOut, "czarny", 22);
} else {
  console.warn("Brak źródła pełnego logo — pomijam logo-pelne.png");
}

const appIcon = path.join(MARKA, "logo-naszawies.png");
if (existsSync(appIcon)) {
  const appOut = path.join(MARKA, "logo-app.png");
  copyFileSync(appIcon, appOut);
  console.log("✓ logo-app.png (kopia ikony aplikacji)");
}

console.log("Gotowe.");
