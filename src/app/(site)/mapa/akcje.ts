"use server";

import { synchronizujGranicePrgAutomatycznie } from "@/lib/mapa/synchronizuj-granice-prg-automatycznie";
import { synchronizujPoiOsmAutomatycznie } from "@/lib/mapa/synchronizuj-poi-osm-automatycznie";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { synchronizujAutobusyAutomatycznie } from "@/lib/transport/synchronizuj-autobusy-automatycznie";
import { synchronizujTransportAutomatycznie } from "@/lib/transport/synchronizuj-transport-automatycznie";

/** Uruchamiane z mapy w tle — uzupełnia brakujące obrysy PRG (service role). */
export async function uruchomSyncGraniceZMapy() {
  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return { ok: false as const, blad: "Brak konfiguracji serwera." };
  }
  try {
    const summary = await synchronizujGranicePrgAutomatycznie(supabase, { tryb: "mapa" });
    return { ok: true as const, summary };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false as const, blad: msg };
  }
}

/** Granice + OSM POI + PKP + autobusy dla wskazanych wsi (max 6) — z mapy publicznej. */
export async function uruchomUzupelnienieMapyZMapy(args: { villageIdsBezTransportu: string[] }) {
  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return { ok: false as const, blad: "Brak SUPABASE_SERVICE_ROLE_KEY." };
  }

  const idsTransport = args.villageIdsBezTransportu.slice(0, 6);

  try {
    const granice = await synchronizujGranicePrgAutomatycznie(supabase, { tryb: "mapa" });

    let poi = { added: 0, processedVillages: 0, errors: [] as string[] };
    let transport = { departuresUpserted: 0, enabled: false, errors: [] as string[] };
    let autobus = {
      departuresUpserted: 0,
      przystankiPoiUtworzono: 0,
      enabled: false,
      errors: [] as string[],
    };

    if (idsTransport.length > 0) {
      poi = await synchronizujPoiOsmAutomatycznie(supabase, {
        tylkoVillageIds: idsTransport,
        maxVillagesPerRun: idsTransport.length,
        wymus: true,
        minDaysBetweenSync: 0,
      });
      transport = await synchronizujTransportAutomatycznie(supabase, {
        tylkoVillageIds: idsTransport,
        wymus: true,
      });
      autobus = await synchronizujAutobusyAutomatycznie(supabase, { tylkoVillageIds: idsTransport });
    }

    return {
      ok: true as const,
      granice,
      poi,
      transport,
      autobus,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false as const, blad: msg };
  }
}
