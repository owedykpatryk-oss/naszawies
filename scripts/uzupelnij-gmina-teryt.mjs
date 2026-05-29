/**
 * Uzupełnia villages.gmina_teryt_kod z plików TERC+SIMC (bez pełnego reimportu).
 *
 *   node scripts/uzupelnij-gmina-teryt.mjs
 *   node scripts/uzupelnij-gmina-teryt.mjs --dry-run
 */
import { readFile, mkdir, writeFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
});

const TERC_PATH = join(process.cwd(), "docs/Pliki/TERC_Urzedowy_2026-04-25.xml");
const SIMC_PATH = join(process.cwd(), "docs/Pliki/SIMC_Urzedowy_2026-04-25.xml");
const TMP = join(process.cwd(), ".tmp/gmina-teryt");

function pad2(v) {
  return String(v ?? "").trim().padStart(2, "0");
}

function kodGminyTerc(woj, pow, gmi, rodz) {
  return `${pad2(woj)}${pad2(pow)}${pad2(gmi)}${String(rodz ?? "").trim()}`;
}

function normalizujSimc(sym) {
  const t = String(sym ?? "").trim();
  if (!t) return "";
  return t.padStart(7, "0");
}

function kluczeSimcDoBazy(sym) {
  const norm = normalizujSimc(sym);
  const n = Number.parseInt(norm, 10);
  const bezZera = Number.isFinite(n) ? String(n) : norm;
  return [...new Set([norm, bezZera, String(sym ?? "").trim()].filter(Boolean))];
}

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

async function parseXml(path) {
  return parser.parse(await readFile(path, "utf8"));
}

function wykonajSqlPlik(path) {
  const wynik = spawnSync("npx", ["supabase", "db", "query", "--linked", "-f", path], {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: true,
  });
  if (wynik.status !== 0) {
    throw new Error((wynik.stderr || wynik.stdout || "query failed").slice(0, 1500));
  }
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const terc = await parseXml(TERC_PATH);
  const simc = await parseXml(SIMC_PATH);

  const gminaByKey = new Map();
  for (const row of iterRows(terc)) {
    const r = rowToObj(row);
    if (r.GMI && r.RODZ && r.WOJ && r.POW) {
      const key = `${pad2(r.WOJ)}-${pad2(r.POW)}-${pad2(r.GMI)}`;
      gminaByKey.set(key, kodGminyTerc(r.WOJ, r.POW, r.GMI, r.RODZ));
    }
  }

  const mapa = new Map();
  for (const row of iterRows(simc)) {
    const r = rowToObj(row);
    if (!r.SYM || !r.WOJ || !r.POW || !r.GMI) continue;
    const key = `${pad2(r.WOJ)}-${pad2(r.POW)}-${pad2(r.GMI)}`;
    const kod = gminaByKey.get(key);
    if (!kod) continue;
    for (const k of kluczeSimcDoBazy(r.SYM)) {
      mapa.set(k, kod);
    }
  }

  console.log(`Mapowanie SIMC → gmina TERC: ${mapa.size} kluczy (w tym warianty z/bez zer wiodących).`);

  if (dryRun) {
    console.log("Przykład Ameryka 721604:", mapa.get("721604"), mapa.get("0721604"));
    console.log("Dry-run — bez zapisu do bazy.");
    return;
  }

  await mkdir(TMP, { recursive: true });
  const batch = 2000;
  let i = 0;
  let plikIdx = 0;
  let pary = [];

  for (const [simc, kod] of mapa) {
    pary.push([simc, kod]);
    i += 1;
    if (pary.length >= batch) {
      const plik = join(TMP, `batch-${plikIdx++}.sql`);
      const values = pary
        .map(([s, k]) => `('${s.replace(/'/g, "''")}','${k.replace(/'/g, "''")}')`)
        .join(",\n    ");
      await writeFile(
        plik,
        `UPDATE public.villages AS v
SET gmina_teryt_kod = d.kod, updated_at = NOW()
FROM (VALUES
    ${values}
) AS d(teryt_id, kod)
WHERE v.teryt_id = d.teryt_id
  AND v.gmina_teryt_kod IS DISTINCT FROM d.kod;
`,
        "utf8",
      );
      wykonajSqlPlik(plik);
      console.log(`Zapisano batch ${plikIdx} (${i} par SIMC)...`);
      pary = [];
    }
  }
  if (pary.length > 0) {
    const plik = join(TMP, `batch-${plikIdx++}.sql`);
    const values = pary
      .map(([s, k]) => `('${s.replace(/'/g, "''")}','${k.replace(/'/g, "''")}')`)
      .join(",\n    ");
    await writeFile(
      plik,
      `UPDATE public.villages AS v
SET gmina_teryt_kod = d.kod, updated_at = NOW()
FROM (VALUES
    ${values}
) AS d(teryt_id, kod)
WHERE v.teryt_id = d.teryt_id
  AND v.gmina_teryt_kod IS DISTINCT FROM d.kod;
`,
      "utf8",
    );
    wykonajSqlPlik(plik);
  }

  await rm(TMP, { recursive: true, force: true });
  console.log(`Gotowe. Wykonano ${i} aktualizacji (klucze SIMC).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
