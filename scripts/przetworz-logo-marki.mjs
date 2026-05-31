/**
 * Generuje wersje logo z przezroczystym tłem (emblem + pełne logo + rozmiary PWA).
 * Uruchom: npm run generuj:marka
 */
import sharp from "sharp";
import { readFileSync, copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MARKA = path.join(__dirname, "..", "public", "marka");
const ZRODLO_EMBLEM = path.join(MARKA, "znak-okrag.png");
const ZRODLO_SVG = path.join(MARKA, "znak-okrag.svg");
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
  await sharp(wyjscie)
    .resize(px, px, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(docelowy);
  console.log("✓", path.basename(docelowy));
}

async function zapiszLogoApp(emblem512) {
  const appOut = path.join(MARKA, "logo-app.png");
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 45, g: 90, b: 45, alpha: 255 },
    },
  })
    .composite([
      {
        input: await sharp(emblem512).resize(400, 400, { fit: "contain" }).png().toBuffer(),
        gravity: "centre",
      },
    ])
    .png()
    .toFile(appOut);
  console.log("✓ logo-app.png");
}

let zrodloEmblem = ZRODLO_EMBLEM;
if (!existsSync(zrodloEmblem) && existsSync(ZRODLO_SVG)) {
  zrodloEmblem = path.join(MARKA, ".znak-okrag-raster.png");
  await sharp(ZRODLO_SVG).resize(512, 512).png().toFile(zrodloEmblem);
  console.log("✓ znak-okrag.svg → raster 512px");
}

if (!existsSync(zrodloEmblem)) {
  console.error("Brak źródła emblem (znak-okrag.png lub znak-okrag.svg)");
  process.exit(1);
}

const emblemOut = path.join(MARKA, "emblem-naszawies.png");
await zapiszZPrzezroczystymTlem(zrodloEmblem, emblemOut, "bialy", 24);
for (const px of [32, 64, 192, 512]) await rozmiar(emblemOut, px);

if (existsSync(ZRODLO_PELNE)) {
  const pelneOut = path.join(MARKA, "logo-pelne.png");
  await zapiszZPrzezroczystymTlem(ZRODLO_PELNE, pelneOut, "czarny", 22);
} else {
  const pelneOut = path.join(MARKA, "logo-pelne.png");
  copyFileSync(path.join(MARKA, "emblem-naszawies-192.png"), pelneOut);
  console.warn("Brak zrodlo-logo-pelne.png — logo-pelne.png = emblem 192px");
}

await zapiszLogoApp(path.join(MARKA, "emblem-naszawies-512.png"));

const emailSvg = path.join(__dirname, "..", "public", "email", "znak-naszawies.svg");
const emailPng = path.join(__dirname, "..", "public", "email", "znak-naszawies.png");
if (existsSync(emailSvg)) {
  await sharp(emailSvg).resize(96, 96).png().toFile(emailPng);
  console.log("✓ email/znak-naszawies.png");
}

console.log("Gotowe.");
