/**
 * Masowy import POI (Geoportal kontekst → Geoportal POI → OSM) dla powiatu lub gminy.
 *
 *   npx tsx --env-file=.env.local scripts/synchronizuj-poi-powiat-cli.mjs --powiat=nakielski --petla
 *   npx tsx --env-file=.env.local scripts/synchronizuj-poi-powiat-cli.mjs --gmina=Kcynia --etap=osm --petla
 */
import { createClient } from "@supabase/supabase-js";
import { synchronizujKontekstGeoportalAutomatycznie } from "../src/lib/mapa/synchronizuj-kontekst-geoportal-automatycznie.ts";
import { synchronizujPoiZGeoportalAutomatycznie } from "../src/lib/mapa/synchronizuj-poi-z-geoportal-automatycznie.ts";
import { synchronizujPoiOsmAutomatycznie } from "../src/lib/mapa/synchronizuj-poi-osm-automatycznie.ts";

function arg(name, fallback = "") {
  const pref = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(pref));
  return hit ? hit.slice(pref.length) : fallback;
}

function argInt(name, fallback) {
  const raw = arg(name, "");
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function argBool(name) {
  return process.argv.includes(`--${name}`);
}

function supabaseAdmin() {
  const url = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("Brak SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (np. w .env.local).");
  }
  return createClient(url, key);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function pobierzWsiIds(supabase, { powiat, gmina }) {
  let q = supabase.from("villages").select("id, name, latitude, longitude").order("name");
  if (powiat) q = q.ilike("county", powiat);
  if (gmina) q = q.ilike("commune", gmina);
  const { data, error } = await q;
  if (error) throw new Error(`Lista wsi: ${error.message}`);
  const wsie = (data ?? []).filter(
    (w) => Number.isFinite(Number(w.latitude)) && Number.isFinite(Number(w.longitude)),
  );
  return { wsie, bezWspolrzednych: (data ?? []).length - wsie.length };
}

async function uruchomEtap(supabase, etap, batchIds, wsieNaRun) {
  const opts = {
    tylkoVillageIds: batchIds,
    pominFiltrAktywnych: true,
    wymus: true,
  };

  if (etap === "kontekst" || etap === "all") {
    const s = await synchronizujKontekstGeoportalAutomatycznie(supabase, {
      ...opts,
      maxVillagesPerRun: wsieNaRun,
    });
    console.log(
      `[kontekst] przetworzono=${s.processedVillages} dodano PRNG=${s.upsertedPrng} inst=${s.upsertedInstitutional} pominięto=${s.skippedRecentSync} błędy=${s.errors.length}`,
    );
    if (s.errors.length) console.warn(s.errors.slice(0, 5).join("\n"));
  }

  if (etap === "geoportal" || etap === "all") {
    const s = await synchronizujPoiZGeoportalAutomatycznie(supabase, opts);
    console.log(
      `[geoportal-poi] przetworzono=${s.processedVillages} dodano=${s.added} brak cech=${s.skippedNoFeatures} błędy=${s.errors.length}`,
    );
    if (s.errors.length) console.warn(s.errors.slice(0, 5).join("\n"));
  }

  if (etap === "osm" || etap === "all") {
    const s = await synchronizujPoiOsmAutomatycznie(supabase, {
      ...opts,
      maxVillagesPerRun: wsieNaRun,
      maxVillagesScanned: batchIds.length,
    });
    console.log(
      `[osm] próby=${s.attemptedVillages} dodano=${s.added} pominięto kompletne=${s.skippedComplete} błędy=${s.errors.length}`,
    );
    if (s.villages.length) {
      for (const v of s.villages) {
        console.log(`  + ${v.villageName}: ${v.dodano} POI`);
      }
    }
    if (s.errors.length) console.warn(s.errors.slice(0, 5).join("\n"));
    return s.added;
  }

  return 0;
}

async function main() {
  const powiat = arg("powiat", "nakielski");
  const gmina = arg("gmina", "");
  const etap = arg("etap", "osm");
  const wsieNaRun = argInt("wsie-na-run", 3);
  const delayMs = argInt("delay", 4500);
  const petla = argBool("petla");
  const maxPetli = argInt("max-petli", 500);
  const offsetStart = argInt("od", 0);

  const supabase = supabaseAdmin();
  const { wsie, bezWspolrzednych } = await pobierzWsiIds(supabase, { powiat, gmina });
  const ids = wsie.map((w) => w.id);

  console.log(
    `Cel: ${gmina || powiat} | wsi z GPS=${ids.length} bez GPS=${bezWspolrzednych} | etap=${etap} | batch=${wsieNaRun}`,
  );

  if (ids.length === 0) {
    console.log("Brak wsi do synchronizacji.");
    return;
  }

  let offset = Math.max(0, offsetStart);
  let petlaNr = 0;
  let lacznieDodano = 0;

  do {
    petlaNr += 1;
    const batch = ids.slice(offset, offset + wsieNaRun);
    if (batch.length === 0) break;

    const nazwy = wsie.slice(offset, offset + wsieNaRun).map((w) => w.name);
    console.log(`\n--- Partia ${petlaNr} (${offset + 1}-${offset + batch.length}/${ids.length}): ${nazwy.join(", ")} ---`);

    const dodano = await uruchomEtap(supabase, etap, batch, wsieNaRun);
    lacznieDodano += dodano;
    offset += wsieNaRun;

    if (offset < ids.length && delayMs > 0) {
      await sleep(delayMs);
    }
  } while (petla && offset < ids.length && petlaNr < maxPetli);

  if (!petla && offset < ids.length) {
    console.log(
      `\nPozostało ${ids.length - offset} wsi. Uruchom z --petla aby przetworzyć wszystkie (lub zwiększ --wsie-na-run).`,
    );
  } else {
    console.log(`\nGotowe. Łącznie dodano POI z OSM w tej sesji: ${lacznieDodano}.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
