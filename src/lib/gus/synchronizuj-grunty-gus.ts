import type { SupabaseClient } from "@supabase/supabase-js";
import { ostatniBladBdl, pobierzDaneZmiennejPoPoziomie } from "@/lib/gus/bdl-klient";
import { GUS_GRUNTY_ORNE_VAR_ID, slugWojewodztwaZBdlUnitId } from "@/lib/gus/konstanty-gus";

export type GruntyGusSummary = {
  wojewodztwa: number;
  zapisano: number;
  zapytaniaApi: number;
  bledy: string[];
};

/** P3415 — średnia cena użytków rolnych za 1 ha (województwo). */
export async function synchronizujGruntyGus(admin: SupabaseClient): Promise<GruntyGusSummary> {
  const clientId = process.env.GUS_BDL_CLIENT_ID?.trim() || undefined;
  const summary: GruntyGusSummary = {
    wojewodztwa: 0,
    zapisano: 0,
    zapytaniaApi: 0,
    bledy: [],
  };

  const rok = new Date().getFullYear() - 1;
  const lata = [rok, rok - 1, rok - 2];

  const { wiersze: dane, zapytaniaApi } = await pobierzDaneZmiennejPoPoziomie(
    GUS_GRUNTY_ORNE_VAR_ID,
    lata,
    2,
    clientId,
  );
  summary.zapytaniaApi += zapytaniaApi;

  const najnowsza = new Map<string, { rok: number; value: number; woj_bdl_id: string }>();
  const niedopasowane: string[] = [];

  for (const w of dane) {
    const slug = slugWojewodztwaZBdlUnitId(w.unitId);
    if (!slug) {
      niedopasowane.push(`${w.unitName} (${w.unitId})`);
      continue;
    }
    const cur = najnowsza.get(slug);
    if (!cur || w.year > cur.rok) {
      najnowsza.set(slug, { rok: w.year, value: w.value, woj_bdl_id: w.unitId });
    }
  }

  if (niedopasowane.length > 0) {
    summary.bledy.push(
      `P3415: nie rozpoznano województwa dla ${niedopasowane.length} jednostek BDL.`,
    );
  }

  summary.wojewodztwa = najnowsza.size;
  if (najnowsza.size === 0) {
    summary.bledy.push(
      ostatniBladBdl
        ? `Brak danych P3415 z BDL (${ostatniBladBdl}).`
        : "Brak danych P3415 z BDL.",
    );
    return summary;
  }

  const teraz = new Date().toISOString();
  const wiersze = Array.from(najnowsza.entries()).map(([wojewodztwo, d]) => ({
    wojewodztwo,
    woj_bdl_id: d.woj_bdl_id,
    rok: d.rok,
    value: d.value,
    unit: "zł/ha",
    gus_var_id: GUS_GRUNTY_ORNE_VAR_ID,
    fetched_at: teraz,
  }));

  const { error } = await admin.from("gus_ceny_gruntow_woj").upsert(wiersze, {
    onConflict: "wojewodztwo,rok",
  });
  if (error) {
    summary.bledy.push(error.message);
  } else {
    summary.zapisano = wiersze.length;
  }

  return summary;
}
