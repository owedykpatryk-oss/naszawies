import type { SupabaseClient } from "@supabase/supabase-js";
import { ostatniBladBdl, pobierzDaneZmiennejPoPoziomie } from "@/lib/gus/bdl-klient";
import { GUS_LUDNOSC_GMINA_VAR_ID, idBdlDoTercGminy } from "@/lib/gus/konstanty-gus";

export type LudnoscGusSummary = {
  gminy: number;
  zaktualizowano_wsi: number;
  zapytaniaApi: number;
  bledy: string[];
};

const ROZMIAR_PACZKI = 200;

/** P2462 — ludność gminy (rok), propagacja na wiersze villages. */
export async function synchronizujLudnoscGus(admin: SupabaseClient): Promise<LudnoscGusSummary> {
  const clientId = process.env.GUS_BDL_CLIENT_ID?.trim() || undefined;
  const summary: LudnoscGusSummary = {
    gminy: 0,
    zaktualizowano_wsi: 0,
    zapytaniaApi: 0,
    bledy: [],
  };

  const rokBiezacy = new Date().getFullYear();
  const lata = [rokBiezacy - 1, rokBiezacy - 2, rokBiezacy - 3];

  const { wiersze: dane, zapytaniaApi } = await pobierzDaneZmiennejPoPoziomie(
    GUS_LUDNOSC_GMINA_VAR_ID,
    lata,
    6,
    clientId,
  );
  summary.zapytaniaApi += zapytaniaApi;

  const najnowszaPoGminie = new Map<string, { rok: number; ludnosc: number }>();
  for (const w of dane) {
    const terc = idBdlDoTercGminy(w.unitId);
    if (!terc) continue;
    const cur = najnowszaPoGminie.get(terc);
    if (!cur || w.year > cur.rok) {
      najnowszaPoGminie.set(terc, { rok: w.year, ludnosc: Math.round(w.value) });
    }
  }

  summary.gminy = najnowszaPoGminie.size;
  if (najnowszaPoGminie.size === 0) {
    summary.bledy.push(
      ostatniBladBdl
        ? `Brak danych P2462 z BDL (${ostatniBladBdl}).`
        : "Brak danych P2462 z BDL.",
    );
    return summary;
  }

  const { data: gminyWBazie } = await admin
    .from("villages")
    .select("gmina_teryt_kod")
    .not("gmina_teryt_kod", "is", null);

  const aktywneGminy = new Set(
    (gminyWBazie ?? []).map((r) => (r.gmina_teryt_kod as string)?.trim()).filter(Boolean),
  );

  const teraz = new Date().toISOString();
  const wiersze = Array.from(najnowszaPoGminie.entries())
    .filter(([gminaTeryt]) => aktywneGminy.has(gminaTeryt))
    .map(([gmina_teryt_kod, { rok, ludnosc }]) => ({
      gmina_teryt_kod,
      rok,
      ludnosc,
      zrodlo: `GUS BDL P2462, rok ${rok}`,
      fetched_at: teraz,
    }));

  for (let i = 0; i < wiersze.length; i += ROZMIAR_PACZKI) {
    const paczka = wiersze.slice(i, i + ROZMIAR_PACZKI);
    const { error } = await admin
      .from("gus_ludnosc_gmina")
      .upsert(paczka, { onConflict: "gmina_teryt_kod" });
    if (error) {
      summary.bledy.push(`Ludność paczka ${i}: ${error.message}`);
    }
  }

  const { data: zaktualizowano, error: rpcErr } = await admin.rpc("sync_villages_from_gus_ludnosc");
  if (rpcErr) {
    summary.bledy.push(`Propagacja na villages: ${rpcErr.message}`);
  } else {
    summary.zaktualizowano_wsi = Number(zaktualizowano ?? 0);
  }

  return summary;
}
