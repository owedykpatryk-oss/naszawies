import type { SupabaseClient } from "@supabase/supabase-js";
import { ostatniBladBdl, pobierzDaneZmiennejPoPoziomie } from "@/lib/gus/bdl-klient";
import {
  GUS_PSR_GOSPODARSTWA_VAR_ID,
  GUS_PSR_POWIERZCHNIA_HA_VAR_ID,
  GUS_PSR_ROK,
  idBdlDoTercGminy,
} from "@/lib/gus/konstanty-gus";

export type PsrGusSummary = {
  gminy: number;
  zapisano: number;
  zapytaniaApi: number;
  bledy: string[];
};

/** PSR 2020 (G637) — gospodarstwa i powierzchnia UR w gminie. */
export async function synchronizujPsrGus(admin: SupabaseClient): Promise<PsrGusSummary> {
  const clientId = process.env.GUS_BDL_CLIENT_ID?.trim() || undefined;
  const summary: PsrGusSummary = {
    gminy: 0,
    zapisano: 0,
    zapytaniaApi: 0,
    bledy: [],
  };

  const lata = [GUS_PSR_ROK];

  const gospodarstwaWynik = await pobierzDaneZmiennejPoPoziomie(
    GUS_PSR_GOSPODARSTWA_VAR_ID,
    lata,
    6,
    clientId,
  );
  const powierzchniaWynik = await pobierzDaneZmiennejPoPoziomie(
    GUS_PSR_POWIERZCHNIA_HA_VAR_ID,
    lata,
    6,
    clientId,
  );
  summary.zapytaniaApi += gospodarstwaWynik.zapytaniaApi + powierzchniaWynik.zapytaniaApi;

  const gospodarstwa = gospodarstwaWynik.wiersze;
  const powierzchnia = powierzchniaWynik.wiersze;

  const poGminie = new Map<
    string,
    { liczba_gospodarstw: number | null; powierzchnia_ha: number | null }
  >();

  for (const w of gospodarstwa) {
    const terc = idBdlDoTercGminy(w.unitId);
    if (!terc || w.year !== GUS_PSR_ROK) continue;
    const cur = poGminie.get(terc) ?? { liczba_gospodarstw: null, powierzchnia_ha: null };
    cur.liczba_gospodarstw = Math.round(w.value);
    poGminie.set(terc, cur);
  }

  for (const w of powierzchnia) {
    const terc = idBdlDoTercGminy(w.unitId);
    if (!terc || w.year !== GUS_PSR_ROK) continue;
    const cur = poGminie.get(terc) ?? { liczba_gospodarstw: null, powierzchnia_ha: null };
    cur.powierzchnia_ha = Math.round(w.value * 10) / 10;
    poGminie.set(terc, cur);
  }

  summary.gminy = poGminie.size;
  if (poGminie.size === 0) {
    summary.bledy.push(
      ostatniBladBdl
        ? `Brak danych PSR 2020 z BDL (${ostatniBladBdl}).`
        : "Brak danych PSR 2020 z BDL.",
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
  const wiersze = Array.from(poGminie.entries())
    .filter(([gmina_teryt_kod]) => aktywneGminy.has(gmina_teryt_kod))
    .map(([gmina_teryt_kod, d]) => ({
    gmina_teryt_kod,
    rok: GUS_PSR_ROK,
    liczba_gospodarstw: d.liczba_gospodarstw,
    powierzchnia_ha: d.powierzchnia_ha,
    fetched_at: teraz,
  }));

  for (let i = 0; i < wiersze.length; i += 200) {
    const paczka = wiersze.slice(i, i + 200);
    const { error } = await admin.from("gus_psr_gmina").upsert(paczka, { onConflict: "gmina_teryt_kod" });
    if (error) {
      summary.bledy.push(`PSR paczka ${i}: ${error.message}`);
    } else {
      summary.zapisano += paczka.length;
    }
  }

  return summary;
}
