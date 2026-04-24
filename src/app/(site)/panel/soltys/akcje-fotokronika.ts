"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

const uuid = z.string().uuid();

const schemaAlbum = z.object({
  villageId: uuid,
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(4000).optional().nullable(),
  eventDate: z.string().optional().nullable(),
  visibility: z.enum(["public", "residents_only"]),
  tags: z.array(z.string().max(64)).max(20).optional(),
});

export type WynikFotoS = { blad: string } | { ok: true; id: string };

export async function utworzAlbumFotokroniki(dane: z.infer<typeof schemaAlbum>): Promise<WynikFotoS> {
  const p = schemaAlbum.safeParse(dane);
  if (!p.success) {
    return { blad: "Sprawdź tytuł i widoczność albumu." };
  }
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }
  const vids = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  if (!vids.includes(p.data.villageId)) {
    return { blad: "Nie możesz tworzyć albumu w tej wsi." };
  }
  const x = p.data;
  const { data: a, error } = await supabase
    .from("photo_albums")
    .insert({
      village_id: x.villageId,
      created_by: user.id,
      title: x.title,
      description: x.description?.length ? x.description : null,
      event_date: x.eventDate && x.eventDate.length > 0 ? x.eventDate : null,
      visibility: x.visibility,
      tags: x.tags && x.tags.length > 0 ? x.tags : null,
    })
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("[utworzAlbumFotokroniki]", error.message);
    return { blad: "Nie udało się utworzyć albumu." };
  }
  if (!a?.id) {
    return { blad: "Brak identyfikatora albumu." };
  }
  revalidatePath("/panel/soltys/fotokronika");
  revalidatePath("/panel/mieszkaniec/fotokronika");
  return { ok: true, id: a.id };
}

const schemaMod = z.object({
  photoId: uuid,
  decyzja: z.enum(["approved", "rejected"]),
});

export async function zmoderujZdjecieFotokroniki(dane: z.infer<typeof schemaMod>): Promise<WynikFotoS> {
  const p = schemaMod.safeParse(dane);
  if (!p.success) {
    return { blad: "Niepoprawne dane." };
  }
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }
  const vids = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  const { data: ph, error: re } = await supabase
    .from("photos")
    .select("id, village_id, status, album_id")
    .eq("id", p.data.photoId)
    .maybeSingle();
  if (re || !ph) {
    return { blad: "Nie znaleziono zdjęcia." };
  }
  if (!vids.includes(ph.village_id)) {
    return { blad: "Brak uprawnień do tej wsi." };
  }
  if (ph.status !== "pending") {
    return { blad: "To zdjęcie ma już status inny niż oczekujące." };
  }
  const { error } = await supabase
    .from("photos")
    .update({
      status: p.data.decyzja,
      moderated_by: user.id,
      moderated_at: new Date().toISOString(),
    })
    .eq("id", p.data.photoId);
  if (error) {
    console.error("[zmoderujZdjecieFotokroniki]", error.message);
    return { blad: "Nie udało się zaktualizować statusu." };
  }
  revalidatePath("/panel/soltys/fotokronika");
  revalidatePath("/panel/mieszkaniec/fotokronika");
  return { ok: true, id: p.data.photoId };
}

const schemaOkladka = z.object({ albumId: uuid, photoId: uuid });

export async function ustawOkladkeAlbumu(dane: z.infer<typeof schemaOkladka>): Promise<WynikFotoS> {
  const p = schemaOkladka.safeParse(dane);
  if (!p.success) {
    return { blad: "Niepoprawne dane." };
  }
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }
  const vids = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  const { data: al, error: aE } = await supabase
    .from("photo_albums")
    .select("id, village_id")
    .eq("id", p.data.albumId)
    .maybeSingle();
  if (aE || !al) {
    return { blad: "Nie znaleziono albumu." };
  }
  if (!vids.includes(al.village_id)) {
    return { blad: "Brak uprawnień." };
  }
  const { data: ph, error: pE } = await supabase
    .from("photos")
    .select("id, village_id, status, album_id")
    .eq("id", p.data.photoId)
    .maybeSingle();
  if (pE || !ph) {
    return { blad: "Nie znaleziono zdjęcia." };
  }
  if (ph.village_id !== al.village_id || ph.status !== "approved") {
    return { blad: "Tylko zatwierdzone zdjęcia z tej wsi." };
  }
  const { error: uE } = await supabase
    .from("photo_albums")
    .update({ cover_photo_id: p.data.photoId, updated_at: new Date().toISOString() })
    .eq("id", p.data.albumId);
  if (uE) {
    console.error("[ustawOkladkeAlbumu]", uE.message);
    return { blad: "Nie udało się zapisać okładki." };
  }
  revalidatePath("/panel/soltys/fotokronika");
  revalidatePath("/panel/mieszkaniec/fotokronika");
  return { ok: true, id: p.data.albumId };
}
