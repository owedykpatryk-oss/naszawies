/**
 * Import pełnego SIMC/TERC do Supabase przez `supabase db query --linked`.
 * Nie wymaga SUPABASE_SERVICE_ROLE_KEY — używa RPC upsert_villages_simc (service role po stronie DB).
 *
 *   node scripts/import-simc-supabase-cli.mjs
 *   node scripts/import-simc-supabase-cli.mjs --dry-run
 *   node scripts/import-simc-supabase-cli.mjs --batch-size 600
 */
import { readFile, mkdir, writeFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { XMLParser } from "fast-xml-parser";
import slugify from "slugify";
import {
  COMMUNE_TYPES,
  VOIVODESHIPS,
  kodTeryt2,
  kluczGminyTeryt,
  kluczPowiatuTeryt,
} from "./teryt-kody.mjs";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
});

const TERC_PATH = join(process.cwd(), "docs/Pliki/TERC_Urzedowy_2026-04-25.xml");
const SIMC_PATH = join(process.cwd(), "docs/Pliki/SIMC_Urzedowy_2026-04-25.xml");
const TMP_DIR = join(process.cwd(), ".tmp/simc-import");

function rowToObj(row) {
  if (row == null || typeof row !== "object") return {};
  let cols = row.col;
  if (cols != null) {
    if (!Array.isArray(cols)) cols = [cols];
    const acc = {};
    for (const c of cols) {
      const name = c["@_name"];
      if (!name) continue;
      acc[name] = String(c["#text"] ?? "").trim();
    }
    return acc;
  }
  const acc = {};
  for (const k of Object.keys(row)) {
    if (k === "col" || k.startsWith("@_")) continue;
    const v = row[k];
    acc[k] = v == null ? "" : typeof v === "string" ? v.trim() : String(v).trim();
  }
  return acc;
}

function iterRows(parsed) {
  const catalog = parsed?.teryt?.catalog ?? parsed?.SIMC?.catalog ?? parsed?.catalog;
  if (!catalog) return [];
  let rows = catalog.row;
  if (rows == null) return [];
  if (!Array.isArray(rows)) rows = [rows];
  return rows;
}

async function parseTerytXml(path) {
  return parser.parse(await readFile(path, "utf8"));
}

async function buildCommunesMap(tercPath) {
  const data = await parseTerytXml(tercPath);
  const communes = new Map();
  for (const row of iterRows(data)) {
    const r = rowToObj(row);
    if (r.GMI && r.RODZ) {
      const woj = kodTeryt2(r.WOJ);
      const pow = kodTeryt2(r.POW);
      const gmi = kodTeryt2(r.GMI);
      communes.set(kluczGminyTeryt(woj, pow, gmi), {
        name: r.NAZWA,
        type: COMMUNE_TYPES[r.RODZ] || "inna",
        rodz: r.RODZ,
        gminaTerytKod: `${woj}${pow}${gmi}${r.RODZ}`,
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
    if (r.POW && !r.GMI) counties.set(kluczPowiatuTeryt(r.WOJ, r.POW), r.NAZWA);
  }
  return counties;
}

async function zbudujRekordy(tylkoWoj = null) {
  const counties = await buildCountiesMap(TERC_PATH);
  const communes = await buildCommunesMap(TERC_PATH);
  const data = await parseTerytXml(SIMC_PATH);
  const villages = [];
  const filtrWoj = tylkoWoj ? new Set(tylkoWoj.map((w) => kodTeryt2(w))) : null;

  for (const row of iterRows(data)) {
    const r = rowToObj(row);
    if (!r.SYM || !r.NAZWA) continue;
    const woj = kodTeryt2(r.WOJ);
    if (filtrWoj && !filtrWoj.has(woj)) continue;
    const communeKey = kluczGminyTeryt(woj, r.POW, r.GMI);
    const county = counties.get(kluczPowiatuTeryt(woj, r.POW));
    const commune = communes.get(communeKey);
    const voivodeship = VOIVODESHIPS[woj];
    if (!r.GMI || !commune || !county || !voivodeship) continue;

    const baza = slugify(r.NAZWA, { lower: true, strict: true, locale: "pl" });
    const slug = `${baza}-${r.SYM}`;

    villages.push({
      teryt_id: r.SYM,
      gmina_teryt_kod: commune.gminaTerytKod ?? null,
      name: r.NAZWA,
      slug,
      voivodeship,
      county,
      commune: commune.name,
      commune_type: commune.type,
      is_active: false,
    });
  }
  return villages;
}

function wykonajSql(sql) {
  const wynik = spawnSync("npx", ["supabase", "db", "query", "--linked"], {
    cwd: process.cwd(),
    encoding: "utf8",
    input: sql,
    shell: true,
    maxBuffer: 20 * 1024 * 1024,
  });
  if (wynik.status !== 0) {
    throw new Error((wynik.stderr || wynik.stdout || "Błąd supabase db query").slice(0, 2000));
  }
  return (wynik.stdout || "").trim();
}

function policzMiescowosciWBazie() {
  const out = wykonajSql("SELECT count(*)::int AS cnt FROM public.villages WHERE teryt_id IS NOT NULL;");
  const start = out.indexOf("{");
  if (start < 0) return 0;
  const parsed = JSON.parse(out.slice(start));
  const row = parsed.rows?.[0];
  return row?.cnt != null ? Number(row.cnt) : 0;
}

function czekaj(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function wykonajSqlPlik(sciezka, proba = 1) {
  const wynik = spawnSync("npx", ["supabase", "db", "query", "--linked", "-f", sciezka], {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: true,
    maxBuffer: 50 * 1024 * 1024,
  });
  if (wynik.status !== 0) {
    const msg = (wynik.stderr || wynik.stdout || "Błąd supabase db query").slice(0, 2000);
    const retryable = /503|502|429|timeout|reset/i.test(msg);
    if (retryable && proba < 5) {
      const delay = proba * 4000;
      console.warn(`  retry ${proba}/4 za ${delay}ms…`);
      await czekaj(delay);
      return wykonajSqlPlik(sciezka, proba + 1);
    }
    throw new Error(msg);
  }
  return (wynik.stdout || "").trim();
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const resume = process.argv.includes("--resume");
  const batchArg = process.argv.find((a) => a.startsWith("--batch-size="));
  const startBatchArg = process.argv.find((a) => a.startsWith("--start-batch="));
  const tylkoWojArg = process.argv.find((a) => a.startsWith("--tylko-woj="));
  const batchSize = batchArg ? Number.parseInt(batchArg.split("=")[1], 10) : 500;
  const tylkoWoj = tylkoWojArg
    ? tylkoWojArg
        .split("=")[1]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : null;

  console.log("Budowanie rekordów z SIMC/TERC…");
  const villages = await zbudujRekordy(tylkoWoj);
  console.log(`Przygotowano ${villages.length} miejscowości.`);

  if (dryRun) {
    console.log("[dry-run] Pomijam zapis.");
    return;
  }

  let startIndex = 0;
  if (startBatchArg) {
    startIndex = (Number.parseInt(startBatchArg.split("=")[1], 10) - 1) * batchSize;
  } else if (resume) {
    const cnt = policzMiescowosciWBazie();
    startIndex = Math.min(villages.length, Math.floor(cnt / batchSize) * batchSize);
    if (startIndex > 0) {
      console.log(`[resume] W bazie ${cnt} miejscowości — start od rekordu ${startIndex + 1}.`);
    }
  }

  await mkdir(TMP_DIR, { recursive: true });
  let ok = startIndex;
  const total = Math.ceil(villages.length / batchSize);

  for (let i = startIndex; i < villages.length; i += batchSize) {
    const batch = villages.slice(i, i + batchSize);
    const nr = Math.floor(i / batchSize) + 1;
    const plik = join(TMP_DIR, `batch-${String(nr).padStart(4, "0")}.sql`);
    const json = JSON.stringify(batch).replace(/'/g, "''");
    const sql = `SELECT public.upsert_villages_simc('${json}'::jsonb) AS upserted;\n`;
    await writeFile(plik, sql, "utf8");
    try {
      const out = await wykonajSqlPlik(plik);
      ok += batch.length;
      console.log(`[${nr}/${total}] OK ${ok}/${villages.length} — ${out.split("\n").pop() ?? "done"}`);
    } catch (e) {
      console.error(`[${nr}/${total}] BŁĄD:`, e instanceof Error ? e.message : e);
      console.error(`Wznów: node scripts/import-simc-supabase-cli.mjs --resume`);
      process.exitCode = 1;
      break;
    }
  }

  await rm(TMP_DIR, { recursive: true, force: true });
  console.log("Import SIMC zakończony.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
