/**
 * Ręczne uruchomienie synchronizacji cen GUS → agri_ceny_gus.
 * Użycie: node scripts/sync-gus-ceny.mjs [--limit=5]
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function wczytajEnv() {
  for (const plik of [".env.local", ".env"]) {
    const sciezka = resolve(root, plik);
    if (!existsSync(sciezka)) continue;
    for (const linia of readFileSync(sciezka, "utf8").split("\n")) {
      const m = linia.match(/^([^#=]+)=(.*)$/);
      if (!m) continue;
      const k = m[1].trim();
      const v = m[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

wczytajEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Brak NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const limitPowiatow = limitArg ? Number(limitArg.split("=")[1]) : null;

const BDL_BASE = "https://bdl.stat.gov.pl/api/v1";
const clientId = process.env.GUS_BDL_CLIENT_ID?.trim() || undefined;
const OPOZNIENIE = 220;
let ostatnie = 0;

async function czekaj() {
  const d = Date.now() - ostatnie;
  if (d < OPOZNIENIE) await new Promise((r) => setTimeout(r, OPOZNIENIE - d));
  ostatnie = Date.now();
}

async function bdl(urlStr) {
  await czekaj();
  const h = { Accept: "application/json" };
  if (clientId) h["X-ClientId"] = clientId;
  const res = await fetch(urlStr, { headers: h });
  if (!res.ok) throw new Error(`BDL ${res.status}: ${urlStr}`);
  return res.json();
}

const KATALOG = {
  4: { pszenica: 218211, zyto: 218191, kukurydza: 284042, ziemniaki: 218171, mleko: 218231, wolowina: 218151, wieprzowina: 218271, drob: 218251 },
};

const PRODUKTY = [
  ["pszenica", "Pszenica", "zł/dt"],
  ["zyto", "Żyto", "zł/dt"],
  ["kukurydza", "Kukurydza", "zł/dt"],
  ["ziemniaki", "Ziemniaki", "zł/dt"],
  ["mleko", "Mleko", "zł/hl"],
  ["wolowina", "Wołowina", "zł/kg"],
  ["wieprzowina", "Wieprzowina", "zł/kg"],
  ["drob", "Drób", "zł/kg"],
];

async function regionDlaPowiatu(county, voivodeship) {
  const u = new URL(`${BDL_BASE}/units/search`);
  u.searchParams.set("name", county);
  u.searchParams.set("level", "5");
  u.searchParams.set("format", "json");
  const j = await bdl(u.toString());
  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/[^a-z0-9]+/g, "");
  const kandydaci = (j.results ?? []).filter(
    (x) => norm(x.name.replace(/^powiat\s+/i, "")) === norm(county),
  );
  const powiat = kandydaci[0];
  if (!powiat?.parentId) return null;
  let pid = powiat.parentId;
  for (let i = 0; i < 6; i++) {
    const p = await bdl(`${BDL_BASE}/units/${pid}?format=json`);
    if (p.level === 3) return { id: p.id, name: p.name.replace(/^REGION\s+/i, "").trim() };
    if (!p.parentId) break;
    pid = p.parentId;
  }
  return null;
}

const admin = createClient(url, key);

let q = admin.from("villages").select("powiat_teryt_kod, county, voivodeship").not("powiat_teryt_kod", "is", null);
const { data: wiersze, error } = await q;
if (error) {
  console.error(error.message);
  process.exit(1);
}

const unikalne = new Map();
for (const w of wiersze ?? []) {
  const k = w.powiat_teryt_kod?.trim();
  if (!k || unikalne.has(k)) continue;
  unikalne.set(k, w);
}
let lista = Array.from(unikalne.entries());
if (limitPowiatow) lista = lista.slice(0, limitPowiatow);

console.log(`Synchronizacja GUS dla ${lista.length} powiatów (API key: ${clientId ? "tak" : "anonim"})...`);

const miesiac = 4;
const rok = 2025;
const katalog = KATALOG[miesiac];
let zapisano = 0;

const cenyRegion = new Map();
for (const [key, varId] of Object.entries(katalog)) {
  const j = await bdl(`${BDL_BASE}/data/by-variable/${varId}?format=json&unit-level=3&year=${rok}`);
  for (const row of j.results ?? []) {
    const val = row.values?.find((v) => Number(v.year) === rok && v.attrId === 1 && v.val > 0);
    if (val) cenyRegion.set(`${varId}:${row.id}`, val.val);
  }
}

for (const [kod, meta] of lista) {
  const region = await regionDlaPowiatu(meta.county, meta.voivodeship);
  if (!region) {
    console.warn(`  pominięto ${meta.county} — brak regionu`);
    continue;
  }
  for (const [pKey, pLabel, unit] of PRODUKTY) {
    const varId = katalog[pKey];
    const val = cenyRegion.get(`${varId}:${region.id}`);
    if (val == null) continue;
    const { error: e } = await admin.from("agri_ceny_gus").upsert(
      {
        powiat_teryt_kod: kod,
        powiat_nazwa: meta.county,
        wojewodztwo: meta.voivodeship,
        gus_region_id: region.id,
        gus_region_nazwa: region.name,
        product_key: pKey,
        product_label: pLabel,
        year: rok,
        month: miesiac,
        value: val,
        unit,
        gus_var_id: varId,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "powiat_teryt_kod,product_key,year,month" },
    );
    if (e) console.error(`  błąd ${kod}/${pKey}:`, e.message);
    else zapisano++;
  }
  console.log(`  ✓ ${meta.county} → region ${region.name}`);
}

const { count } = await admin.from("agri_ceny_gus").select("id", { count: "exact", head: true });
console.log(`\nZapisano ${zapisano} wierszy. W bazie łącznie: ${count ?? "?"}`);
