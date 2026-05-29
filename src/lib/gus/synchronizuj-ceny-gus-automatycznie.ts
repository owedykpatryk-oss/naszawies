import type { SupabaseClient } from "@supabase/supabase-js";
import { znajdzRegionDlaPowiatu, pobierzDaneZmiennejRegionalnej } from "@/lib/gus/bdl-klient";
import {
  KATALOG_ZMIENNYCH_GUS_ROLNYCH,
  ostatnieMiesiaceGus,
} from "@/lib/gus/katalog-zmiennych-gus-rolnych";
import { powiadomONowychCenachGus, type NowyOkresGus } from "@/lib/gus/powiadom-o-cenach-gus";
import { PRODUKTY_ROLNE } from "@/lib/rolnictwo/produkty-rolne";

export type GusSyncSummary = {
  powiaty: number;
  regiony: number;
  zapisano: number;
  pominieto: number;
  zapytaniaApi: number;
  powiadomienia: number;
  bledy: string[];
};

type PowiatRow = {
  powiat_teryt_kod: string;
  county: string;
  voivodeship: string;
};

type WierszUpsert = {
  powiat_teryt_kod: string;
  powiat_nazwa: string;
  wojewodztwo: string;
  gus_region_id: string;
  gus_region_nazwa: string;
  product_key: string;
  product_label: string;
  year: number;
  month: number;
  value: number;
  unit: string;
  gus_var_id: number;
  fetched_at: string;
};

function kluczCeny(varId: number, year: number, regionId: string): string {
  return `${varId}:${year}:${regionId}`;
}

const ROZMIAR_PACZKI = 200;

async function wczytajCacheRegionow(
  admin: SupabaseClient,
): Promise<Map<string, { id: string; name: string }>> {
  const mapa = new Map<string, { id: string; name: string }>();
  const { data } = await admin
    .from("agri_powiat_region_cache")
    .select("powiat_teryt_kod, gus_region_id, gus_region_nazwa");
  for (const row of data ?? []) {
    mapa.set(row.powiat_teryt_kod, {
      id: row.gus_region_id,
      name: row.gus_region_nazwa,
    });
  }
  return mapa;
}

async function zapiszNoweMapowaniaRegionow(
  admin: SupabaseClient,
  unikalne: Map<string, PowiatRow>,
  regionDlaPowiatu: Map<string, { id: string; name: string }>,
): Promise<void> {
  const nowe: {
    powiat_teryt_kod: string;
    county: string;
    voivodeship: string;
    gus_region_id: string;
    gus_region_nazwa: string;
  }[] = [];

  for (const [kod, meta] of Array.from(unikalne.entries())) {
    const region = regionDlaPowiatu.get(kod);
    if (!region) continue;
    nowe.push({
      powiat_teryt_kod: kod,
      county: meta.county,
      voivodeship: meta.voivodeship,
      gus_region_id: region.id,
      gus_region_nazwa: region.name,
    });
  }

  if (nowe.length === 0) return;

  const { error } = await admin
    .from("agri_powiat_region_cache")
    .upsert(nowe, { onConflict: "powiat_teryt_kod" });
  if (error) {
    console.warn("[synchronizujCenyGus] cache regionów:", error.message);
  }
}

async function wykryjNoweOkresyGus(
  admin: SupabaseClient,
  doZapisu: WierszUpsert[],
): Promise<NowyOkresGus[]> {
  const maxPerPowiat = new Map<string, { year: number; month: number; region_nazwa: string }>();
  for (const w of doZapisu) {
    const cur = maxPerPowiat.get(w.powiat_teryt_kod);
    if (!cur || w.year > cur.year || (w.year === cur.year && w.month > cur.month)) {
      maxPerPowiat.set(w.powiat_teryt_kod, {
        year: w.year,
        month: w.month,
        region_nazwa: w.gus_region_nazwa,
      });
    }
  }

  const nowe: NowyOkresGus[] = [];
  for (const [kod, max] of Array.from(maxPerPowiat.entries())) {
    const { data: istniejacy } = await admin
      .from("agri_ceny_gus")
      .select("year, month")
      .eq("powiat_teryt_kod", kod)
      .order("year", { ascending: false })
      .order("month", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (
      !istniejacy ||
      max.year > istniejacy.year ||
      (max.year === istniejacy.year && max.month > istniejacy.month)
    ) {
      nowe.push({
        powiat_teryt_kod: kod,
        year: max.year,
        month: max.month,
        region_nazwa: max.region_nazwa,
      });
    }
  }
  return nowe;
}

export async function synchronizujCenyGus(
  admin: SupabaseClient,
): Promise<GusSyncSummary> {
  const clientId = process.env.GUS_BDL_CLIENT_ID?.trim() || undefined;
  const summary: GusSyncSummary = {
    powiaty: 0,
    regiony: 0,
    zapisano: 0,
    pominieto: 0,
    zapytaniaApi: 0,
    powiadomienia: 0,
    bledy: [],
  };

  const { data: powiaty, error } = await admin
    .from("villages")
    .select("powiat_teryt_kod, county, voivodeship")
    .not("powiat_teryt_kod", "is", null);

  if (error) {
    summary.bledy.push(error.message);
    return summary;
  }

  const unikalne = new Map<string, PowiatRow>();
  for (const w of powiaty ?? []) {
    const kod = (w.powiat_teryt_kod as string)?.trim();
    if (!kod || unikalne.has(kod)) continue;
    unikalne.set(kod, {
      powiat_teryt_kod: kod,
      county: w.county as string,
      voivodeship: w.voivodeship as string,
    });
  }
  summary.powiaty = unikalne.size;
  if (unikalne.size === 0) return summary;

  const regionDlaPowiatu = await wczytajCacheRegionow(admin);

  for (const [kod, meta] of Array.from(unikalne.entries())) {
    if (regionDlaPowiatu.has(kod)) continue;
    const region = await znajdzRegionDlaPowiatu(
      meta.county.toLowerCase(),
      meta.voivodeship.toLowerCase(),
      clientId,
    );
    summary.zapytaniaApi += 1;
    if (!region) {
      summary.bledy.push(`Brak regionu BDL dla powiatu ${meta.county} (${kod})`);
      continue;
    }
    regionDlaPowiatu.set(kod, region);
  }

  await zapiszNoweMapowaniaRegionow(admin, unikalne, regionDlaPowiatu);
  summary.regiony = new Set(Array.from(regionDlaPowiatu.values()).map((r) => r.id)).size;

  const miesiace = ostatnieMiesiaceGus(12);
  const lata = Array.from(new Set(miesiace.map((m) => m.year)));
  const ceny = new Map<string, number>();
  const pobraneZmienne = new Set<string>();
  const doZapisu: WierszUpsert[] = [];
  const teraz = new Date().toISOString();

  for (const { year, month } of miesiace) {
    const katalogMiesiaca = KATALOG_ZMIENNYCH_GUS_ROLNYCH[month];
    if (!katalogMiesiaca) continue;

    for (const produkt of PRODUKTY_ROLNE) {
      const zmienna = katalogMiesiaca[produkt.key];
      if (!zmienna) {
        summary.pominieto += 1;
        continue;
      }

      const cacheKey = `${zmienna.id}:${year}`;
      if (!pobraneZmienne.has(cacheKey)) {
        const dane = await pobierzDaneZmiennejRegionalnej(zmienna.id, lata, clientId);
        summary.zapytaniaApi += 1;
        pobraneZmienne.add(cacheKey);
        for (const w of dane) {
          ceny.set(kluczCeny(zmienna.id, w.year, w.regionId), w.value);
        }
      }

      for (const [kod, meta] of Array.from(unikalne.entries())) {
        const region = regionDlaPowiatu.get(kod);
        if (!region) continue;

        const val = ceny.get(kluczCeny(zmienna.id, year, region.id));
        if (val == null) {
          summary.pominieto += 1;
          continue;
        }

        doZapisu.push({
          powiat_teryt_kod: kod,
          powiat_nazwa: meta.county,
          wojewodztwo: meta.voivodeship,
          gus_region_id: region.id,
          gus_region_nazwa: region.name,
          product_key: produkt.key,
          product_label: produkt.label,
          year,
          month,
          value: val,
          unit: zmienna.unit,
          gus_var_id: zmienna.id,
          fetched_at: teraz,
        });
      }
    }
  }

  const noweOkresy = await wykryjNoweOkresyGus(admin, doZapisu);

  for (let i = 0; i < doZapisu.length; i += ROZMIAR_PACZKI) {
    const paczka = doZapisu.slice(i, i + ROZMIAR_PACZKI);
    const { error: upsertErr } = await admin
      .from("agri_ceny_gus")
      .upsert(paczka, { onConflict: "powiat_teryt_kod,product_key,year,month" });
    if (upsertErr) {
      summary.bledy.push(`Paczka ${i}: ${upsertErr.message}`);
    } else {
      summary.zapisano += paczka.length;
    }
  }

  if (summary.zapisano > 0 && noweOkresy.length > 0) {
    try {
      summary.powiadomienia = await powiadomONowychCenachGus(admin, noweOkresy);
    } catch (e) {
      summary.bledy.push(
        `Powiadomienia: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  return summary;
}
