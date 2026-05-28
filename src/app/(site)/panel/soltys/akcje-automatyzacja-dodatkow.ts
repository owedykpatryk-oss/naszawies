"use server";

import { revalidatePath } from "next/cache";
import { dodajBrakujacePoiZOpenStreetMap } from "@/app/(site)/panel/soltys/akcje-mapa-poi";
import { odswiezTransportWsiSoltysa } from "@/app/(site)/panel/soltys/akcje-transport";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { synchronizujGranicePrgAutomatycznie } from "@/lib/mapa/synchronizuj-granice-prg-automatycznie";

export type WynikAutomatyzacjiDodatkow =
  | {
      ok: true;
      komunikaty: string[];
      bledy: string[];
    }
  | { ok: false; blad: string };

/** Jednym kliknięciem: granice PRG + OSM + transport dla wszystkich wsi sołtysa. */
export async function uruchomAutomatyczneDodatkiSoltysa(): Promise<WynikAutomatyzacjiDodatkow> {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, blad: "Zaloguj się." };

  const villageIds = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  if (villageIds.length === 0) {
    return { ok: false, blad: "Brak przypisanej wsi." };
  }

  const komunikaty: string[] = [];
  const bledy: string[] = [];

  const admin = createAdminSupabaseClient();
  if (admin) {
    try {
      const granice = await synchronizujGranicePrgAutomatycznie(admin, { tryb: "mapa" });
      if (granice.updatedBoundaries > 0) {
        komunikaty.push(`Obrysy PRG: ${granice.updatedBoundaries}`);
      }
    } catch (e) {
      bledy.push(e instanceof Error ? e.message : String(e));
    }
  } else {
    bledy.push("Brak klucza admin — pominięto sync granic (ustaw SUPABASE_SERVICE_ROLE_KEY).");
  }

  for (const vid of villageIds.slice(0, 3)) {
    const osm = await dodajBrakujacePoiZOpenStreetMap({ villageId: vid, promienM: 2800 });
    if ("ok" in osm) {
      if (osm.dodano > 0) komunikaty.push(`OSM: +${osm.dodano} punktów`);
    } else {
      bledy.push(osm.blad);
    }

    const tr = await odswiezTransportWsiSoltysa({ villageId: vid });
    if (tr.ok) {
      if (tr.kolejOdjazdy > 0 || tr.autobusOdjazdy > 0) {
        komunikaty.push(
          `Transport: PKP ${tr.kolejOdjazdy}, autobusy ${tr.autobusOdjazdy}`,
        );
      }
      bledy.push(...tr.bledy);
    } else {
      bledy.push(tr.blad);
    }
  }

  revalidatePath("/panel/soltys");
  revalidatePath("/panel/soltys/moja-wies");
  revalidatePath("/mapa");

  if (komunikaty.length === 0 && bledy.length > 0) {
    return { ok: false, blad: bledy[0] ?? "Nie udało się uruchomić dodatków." };
  }

  return { ok: true, komunikaty, bledy };
}
