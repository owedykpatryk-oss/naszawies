/**
 * Masowy sync granic PRG (A05 → A06) + zapis przez RPC lub supabase db query --linked.
 *
 *   node --env-file=.env.local scripts/synchronizuj-granice-wsi-cli.mjs
 *   node --env-file=.env.local scripts/synchronizuj-granice-wsi-cli.mjs --limit=50
 *   node --env-file=.env.local scripts/synchronizuj-granice-wsi-cli.mjs --tylko-bez-granicy
 */
import { spawnSync } from "node:child_process";
import { writeFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  pobierzGraniceWsiZPrgWfs,
  czyPunktWGranicyGeojson,
  zrodloZWarstwyPrg,
  centroidZGeojson,
} from "../src/lib/geoportal/prg-wfs-client.ts";

const TMP = join(process.cwd(), ".tmp/granice-sync");
const MAX_SQL_BYTES = 450_000;

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key);
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
    throw new Error((wynik.stderr || wynik.stdout || "query failed").slice(0, 1500));
  }
  return wynik.stdout || "";
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

function parseJsonTable(out) {
  try {
    const start = out.indexOf("{");
    if (start < 0) return [];
    const parsed = JSON.parse(out.slice(start));
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.rows)) return parsed.rows;
    return [];
  } catch {
    return [];
  }
}

/** Zaokrągla współrzędne — mniejszy JSON przy masowym zapisie obrysów gmin. */
function zaokraglijGranice(geo, miejsca = 5) {
  const walk = (node) => {
    if (!Array.isArray(node)) return node;
    if (
      node.length >= 2 &&
      typeof node[0] === "number" &&
      typeof node[1] === "number" &&
      !Array.isArray(node[0])
    ) {
      return [
        Math.round(node[0] * 10 ** miejsca) / 10 ** miejsca,
        Math.round(node[1] * 10 ** miejsca) / 10 ** miejsca,
      ];
    }
    return node.map(walk);
  };
  return walk(geo);
}

async function pobierzWsie(opts) {
  const limit = opts.limit;
  const where = opts.force
    ? "teryt_id IS NOT NULL AND btrim(teryt_id) <> ''"
    : opts.tylkoBezGranicy
      ? "boundary_geojson IS NULL AND teryt_id IS NOT NULL AND btrim(teryt_id) <> ''"
      : `(boundary_geojson IS NULL OR boundary_source IS NULL OR boundary_source = 'demo')
         AND teryt_id IS NOT NULL AND btrim(teryt_id) <> ''`;

  const sql = `
    SELECT id, name, teryt_id, gmina_teryt_kod, latitude, longitude, boundary_source
    FROM public.villages
    WHERE ${where}
    ORDER BY
      is_active DESC,
      soltys_user_id IS NOT NULL DESC,
      updated_at ASC
    LIMIT ${limit};
  `;
  const out = wykonajSql(sql);
  return parseJsonTable(out);
}

async function zapiszGraniceSql(terytId, boundary, source, lat, lon) {
  await mkdir(TMP, { recursive: true });
  const plik = join(TMP, `granica-${terytId}.sql`);
  const geoJson = JSON.stringify(boundary).replace(/'/g, "''");
  const latSql = lat != null ? String(lat) : "NULL";
  const lonSql = lon != null ? String(lon) : "NULL";
  const sql = `SELECT public.ustaw_granice_wsi('${terytId}', '${geoJson}'::jsonb, '${source}', ${latSql}, ${lonSql});\n`;
  if (Buffer.byteLength(sql, "utf8") > MAX_SQL_BYTES) {
    throw new Error(`Obrys zbyt duży do zapisu SQL (${Buffer.byteLength(sql, "utf8")} B)`);
  }
  await writeFile(plik, sql, "utf8");
  wykonajSqlPlik(plik);
}

async function zapiszGranice(terytId, boundary, source, lat, lon) {
  const zaokraglona = zaokraglijGranice(boundary);
  const admin = supabaseAdmin();
  if (admin) {
    const { data, error } = await admin.rpc("ustaw_granice_wsi", {
      p_teryt_id: String(terytId),
      p_boundary: zaokraglona,
      p_source: source,
      p_lat: lat,
      p_lon: lon,
    });
    if (error) throw new Error(`ustaw_granice_wsi: ${error.message}`);
    if (data !== true) throw new Error("Nie znaleziono wsi o podanym TERYT w bazie.");
    return;
  }
  await zapiszGraniceSql(String(terytId), zaokraglona, source, lat, lon);
}

async function main() {
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? Number.parseInt(limitArg.split("=")[1], 10) : 30;
  const delayArg = process.argv.find((a) => a.startsWith("--delay="));
  const delayMs = delayArg ? Number.parseInt(delayArg.split("=")[1], 10) : 250;
  const force = process.argv.includes("--force");
  const tylkoBezGranicy = process.argv.includes("--tylko-bez-granicy");

  const wsie = await pobierzWsie({ limit, force, tylkoBezGranicy });
  console.log(`Do sync: ${wsie.length} wsi (limit ${limit}).`);

  let updated = 0;
  const errors = [];

  for (const w of wsie) {
    const lat = w.latitude != null ? Number(w.latitude) : null;
    const lon = w.longitude != null ? Number(w.longitude) : null;
    try {
      const wynik = await pobierzGraniceWsiZPrgWfs(String(w.teryt_id), {
        lat,
        lon,
        gminaTerytKod: w.gmina_teryt_kod ?? null,
      });
      if (!wynik.ok) {
        errors.push(`${w.name}: ${wynik.reason}`);
        console.log(`✗ ${w.name}: ${wynik.reason}`);
        continue;
      }
      if (lat != null && lon != null && !czyPunktWGranicyGeojson(wynik.boundaryGeojson, lon, lat)) {
        errors.push(`${w.name}: punkt GPS poza obrysem`);
        console.log(`✗ ${w.name}: punkt GPS poza obrysem`);
        continue;
      }
      const source = zrodloZWarstwyPrg(wynik.sourceTypeName);
      const c = centroidZGeojson(wynik.boundaryGeojson);
      const zapisLat = lat ?? c?.lat ?? null;
      const zapisLon = lon ?? c?.lon ?? null;
      await zapiszGranice(String(w.teryt_id), wynik.boundaryGeojson, source, zapisLat, zapisLon);
      updated += 1;
      console.log(`✓ ${w.name} (${source})`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${w.name}: ${msg}`);
      console.log(`✗ ${w.name}: ${msg}`);
    }
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
  }

  await rm(TMP, { recursive: true, force: true });
  console.log(`\nZaktualizowano granice: ${updated}. Błędy: ${errors.length}.`);
  if (errors.length) {
    console.log(errors.slice(0, 10).join("\n"));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
