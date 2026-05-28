"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

const uuid = z.string().uuid();
const emailZ = z.string().trim().email();

export type WynikZespol = { blad: string } | { ok: true; komunikat?: string };

export async function nadajWspoladmina(villageId: string, email: string): Promise<WynikZespol> {
  const v = uuid.safeParse(villageId);
  const em = emailZ.safeParse(email);
  if (!v.success || !em.success) return { blad: "Podaj poprawną wieś i e-mail użytkownika." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const vids = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  if (!vids.includes(v.data)) return { blad: "Brak uprawnień sołtysa w tej wsi." };

  const admin = createAdminSupabaseClient();
  if (!admin) return { blad: "Serwis chwilowo niedostępny — spróbuj później." };

  const { data: lista } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const cel = lista?.users?.find((u) => u.email?.toLowerCase() === em.data.toLowerCase());
  if (!cel?.id) {
    return { blad: "Nie ma konta z tym adresem e-mail — osoba musi najpierw się zarejestrować." };
  }
  if (cel.id === user.id) {
    return { blad: "Nie możesz nadać współadmina samemu sobie." };
  }

  const { data: juzSoltys } = await admin
    .from("user_village_roles")
    .select("id")
    .eq("village_id", v.data)
    .eq("user_id", cel.id)
    .eq("role", "soltys")
    .eq("status", "active")
    .maybeSingle();
  if (juzSoltys) {
    return { blad: "Ta osoba jest już sołtysem tej wsi." };
  }

  const { error } = await admin.from("user_village_roles").insert({
    user_id: cel.id,
    village_id: v.data,
    role: "wspoladmin",
    status: "active",
    verified_at: new Date().toISOString(),
    verified_by: user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return { blad: "Ta osoba ma już rolę współadministratora (lub oczekujący wniosek)." };
    }
    return { blad: error.message || "Nie udało się nadać roli." };
  }

  await admin.from("notifications").insert({
    user_id: cel.id,
    type: "role_approved",
    title: "Współadministrator wsi",
    body: "Sołtys nadał Ci dostęp do panelu sołtysa (współadministrator).",
    link_url: "/panel/soltys",
    related_id: v.data,
    related_type: "village",
    channel: "in_app",
  });

  revalidatePath("/panel/soltys/zespol");
  revalidatePath("/panel/soltys");
  return { ok: true, komunikat: "Współadministrator dodany." };
}

export async function cofnijWspoladmina(rolaId: string): Promise<WynikZespol> {
  const id = uuid.safeParse(rolaId);
  if (!id.success) return { blad: "Niepoprawny identyfikator." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const { data: wiersz } = await supabase
    .from("user_village_roles")
    .select("id, village_id, role, user_id")
    .eq("id", id.data)
    .maybeSingle();

  if (!wiersz || wiersz.role !== "wspoladmin") {
    return { blad: "Nie znaleziono roli współadministratora." };
  }

  const vids = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  if (!vids.includes(wiersz.village_id)) return { blad: "Brak uprawnień w tej wsi." };

  const { error } = await supabase
    .from("user_village_roles")
    .update({ status: "suspended" })
    .eq("id", id.data);

  if (error) return { blad: "Nie udało się cofnąć roli." };

  revalidatePath("/panel/soltys/zespol");
  return { ok: true, komunikat: "Cofnięto rolę współadministratora." };
}
