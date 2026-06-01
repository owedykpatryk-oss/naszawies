"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { pobierzUzytkownikaDoAkcji } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import {
  schemaRozkladPrzystankuReczny,
  type RozkladPrzystankuReczny,
} from "@/lib/transport/rozklad-przystanku-reczny";

export type WynikRozkladuPrzystanku = { ok: true } | { blad: string };

const schemaZapis = z.object({
  poiId: z.string().uuid(),
  rozklad: schemaRozkladPrzystankuReczny,
});

const schemaZdjecie = z.object({
  poiId: z.string().uuid(),
  photoUrl: z.string().url().max(2000),
  photoPath: z.string().trim().max(500),
  photoCaption: z.string().trim().max(300).optional().nullable(),
});

async function wymagajPoiPrzystanek(poiId: string) {
  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { ok: false as const, blad: "Zaloguj się." };

  const { data: poi } = await supabase
    .from("pois")
    .select("id, village_id, category, photo_path")
    .eq("id", poiId)
    .maybeSingle();
  if (!poi) return { ok: false as const, blad: "Nie znaleziono punktu." };
  if (String(poi.category).toLowerCase() !== "przystanek") {
    return { ok: false as const, blad: "Ręczny rozkład dotyczy tylko przystanków autobusowych." };
  }

  const vids = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  if (!vids.includes(poi.village_id)) return { ok: false as const, blad: "Brak uprawnień do tej wsi." };

  return { ok: true as const, supabase, poi };
}

export async function zapiszRozkladPrzystankuSoltysa(dane: {
  poiId: string;
  rozklad: RozkladPrzystankuReczny;
}): Promise<WynikRozkladuPrzystanku> {
  const parsed = schemaZapis.safeParse(dane);
  if (!parsed.success) {
    return { blad: parsed.error.issues[0]?.message ?? "Sprawdź pola rozkładu." };
  }

  const auth = await wymagajPoiPrzystanek(parsed.data.poiId);
  if (!auth.ok) return { blad: auth.blad };

  const payload: RozkladPrzystankuReczny = {
    ...parsed.data.rozklad,
    wersja: 1,
    zaktualizowano: new Date().toISOString(),
  };

  const { error } = await auth.supabase
    .from("pois")
    .update({
      bus_schedule_manual: payload,
      verified_at: new Date().toISOString(),
      is_local_override: true,
    })
    .eq("id", parsed.data.poiId);

  if (error) {
    console.error("[zapiszRozkladPrzystankuSoltysa]", error.message);
    return { blad: "Nie udało się zapisać rozkładu." };
  }

  revalidatePath("/panel/soltys/moja-wies");
  revalidatePath("/mapa");
  revalidatePath(`/mapa/miejsce/${parsed.data.poiId}`);
  revalidatePath("/wies");
  return { ok: true };
}

export async function aktualizujZdjecieTabliczkiPrzystanku(
  dane: z.infer<typeof schemaZdjecie>,
): Promise<WynikRozkladuPrzystanku> {
  const parsed = schemaZdjecie.safeParse(dane);
  if (!parsed.success) return { blad: "Sprawdź dane zdjęcia." };

  const auth = await wymagajPoiPrzystanek(parsed.data.poiId);
  if (!auth.ok) return { blad: auth.blad };

  const { error } = await auth.supabase
    .from("pois")
    .update({
      photo_url: parsed.data.photoUrl,
      photo_path: parsed.data.photoPath,
      photo_caption: parsed.data.photoCaption?.trim() || "Zdjęcie tabliczki rozkładu",
      verified_at: new Date().toISOString(),
      is_local_override: true,
    })
    .eq("id", parsed.data.poiId);

  if (error) {
    console.error("[aktualizujZdjecieTabliczkiPrzystanku]", error.message);
    return { blad: "Nie udało się zapisać zdjęcia." };
  }

  revalidatePath("/panel/soltys/moja-wies");
  revalidatePath("/mapa");
  revalidatePath(`/mapa/miejsce/${parsed.data.poiId}`);
  return { ok: true };
}

export async function usunRecznyRozkladPrzystanku(poiId: string): Promise<WynikRozkladuPrzystanku> {
  const id = z.string().uuid().safeParse(poiId);
  if (!id.success) return { blad: "Nieprawidłowy punkt." };

  const auth = await wymagajPoiPrzystanek(id.data);
  if (!auth.ok) return { blad: auth.blad };

  const { error } = await auth.supabase
    .from("pois")
    .update({ bus_schedule_manual: null })
    .eq("id", id.data);

  if (error) return { blad: "Nie udało się usunąć rozkładu." };

  revalidatePath("/panel/soltys/moja-wies");
  revalidatePath("/mapa");
  revalidatePath(`/mapa/miejsce/${id.data}`);
  return { ok: true };
}
