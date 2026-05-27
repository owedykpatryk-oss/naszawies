/**
 * Raport pokrycia granic PRG w katalogu wsi.
 *
 *   node scripts/raport-stan-granic.mjs
 */
import { spawnSync } from "node:child_process";

function wykonajSql(sql) {
  const wynik = spawnSync("npx", ["supabase", "db", "query", "--linked"], {
    cwd: process.cwd(),
    encoding: "utf8",
    input: sql,
    shell: true,
    maxBuffer: 8 * 1024 * 1024,
  });
  if (wynik.status !== 0) {
    throw new Error((wynik.stderr || wynik.stdout || "query failed").slice(0, 1500));
  }
  return wynik.stdout || "";
}

function parseRow(out) {
  const start = out.indexOf("{");
  if (start < 0) return null;
  const parsed = JSON.parse(out.slice(start));
  if (Array.isArray(parsed) && parsed[0]) return parsed[0];
  if (Array.isArray(parsed?.rows) && parsed.rows[0]) return parsed.rows[0];
  return parsed;
}

const sql = `
SELECT
  COUNT(*)::int AS lacznie,
  COUNT(*) FILTER (WHERE boundary_geojson IS NOT NULL)::int AS z_granica,
  COUNT(*) FILTER (WHERE boundary_geojson IS NULL)::int AS bez_granicy,
  COUNT(*) FILTER (WHERE gmina_teryt_kod IS NOT NULL AND length(gmina_teryt_kod) = 7)::int AS z_kodem_gminy,
  COUNT(*) FILTER (WHERE latitude IS NOT NULL AND longitude IS NOT NULL)::int AS z_gps,
  COUNT(*) FILTER (WHERE is_active)::int AS aktywne,
  COUNT(*) FILTER (WHERE soltys_user_id IS NOT NULL)::int AS z_soltysem,
  COUNT(*) FILTER (WHERE boundary_source LIKE 'prg_a05%')::int AS zrodlo_a05,
  COUNT(*) FILTER (WHERE boundary_source LIKE 'prg_a06%')::int AS zrodlo_a06,
  COUNT(*) FILTER (WHERE boundary_source LIKE '%_gmina')::int AS zrodlo_gmina,
  ROUND(100.0 * COUNT(*) FILTER (WHERE boundary_geojson IS NOT NULL) / NULLIF(COUNT(*), 0), 2) AS pct_granica
FROM public.villages;
`;

const row = parseRow(wykonajSql(sql));
if (!row) {
  console.error("Brak wyniku zapytania.");
  process.exit(1);
}

console.log("=== Stan granic PRG (katalog wsi) ===");
console.log(`Wsi łącznie:        ${row.lacznie}`);
console.log(`Z granicą:          ${row.z_granica} (${row.pct_granica}%)`);
console.log(`Bez granicy:        ${row.bez_granicy}`);
console.log(`Kod gminy (7 cyfr): ${row.z_kodem_gminy}`);
console.log(`Z GPS:              ${row.z_gps}`);
console.log(`Aktywne:            ${row.aktywne}`);
console.log(`Ze sołtysem:        ${row.z_soltysem}`);
console.log(`Źródło A05:         ${row.zrodlo_a05}`);
console.log(`Źródło A06:         ${row.zrodlo_a06}`);
console.log(`Źródło obrys gminy: ${row.zrodlo_gmina}`);

const errSql = `
SELECT last_error_message, COUNT(*)::int AS cnt
FROM public.geoportal_boundary_sync_state
WHERE last_status = 'error' AND last_error_message IS NOT NULL
GROUP BY last_error_message
ORDER BY cnt DESC
LIMIT 5;
`;
const errOut = wykonajSql(errSql);
try {
  const start = errOut.indexOf("[");
  const errors = start >= 0 ? JSON.parse(errOut.slice(start)) : [];
  if (Array.isArray(errors) && errors.length > 0) {
    console.log("\n=== Top błędy sync ===");
    for (const e of errors) {
      console.log(`  ${e.cnt}x  ${String(e.last_error_message).slice(0, 120)}`);
    }
  }
} catch {
  /* brak tabeli stanu sync na starym środowisku */
}
