#!/usr/bin/env node
/**
 * Aktualizuje treści artykułów bloga z scripts/dane-tresci-bloga.mjs
 *   node scripts/aktualizuj-tresci-bloga.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { aktualizacje, noweArtykuly } from "./dane-tresci-bloga.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KATALOG = path.join(__dirname, "..", "content", "blog", "articles");

function zapiszArtykul(artykul) {
  const plik = path.join(KATALOG, `${artykul.slug}.json`);
  fs.writeFileSync(plik, `${JSON.stringify(artykul, null, 2)}\n`, "utf8");
  console.log("✓", artykul.slug);
}

let n = 0;

for (const [slug, patch] of Object.entries(aktualizacje)) {
  const plik = path.join(KATALOG, `${slug}.json`);
  if (!fs.existsSync(plik)) {
    console.warn("⚠ brak pliku:", slug);
    continue;
  }
  const artykul = JSON.parse(fs.readFileSync(plik, "utf8"));
  Object.assign(artykul, patch);
  zapiszArtykul(artykul);
  n++;
}

for (const artykul of noweArtykuly) {
  zapiszArtykul(artykul);
  n++;
}

console.log(`\nZaktualizowano / utworzono: ${n} artykułów.`);
