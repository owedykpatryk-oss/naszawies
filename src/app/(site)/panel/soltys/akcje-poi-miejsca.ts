"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { KATEGORIA_LADNE_MIEJSCE } from "@/lib/mapa/kategorie-poi";

export type WynikPoiMiejsca = { ok: true } | { blad: string };

const schemaLadne = z.object({
  villageId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1200).optional().nullable(),
  photoCaption: z.string().trim().max(300).optional().nullable(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  photoUrl: z.string().url().max(2000),
  photoPath: z.string().trim().max(500),
});

export async function dodajLadneMiejsceNaMapie(dane: z.infer<typeof schemaLadne>): Promise<WynikPoiMiejsca> {
  const p = schemaLadne.safeParse(dane);
  if (!p.success) return { blad: "Uzupełnij poprawnie pola (w tym zdjęcie i współrzędne)." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const vids = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  if (!vids.includes(p.data.villageId)) return { blad: "Brak uprawnień do tej wsi." };

  const { error } = await supabase.from("pois").insert({
    village_id: p.data.villageId,
    category: KATEGORIA_LADNE_MIEJSCE,
    name: p.data.name,
    description: p.data.description?.length ? p.data.description : null,
    latitude: p.data.latitude,
    longitude: p.data.longitude,
    photo_url: p.data.photoUrl,
    photo_path: p.data.photoPath,
    photo_caption: p.data.photoCaption?.length ? p.data.photoCaption : null,
    source: "manual",
    is_local_override: true,
    verified_at: new Date().toISOString(),
  });

  if (error) {
    console.error("[dodajLadneMiejsceNaMapie]", error.message);
    return { blad: "Nie udało się zapisać miejsca." };
  }

  revalidatePath("/mapa");
  revalidatePath("/panel/soltys/moja-wies");
  return { ok: true };
}

const schemaKomentarz = z.object({
  poiId: z.string().uuid(),
  body: z.string().trim().min(1).max(600),
});

export async function dodajKomentarzPodPoi(dane: z.infer<typeof schemaKomentarz>): Promise<WynikPoiMiejsca> {
  const p = schemaKomentarz.safeParse(dane);
  if (!p.success) return { blad: "Napisz krótki komentarz (do 600 znaków)." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się, aby komentować." };

  const { data: poi } = await supabase.from("pois").select("id, village_id").eq("id", p.data.poiId).maybeSingle();
  if (!poi) return { blad: "Nie znaleziono miejsca." };

  const { error } = await supabase.from("poi_comments").insert({
    poi_id: poi.id,
    village_id: poi.village_id,
    author_id: user.id,
    body: p.data.body,
    status: "visible",
  });

  if (error) return { blad: "Nie udało się dodać komentarza." };

  revalidatePath(`/mapa/miejsce/${p.data.poiId}`);
  revalidatePath("/mapa");
  return { ok: true };
}
