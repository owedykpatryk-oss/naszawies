"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import {
  czyProfilRolnictwaUzupelniony,
  profilRolnictwaZFormularza,
  schemaProfilRolnictwa,
} from "@/lib/rolnictwo/profil-rolnictwa";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzUzytkownikaDoAkcji } from "@/lib/auth/pobierz-uzytkownika-serwer";

const uuid = z.string().uuid();

export type WynikRol = { blad: string } | { ok: true };

async function czySoltysWsi(userId: string, villageId: string): Promise<boolean> {
  const ids = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(userId);
  return ids.includes(villageId);
}

const schemaProfil = z.object({
  villageId: uuid,
  opublikowany: z.boolean(),
  profileData: schemaProfilRolnictwa,
});

export async function zapiszProfilRolnictwaSoltys(dane: z.infer<typeof schemaProfil>): Promise<WynikRol> {
  const p = schemaProfil.safeParse(dane);
  if (!p.success) return { blad: "Uzupełnij poprawnie pola profilu." };

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się." };
  if (!(await czySoltysWsi(user.id, p.data.villageId))) return { blad: "Brak uprawnień." };

  if (p.data.opublikowany && !czyProfilRolnictwaUzupelniony(p.data.profileData)) {
    return { blad: "Uzupełnij przynajmniej jedno pole (np. ARiMR, dopłaty lub skup), zanim opublikujesz profil." };
  }

  const { error } = await supabase.from("village_agriculture_profiles").upsert(
    {
      village_id: p.data.villageId,
      profile_data: p.data.profileData,
      is_published: p.data.opublikowany,
    },
    { onConflict: "village_id" },
  );

  if (error) {
    console.error("[zapiszProfilRolnictwaSoltys]", error.message);
    return { blad: "Nie udało się zapisać profilu." };
  }

  revalidatePath("/panel/soltys/rolnictwo");
  revalidateTag(`profil-wsi-${p.data.villageId}`);
  return { ok: true };
}

export async function zapiszProfilRolnictwaZFormularza(fd: FormData): Promise<WynikRol> {
  const villageId = String(fd.get("village_id") ?? "");
  const opublikowany = fd.get("opublikowany") === "1";
  return zapiszProfilRolnictwaSoltys({
    villageId,
    opublikowany,
    profileData: profilRolnictwaZFormularza(fd),
  });
}
