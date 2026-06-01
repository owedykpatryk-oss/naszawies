"use server";

import { z } from "zod";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";

export type WynikOcrRozkladu =
  | { blad: string }
  | { ok: true; komunikat: string; propozycje: { godzina: string; kierunek: string; linia: string | null }[] };

/**
 * Stub OCR tabliczki PKS — rozpoznawanie tekstu z obrazu wymaga zewnętrznego API (Vision / Tesseract).
 * Zwraca komunikat i ewentualnie puste propozycje; sołtys uzupełnia ręcznie.
 */
export async function rozpoznajRozkladZTabliczki(poiId: string): Promise<WynikOcrRozkladu> {
  const id = z.string().uuid().safeParse(poiId);
  if (!id.success) return { blad: "Nieprawidłowy przystanek." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const { data: poi } = await supabase
    .from("pois")
    .select("id, village_id, photo_url, name")
    .eq("id", id.data)
    .maybeSingle();
  if (!poi) return { blad: "Brak przystanku." };

  const vids = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  if (!vids.includes(poi.village_id)) return { blad: "Brak uprawnień." };

  if (!poi.photo_url?.trim()) {
    return {
      blad: "Najpierw wgraj zdjęcie tabliczki rozkładu — OCR będzie działać na tym pliku.",
    };
  }

  return {
    ok: true,
    komunikat:
      "Automatyczne rozpoznawanie tabliczek PKS jest w przygotowaniu. Na razie użyj zdjęcia jako referencji i wpisz kursy ręcznie poniżej — pełne OCR (Vision API) dojdzie w kolejnej wersji.",
    propozycje: [],
  };
}
