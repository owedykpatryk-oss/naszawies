"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

const uuid = z.string().uuid();

const schemaDodaj = z.object({
  villageId: uuid,
  albumId: z.string().uuid().nullish(),
  url: z.string().url().max(2048),
  caption: z.string().trim().max(2000).optional().nullable(),
  takenAt: z.string().nullish(),
});

export type WynikFoto = { blad: string } | { ok: true; id: string };

export async function zapiszZdjecieFotokroniki(dane: z.infer<typeof schemaDodaj>): Promise<WynikFoto> {
  const p = schemaDodaj.safeParse(dane);
  if (!p.success) {
    return { blad: "Niepoprawne dane zdjęcia." };
  }
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }
  const x = p.data;
  let takenAt: string | null = null;
  if (x.takenAt) {
    const t = new Date(x.takenAt);
    if (!Number.isNaN(t.getTime())) takenAt = t.toISOString();
  }

  const { data: row, error } = await supabase
    .from("photos")
    .insert({
      village_id: x.villageId,
      uploaded_by: user.id,
      album_id: x.albumId ?? null,
      url: x.url,
      caption: x.caption?.length ? x.caption : null,
      taken_at: takenAt,
      status: "pending",
      visibility: "public",
    })
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[zapiszZdjecieFotokroniki]", error.message);
    return { blad: "Nie udało się zapisać (sprawdź, czy jesteś mieszkańcem wsi i ewent. album należy do tej wsi)." };
  }
  if (!row?.id) {
    return { blad: "Brak potwierdzenia zapisu." };
  }
  revalidatePath("/panel/mieszkaniec/fotokronika");
  revalidatePath("/panel/soltys/fotokronika");
  return { ok: true, id: row.id };
}

const schemaUsun = z.object({ photoId: uuid });

export type WynikUsunFoto = { blad: string } | { ok: true };

export async function usunMojeOczekujaceZdjecie(dane: z.infer<typeof schemaUsun>): Promise<WynikUsunFoto> {
  const p = schemaUsun.safeParse(dane);
  if (!p.success) {
    return { blad: "Niepoprawny identyfikator." };
  }
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }
  const { data: r, error: e0 } = await supabase
    .from("photos")
    .select("id, url, uploaded_by, status, village_id")
    .eq("id", p.data.photoId)
    .maybeSingle();
  if (e0 || !r) {
    return { blad: "Nie znaleziono zdjęcia." };
  }
  if (r.uploaded_by !== user.id || r.status !== "pending") {
    return { blad: "Możesz usunąć tylko własne zdjęcia oczekujące na moderację." };
  }
  const { error } = await supabase.from("photos").delete().eq("id", p.data.photoId);
  if (error) {
    console.error("[usunMojeOczekujaceZdjecie]", error.message);
    return { blad: "Nie udało się usunąć z bazy." };
  }
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supaUrl && r.url.includes("/village_photos/")) {
    const przed = `${supaUrl}/storage/v1/object/public/village_photos/`;
    if (r.url.startsWith(przed)) {
      const sciezka = r.url.slice(przed.length);
      await supabase.storage.from("village_photos").remove([sciezka]);
    }
  }
  revalidatePath("/panel/mieszkaniec/fotokronika");
  revalidatePath("/panel/soltys/fotokronika");
  return { ok: true };
}
