/**
 * Import miejscowości z plików GUS TERYT (SIMC.xml + TERC.xml) do tabeli `villages`.
 * Wymaga: npm i @supabase/supabase-js (już w projekcie), fast-xml-parser, slugify.
 *
 * Użycie:
 *   node scripts/import-teryt.mjs ścieżka/TERC.xml ścieżka/SIMC.xml
 *   node scripts/import-teryt.mjs --dry-run ścieżka/TERC.xml ścieżka/SIMC.xml
 *
 * Zmienne środowiskowe (np. .env.local — wczytaj ręcznie lub `set` w PowerShell):
 *   SUPABASE_URL lub NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (wymagane poza --dry-run)
 *
 * Dokumentacja: Cloude Docs/naszawies-package/scripts/teryt-import.md
 */

import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { XMLParser } from "fast-xml-parser";
import slugify from "slugify";

const VOIVODESHIPS = {
  "02": "dolnośląskie",
  "04": "kujawsko-pomorskie",
  "06": "lubelskie",
  "08": "lubuskie",
  "10": "łódzkie",
  "12": "małopolskie",
  "14": "mazowieckie",
  "16": "opolskie",
  "18": "podkarpackie",
  "20": "podlaskie",
  "22": "pomorskie",
  "24": "śląskie",
  "26": "świętokrzyskie",
  "28": "warmińsko-mazurskie",
  "30": "wielkopolskie",
  "32": "zachodniopomorskie",
};

const COMMUNE_TYPES = {
  "1": "gmina_miejska",
  "2": "gmina_wiejska",
  "3": "gmina_miejsko_wiejska",
  "4": "miasto_w_gminie_miejsko_wiejskiej",
  "5": "obszar_wiejski_w_gminie_miejsko_wiejskiej",
  "8": "dzielnica_m_st_warszawy",
  "9": "delegatura_w_miastach",
};

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
      const key = `${r.WOJ}-${r.POW}-${r.GMI}`;
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
      const key = `${r.WOJ}-${r.POW}`;
      counties.set(key, r.NAZWA);
    }
  }
  return counties;
}

async function importSIMC(simcPath, communes, counties, supabase, dryRun) {
  const data = await parseTerytXml(simcPath);
  const villages = [];

  for (const row of iterRows(data)) {
    const r = rowToObj(row);
    if (!RURAL_PLACE_TYPES.has(r.RM)) continue;

    const communeKey = `${r.WOJ}-${r.POW}-${r.GMI}`;
    const countyKey = `${r.WOJ}-${r.POW}`;
    const commune = communes.get(communeKey);
    const county = counties.get(countyKey);
    const voivodeship = VOIVODESHIPS[r.WOJ];

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

  console.log(`Przygotowano ${villages.length} rekordów (wsie/osady wg SIMC).`);

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
  node scripts/import-teryt.mjs [--dry-run] <TERC.xml> <SIMC.xml>`);
}

async function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const paths = argv.filter((a) => a !== "--dry-run");
  if (paths.length !== 2) {
    usage();
    process.exit(1);
  }
  const [tercPath, simcPath] = paths;

  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!dryRun && (!supabaseUrl || !serviceKey)) {
    console.error(
      "Brak SUPABASE_URL (lub NEXT_PUBLIC_SUPABASE_URL) albo SUPABASE_SERVICE_ROLE_KEY."
    );
    process.exit(1);
  }

  console.log("Ładowanie TERC (gminy, powiaty)…");
  const counties = await buildCountiesMap(tercPath);
  const communes = await buildCommunesMap(tercPath);
  console.log(`Powiaty: ${counties.size}, gminy: ${communes.size}`);

  const supabase =
    !dryRun && supabaseUrl && serviceKey
      ? createClient(supabaseUrl, serviceKey)
      : null;

  console.log("Parsowanie SIMC…");
  await importSIMC(simcPath, communes, counties, supabase, dryRun);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
