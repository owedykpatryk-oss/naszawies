#!/usr/bin/env node
/**
 * Generuje okładki WebP dla artykułów z content/blog/articles/*.json
 *   node scripts/generuj-okladki-bloga.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const ARTICLES = path.join(ROOT, "content", "blog", "articles");
const PUBLIC_BLOG = path.join(ROOT, "public", "blog");

const KOLORY_KATEGORII = {
  poradniki: ["#1a4d1a", "#3d7a3d"],
  soltys: ["#1e3a5f", "#2d5a8a"],
  spolecznosc: ["#5c3d1e", "#8b5a2b"],
  rynek: ["#4a3728", "#6b5344"],
};

function kolorDlaKategorii(slug) {
  return KOLORY_KATEGORII[slug] ?? ["#1a4d1a", "#2d5a2d"];
}

function ucieczkaXml(t) {
  return String(t)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .slice(0, 90);
}

async function okladkaBuffer(tytul, categorySlug) {
  const [c1, c2] = kolorDlaKategorii(categorySlug);
  const linie = ucieczkaXml(tytul).match(/.{1,42}(\s|$)/g) ?? [ucieczkaXml(tytul)];
  const tspan = linie
    .map((l, i) => `<tspan x="72" dy="${i === 0 ? 0 : 58}">${l.trim()}</tspan>`)
    .join("");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <circle cx="1020" cy="110" r="200" fill="#ffffff" opacity="0.06"/>
  <circle cx="140" cy="520" r="260" fill="#ffffff" opacity="0.04"/>
  <text y="260" font-family="Georgia, 'Times New Roman', serif" font-size="46" fill="#f5f1e8" font-weight="400">${tspan}</text>
  <text x="72" y="420" font-family="Arial, sans-serif" font-size="26" fill="#c8e6c8" opacity="0.9">naszawies.pl — blog</text>
</svg>`;

  return sharp(Buffer.from(svg)).webp({ quality: 86 }).toBuffer();
}

async function main() {
  const pliki = fs.readdirSync(ARTICLES).filter((f) => f.endsWith(".json"));
  let n = 0;
  for (const plik of pliki) {
    const artykul = JSON.parse(fs.readFileSync(path.join(ARTICLES, plik), "utf8"));
    if (!artykul.slug || !artykul.title) continue;
    const outDir = path.join(PUBLIC_BLOG, artykul.slug);
    fs.mkdirSync(outDir, { recursive: true });
    const out = path.join(outDir, "cover.webp");
    const buf = await okladkaBuffer(artykul.title, artykul.categorySlug ?? "poradniki");
    await fs.promises.writeFile(out, buf);
    console.log("✓", artykul.slug);
    n++;
  }
  console.log(`\nGotowe: ${n} okładek w public/blog/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
