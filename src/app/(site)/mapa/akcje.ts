"use server";

import { czyAdminPlatformy } from "@/lib/admin/czy-admin-platformy";
import { synchronizujGranicePrgAutomatycznie } from "@/lib/mapa/synchronizuj-granice-prg-automatycznie";
import { synchronizujKontekstGeoportalAutomatycznie } from "@/lib/mapa/synchronizuj-kontekst-geoportal-automatycznie";
import { synchronizujPoiOsmAutomatycznie } from "@/lib/mapa/synchronizuj-poi-osm-automatycznie";
import { synchronizujPoiZGeoportalAutomatycznie } from "@/lib/mapa/synchronizuj-poi-z-geoportal-automatycznie";
import { pobierzVillageIdsRoliPaneluSoltysa } from "@/lib/panel/rola-panelu-soltysa";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { synchronizujAutobusyAutomatycznie } from "@/lib/transport/synchronizuj-autobusy-automatycznie";
import { synchronizujTransportAutomatycznie } from "@/lib/transport/synchronizuj-transport-automatycznie";
import { z } from "zod";

const uuidSchema = z.string().uuid();

async function wymagajAdminaLubSoltysaWsi(villageIds: string[]) {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, blad: "Zaloguj się." };
  }
  if (await czyAdminPlatformy(supabase)) {
    const admin = createAdminSupabaseClient();
    if (!admin) {
      return { ok: false as const, blad: "Brak konfiguracji serwera." };
    }
    return { ok: true as const, supabase: admin, user };
  }
  const dozwolone = await pobierzVillageIdsRoliPaneluSoltysa(supabase, user.id);
  const zestaw = new Set(dozwolone);
  if (!villageIds.every((id) => zestaw.has(id))) {
    return { ok: false as const, blad: "Brak uprawnień do synchronizacji mapy dla wskazanych wsi." };
  }
  const admin = createAdminSupabaseClient();
  if (!admin) {
    return { ok: false as const, blad: "Brak konfiguracji serwera." };
  }
  return { ok: true as const, supabase: admin, user };
}

/** Uruchamiane z mapy w tle — uzupełnia brakujące obrysy PRG (tylko admin platformy). */
export async function uruchomSyncGraniceZMapy() {
  const supabaseUser = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();
  if (!user) {
    return { ok: false as const, blad: "Zaloguj się." };
  }
  if (!(await czyAdminPlatformy(supabaseUser))) {
    return { ok: false as const, blad: "Brak uprawnień administratora." };
  }
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

/** Granice + OSM POI + PKP + autobusy dla wskazanych wsi (max 10) — sołtys lub admin. */
export async function uruchomUzupelnienieMapyZMapy(args: { villageIdsDoUzupelnienia: string[] }) {
  const ids = args.villageIdsDoUzupelnienia
    .filter((id) => uuidSchema.safeParse(id).success)
    .slice(0, 10);

  const auth = await wymagajAdminaLubSoltysaWsi(ids);
  if (!auth.ok) {
    return auth;
  }
  const supabase = auth.supabase;
  if (!supabase) {
    return { ok: false as const, blad: "Brak SUPABASE_SERVICE_ROLE_KEY." };
  }

  try {
    const granice = await synchronizujGranicePrgAutomatycznie(supabase, { tryb: "mapa" });

    let poi = { added: 0, processedVillages: 0, errors: [] as string[] };
    let geoKontekst = { upsertedPrng: 0, upsertedInstitutional: 0, errors: [] as string[] };
    let poiGeoportal = { added: 0, processedVillages: 0, errors: [] as string[] };
    let transport = { departuresUpserted: 0, enabled: false, errors: [] as string[] };
    let autobus = {
      departuresUpserted: 0,
      przystankiPoiUtworzono: 0,
      enabled: false,
      errors: [] as string[],
    };

    if (ids.length > 0) {
      geoKontekst = await synchronizujKontekstGeoportalAutomatycznie(supabase, {
        tylkoVillageIds: ids,
        maxVillagesPerRun: ids.length,
      });
      poi = await synchronizujPoiOsmAutomatycznie(supabase, {
        tylkoVillageIds: ids,
        maxVillagesPerRun: ids.length,
        wymus: true,
        minDaysBetweenSync: 0,
      });
      poiGeoportal = await synchronizujPoiZGeoportalAutomatycznie(supabase, { tylkoVillageIds: ids });
      transport = await synchronizujTransportAutomatycznie(supabase, {
        tylkoVillageIds: ids,
        wymus: true,
      });
      autobus = await synchronizujAutobusyAutomatycznie(supabase, { tylkoVillageIds: ids });
    }

    return {
      ok: true as const,
      granice,
      geoKontekst,
      poi,
      poiGeoportal,
      transport,
      autobus,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false as const, blad: msg };
  }
}
