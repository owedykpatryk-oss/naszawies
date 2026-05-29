/**
 * Import miejscowości z SIMC/TERC ograniczony do jednego powiatu (WOJ + POW, np. 04 + 10 = powiat nakielski).
 *
 * Pobierz pliki z GUS eTeryt (TERC.xml, SIMC.xml), potem:
 *   node scripts/import-teryt-powiat.mjs --dry-run 04 10 ścieżka/TERC.xml ścieżka/SIMC.xml
 *   node scripts/import-teryt-powiat.mjs 04 10 ścieżka/TERC.xml ścieżka/SIMC.xml
 *
 * Wymaga (poza --dry-run): NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * (np. w .env.local — wczytaj ręcznie w PowerShell lub użyj dotenv jeśli dodasz).
 */

import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { XMLParser } from "fast-xml-parser";
import slugify from "slugify";
import {
  COMMUNE_TYPES,
  VOIVODESHIPS,
  kodTeryt2,
  kluczGminyTeryt,
  kluczPowiatuTeryt,
} from "./teryt-kody.mjs";

const RURAL_PLACE_TYPES = new Set(["01", "02", "03", "04", "07", "99"]);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
});

function rowToObj(row) {
  let cols = row?.col;
  if (cols == null) return {};
  if (!Array.isArray(cols)) cols = [cols];
  const acc = {};
  for (const c of cols) {
    const name = c["@_name"];
    if (!name) continue;
    let val = c["#text"];
    if (val == null) val = "";
    acc[name] = String(val).trim();
  }
  return acc;
}

function iterRows(parsed) {
  const catalog = parsed?.teryt?.catalog ?? parsed?.catalog;
  if (!catalog) return [];
  let rows = catalog.row;
  if (rows == null) return [];
  if (!Array.isArray(rows)) rows = [rows];
  return rows;
}

async function parseTerytXml(path) {
  const content = await readFile(path, "utf8");
  return parser.parse(content);
}

async function buildCommunesMap(tercPath) {
  const data = await parseTerytXml(tercPath);
  const communes = new Map();
  for (const row of iterRows(data)) {
    const r = rowToObj(row);
    if (r.GMI && r.RODZ) {
      const key = kluczGminyTeryt(r.WOJ, r.POW, r.GMI);
      communes.set(key, {
        name: r.NAZWA,
        type: COMMUNE_TYPES[r.RODZ] || "inna",
      });
    }
  }
  return communes;
}

async function buildCountiesMap(tercPath) {
  const data = await parseTerytXml(tercPath);
  const counties = new Map();
  for (const row of iterRows(data)) {
    const r = rowToObj(row);
    if (r.POW && !r.GMI) {
      counties.set(kluczPowiatuTeryt(r.WOJ, r.POW), r.NAZWA);
    }
  }
  return counties;
}

async function importPowiat(simcPath, communes, counties, supabase, dryRun, woj, pow) {
  const data = await parseTerytXml(simcPath);
  const villages = [];

  for (const row of iterRows(data)) {
    const r = rowToObj(row);
    if (!RURAL_PLACE_TYPES.has(r.RM)) continue;
    if (kodTeryt2(r.WOJ) !== kodTeryt2(woj) || kodTeryt2(r.POW) !== kodTeryt2(pow)) continue;

    const communeKey = kluczGminyTeryt(r.WOJ, r.POW, r.GMI);
    const countyKey = kluczPowiatuTeryt(r.WOJ, r.POW);
    const commune = communes.get(communeKey);
    const county = counties.get(countyKey);
    const voivodeship = VOIVODESHIPS[kodTeryt2(r.WOJ)];

    if (!commune || !county || !voivodeship) continue;

    villages.push({
      teryt_id: r.SYM,
      name: r.NAZWA,
      slug: slugify(r.NAZWA, { lower: true, strict: true, locale: "pl" }),
      voivodeship,
      county,
      commune: commune.name,
      commune_type: commune.type,
      is_active: false,
    });
  }

  console.log(`Powiat ${woj}-${pow}: przygotowano ${villages.length} miejscowości (SIMC).`);

  if (dryRun) {
    console.log("[dry-run] Pomijam zapis do Supabase.");
    return;
  }

  const BATCH = 800;
  for (let i = 0; i < villages.length; i += BATCH) {
    const batch = villages.slice(i, i + BATCH);
    const { error } = await supabase.from("villages").upsert(batch, {
      onConflict: "teryt_id",
      ignoreDuplicates: false,
    });
    if (error) {
      console.error(`Błąd batch ${i / BATCH}:`, error.message);
      process.exitCode = 1;
    } else {
      console.log(`OK ${Math.min(i + BATCH, villages.length)} / ${villages.length}`);
    }
    await new Promise((r) => setTimeout(r, 80));
  }
  console.log("Import zakończony.");
}

function usage() {
  console.log(`Użycie:
  node scripts/import-teryt-powiat.mjs [--dry-run] <WOJ> <POW> <TERC.xml> <SIMC.xml>

Przykład powiat nakielski (woj. kujawsko-pomorskie, TERC powiatu 0410 → WOJ=04 POW=10):
  node scripts/import-teryt-powiat.mjs 04 10 ./TERC.xml ./SIMC.xml`);
}

async function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const rest = argv.filter((a) => a !== "--dry-run");
  if (rest.length !== 4) {
    usage();
    process.exit(1);
  }
  const [woj, pow, tercPath, simcPath] = rest;
  if (!/^\d{2}$/.test(woj) || !/^\d{2}$/.test(pow)) {
    console.error("WOJ i POW muszą być dwucyfrowe (np. 04 i 10).");
    process.exit(1);
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!dryRun && (!supabaseUrl || !serviceKey)) {
    console.error(
      "Brak SUPABASE_URL (lub NEXT_PUBLIC_SUPABASE_URL) albo SUPABASE_SERVICE_ROLE_KEY."
    );
    process.exit(1);
  }

  console.log("Ładowanie TERC…");
  const counties = await buildCountiesMap(tercPath);
  const communes = await buildCommunesMap(tercPath);
  const countyKey = kluczPowiatuTeryt(woj, pow);
  const nazwaPowiatu = counties.get(countyKey);
  console.log(`Filtr: ${countyKey} → ${nazwaPowiatu ?? "(nie znaleziono w TERC — sprawdź kody)"}`);

  const supabase =
    !dryRun && supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null;

  console.log("Parsowanie SIMC (tylko wybrany powiat)…");
  await importPowiat(simcPath, communes, counties, supabase, dryRun, woj, pow);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
