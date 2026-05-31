#!/usr/bin/env node
/**
 * Uzupełnia .env.local o brakujące klucze z .env.example (bez nadpisywania istniejących wartości).
 *
 *   npm run env:sync-local
 *   node scripts/uzupelnij-env-local.mjs --force GEOPORTAL_POI_SYNC_ENABLED  # nadpisz jeden klucz z example
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const EXAMPLE = path.join(ROOT, ".env.example");
const LOCAL = path.join(ROOT, ".env.local");

const forceKeys = new Set(
  process.argv.slice(2).filter((a) => a !== "--force").concat(process.argv.includes("--force") ? [] : []),
);
if (process.argv.includes("--force")) {
  const idx = process.argv.indexOf("--force");
  for (let i = idx + 1; i < process.argv.length; i++) {
    if (!process.argv[i].startsWith("-")) forceKeys.add(process.argv[i]);
  }
}

function parsujEnv(plik) {
  const map = new Map();
  if (!fs.existsSync(plik)) return map;
  for (const line of fs.readFileSync(plik, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    map.set(key, val);
  }
  return map;
}

function parsujExampleDefaults(plik) {
  const map = new Map();
  if (!fs.existsSync(plik)) return map;
  for (const line of fs.readFileSync(plik, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (!val) continue;
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    map.set(key, val);
  }
  return map;
}

const local = parsujEnv(LOCAL);
const defaults = parsujExampleDefaults(EXAMPLE);

const dodane = [];
const zaktualizowane = [];

for (const [key, val] of defaults) {
  if (local.has(key) && !forceKeys.has(key)) continue;
  if (local.has(key) && forceKeys.has(key)) {
    zaktualizowane.push(key);
  } else {
    dodane.push(key);
  }
  local.set(key, val);
}

if (dodane.length === 0 && zaktualizowane.length === 0) {
  console.log(".env.local — brak brakujących kluczy z .env.example");
  process.exit(0);
}

const istniejacy = fs.existsSync(LOCAL) ? fs.readFileSync(LOCAL, "utf8") : "";
const istniejaceKlucze = parsujEnv(LOCAL);

const linie = istniejacy.split(/\r?\n/);
const out = [];
const zapisane = new Set();

for (const line of linie) {
  const t = line.trim();
  const m = t.match(/^([A-Za-z_][A-Za-z0-9_]*)=/);
  if (m && (dodane.includes(m[1]) || zaktualizowane.includes(m[1]))) {
    out.push(`${m[1]}=${local.get(m[1])}`);
    zapisane.add(m[1]);
    continue;
  }
  out.push(line);
}

const brakujaceNaKoncu = [...dodane, ...zaktualizowane].filter((k) => !zapisane.has(k));
if (brakujaceNaKoncu.length) {
  out.push("");
  out.push("# --- uzupełnione automatycznie z .env.example ---");
  for (const key of brakujaceNaKoncu) {
    out.push(`${key}=${local.get(key)}`);
  }
}

fs.writeFileSync(LOCAL, out.join("\n").replace(/\n{3,}/g, "\n\n") + "\n", "utf8");

console.log(`Zaktualizowano .env.local:`);
if (dodane.length) console.log(`  + dodano (${dodane.length}): ${dodane.join(", ")}`);
if (zaktualizowane.length) console.log(`  ~ nadpisano (${zaktualizowane.length}): ${zaktualizowane.join(", ")}`);
