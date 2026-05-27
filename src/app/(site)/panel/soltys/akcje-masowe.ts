"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import {
  zatwierdzMarketplaceOferteMieszkanca,
  zatwierdzPostSoltysa,
  zatwierdzWniosekMieszkanca,
} from "./akcje";
import { zmoderujZdjecieFotokroniki } from "./akcje-fotokronika";

const schemaIds = z.array(z.string().uuid()).min(1).max(25);

export type WynikMasowySoltys =
  | { blad: string }
  | { ok: true; zatwierdzono: number; pominieto: number; komunikaty?: string[] };

async function wykonajMasowo(
  ids: string[],
  fn: (id: string) => Promise<{ ok?: true; blad?: string }>,
): Promise<WynikMasowySoltys> {
  const parsed = schemaIds.safeParse(ids);
  if (!parsed.success) return { blad: "Wybierz od 1 do 25 pozycji." };

  let zatwierdzono = 0;
  const komunikaty: string[] = [];
  for (const id of parsed.data) {
    const w = await fn(id);
    if ("ok" in w && w.ok) {
      zatwierdzono += 1;
    } else if ("blad" in w && w.blad) {
      komunikaty.push(w.blad);
    }
  }

  revalidatePath("/panel/soltys");
  return {
    ok: true,
    zatwierdzono,
    pominieto: parsed.data.length - zatwierdzono,
    komunikaty: komunikaty.length ? komunikaty.slice(0, 3) : undefined,
  };
}

export async function zatwierdzWnioskiMasowoSoltys(ids: string[]): Promise<WynikMasowySoltys> {
  return wykonajMasowo(ids, zatwierdzWniosekMieszkanca);
}

export async function zatwierdzPostyMasowoSoltys(ids: string[]): Promise<WynikMasowySoltys> {
  return wykonajMasowo(ids, zatwierdzPostSoltysa);
}

export async function zatwierdzRynekMasowoSoltys(ids: string[]): Promise<WynikMasowySoltys> {
  return wykonajMasowo(ids, zatwierdzMarketplaceOferteMieszkanca);
}

export async function zatwierdzZdjeciaMasowoSoltys(ids: string[]): Promise<WynikMasowySoltys> {
  const parsed = schemaIds.safeParse(ids);
  if (!parsed.success) return { blad: "Wybierz od 1 do 25 zdjęć." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const vids = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  let zatwierdzono = 0;
  const komunikaty: string[] = [];

  for (const photoId of parsed.data) {
    const { data: ph } = await supabase
      .from("photos")
      .select("village_id, status")
      .eq("id", photoId)
      .maybeSingle();
    if (!ph || ph.status !== "pending" || !vids.includes(ph.village_id)) {
      komunikaty.push("Brak uprawnień lub zdjęcie już rozpatrzone.");
      continue;
    }
    const w = await zmoderujZdjecieFotokroniki({ photoId, decyzja: "approved" });
    if ("ok" in w && w.ok) zatwierdzono += 1;
    else if ("blad" in w) komunikaty.push(w.blad);
  }

  revalidatePath("/panel/soltys");
  revalidatePath("/panel/soltys/fotokronika");
  return {
    ok: true,
    zatwierdzono,
    pominieto: parsed.data.length - zatwierdzono,
    komunikaty: komunikaty.length ? komunikaty.slice(0, 3) : undefined,
  };
}
