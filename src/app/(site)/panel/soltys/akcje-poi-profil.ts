"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { walidujZdjeciaProfiluPoi } from "@/lib/mapa/zdjecia-profilu-poi";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzUzytkownikaDoAkcji } from "@/lib/auth/pobierz-uzytkownika-serwer";

export type WynikPoiProfil = { ok: true } | { blad: string };

const schemaTresc = z.object({
  poiId: z.string().uuid(),
  storyText: z.string().trim().max(8000).optional().nullable(),
  factsText: z.string().trim().max(3000).optional().nullable(),
  photoUrl: z.string().url().max(2000).optional().nullable(),
  photoPath: z.string().trim().max(500).optional().nullable(),
  photoCaption: z.string().trim().max(300).optional().nullable(),
});

const schemaGaleria = z.object({
  poiId: z.string().uuid(),
  zdjecia: z.array(
    z.object({
      id: z.string().uuid(),
      url: z.string().url().max(2048),
      etykieta: z.string().trim().min(1).max(80),
    }),
  ),
});

export async function zapiszTrescProfiluPoi(dane: z.infer<typeof schemaTresc>): Promise<WynikPoiProfil> {
  const p = schemaTresc.safeParse(dane);
  if (!p.success) return { blad: "Sprawdź treść (historia max 8000 znaków, ciekawostki max 3000)." };

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się." };

  const { data: poi } = await supabase.from("pois").select("id, village_id").eq("id", p.data.poiId).maybeSingle();
  if (!poi) return { blad: "Nie znaleziono punktu." };

  const vids = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  if (!vids.includes(poi.village_id)) return { blad: "Brak uprawnień do tej wsi." };

  const { error } = await supabase
    .from("pois")
    .update({
      story_text: p.data.storyText?.trim() || null,
      facts_text: p.data.factsText?.trim() || null,
      ...(p.data.photoUrl !== undefined
        ? {
            photo_url: p.data.photoUrl?.trim() || null,
            photo_path: p.data.photoPath?.trim() || null,
            photo_caption: p.data.photoCaption?.trim() || null,
          }
        : {}),
      verified_at: new Date().toISOString(),
      is_local_override: true,
    })
    .eq("id", p.data.poiId);

  if (error) {
    console.error("[zapiszTrescProfiluPoi]", error.message);
    return { blad: "Nie udało się zapisać profilu miejsca." };
  }

  revalidatePath("/mapa");
  revalidatePath("/panel/soltys/moja-wies");
  revalidatePath(`/mapa/miejsce/${p.data.poiId}`);
  return { ok: true };
}

export async function zapiszGalerieProfiluPoi(dane: z.infer<typeof schemaGaleria>): Promise<WynikPoiProfil> {
  const p = schemaGaleria.safeParse(dane);
  if (!p.success) return { blad: "Niepoprawna lista zdjęć galerii." };

  const walidowane = walidujZdjeciaProfiluPoi(p.data.zdjecia);
  if (!walidowane) return { blad: "Sprawdź adresy i etykiety zdjęć (max 12)." };

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się." };

  const { data: poi } = await supabase.from("pois").select("id, village_id").eq("id", p.data.poiId).maybeSingle();
  if (!poi) return { blad: "Nie znaleziono punktu." };

  const vids = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  if (!vids.includes(poi.village_id)) return { blad: "Brak uprawnień do tej wsi." };

  const { error } = await supabase
    .from("pois")
    .update({
      gallery_photos: walidowane,
      verified_at: new Date().toISOString(),
      is_local_override: true,
    })
    .eq("id", p.data.poiId);

  if (error) {
    console.error("[zapiszGalerieProfiluPoi]", error.message);
    return { blad: "Nie udało się zapisać galerii." };
  }

  revalidatePath("/mapa");
  revalidatePath("/panel/soltys/moja-wies");
  revalidatePath(`/mapa/miejsce/${p.data.poiId}`);
  return { ok: true };
}
