"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

export type WynikObserwacjiProfilu = { blad: string } | { ok: true; obserwuje: boolean };

export async function przelaczObserwacjeProfiluRynku(profileId: string): Promise<WynikObserwacjiProfilu> {
  const id = z.string().uuid().safeParse(profileId);
  if (!id.success) return { blad: "Niepoprawny profil." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się, aby obserwować firmy." };

  const { data: profil } = await supabase
    .from("marketplace_profiles")
    .select("id, village_id, owner_user_id, business_name, is_active")
    .eq("id", id.data)
    .eq("is_active", true)
    .maybeSingle();

  if (!profil) return { blad: "Profil nie jest dostępny." };
  if (profil.owner_user_id === user.id) {
    return { blad: "Nie możesz obserwować własnego profilu — edytuj go w panelu." };
  }

  const { data: istnieje } = await supabase
    .from("marketplace_profile_follows")
    .select("id")
    .eq("user_id", user.id)
    .eq("profile_id", profil.id)
    .maybeSingle();

  if (istnieje?.id) {
    const { error } = await supabase
      .from("marketplace_profile_follows")
      .delete()
      .eq("id", istnieje.id)
      .eq("user_id", user.id);
    if (error) {
      console.error("[przelaczObserwacjeProfiluRynku] delete", error.message);
      return { blad: "Nie udało się zakończyć obserwacji." };
    }
    await revalidateSciezkiProfilu(supabase, profil.village_id, profil.id);
    return { ok: true, obserwuje: false };
  }

  const { error } = await supabase.from("marketplace_profile_follows").insert({
    user_id: user.id,
    profile_id: profil.id,
    notify_new_listings: true,
  });

  if (error) {
    if (error.code === "23505") return { ok: true, obserwuje: true };
    console.error("[przelaczObserwacjeProfiluRynku] insert", error.message);
    return { blad: "Nie udało się rozpocząć obserwacji." };
  }

  await revalidateSciezkiProfilu(supabase, profil.village_id, profil.id);
  return { ok: true, obserwuje: true };
}

export async function pobierzCzyObserwujeProfilRynku(profileId: string): Promise<boolean> {
  const id = z.string().uuid().safeParse(profileId);
  if (!id.success) return false;

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { count } = await supabase
    .from("marketplace_profile_follows")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("profile_id", id.data);

  return (count ?? 0) > 0;
}

async function revalidateSciezkiProfilu(
  supabase: ReturnType<typeof utworzKlientaSupabaseSerwer>,
  villageId: string,
  profileId: string,
) {
  const { data: v } = await supabase
    .from("villages")
    .select("voivodeship, county, commune, slug")
    .eq("id", villageId)
    .maybeSingle();
  if (v?.slug) {
    const sciezka = sciezkaProfiluWsi(v);
    revalidatePath(sciezka);
    revalidatePath(`${sciezka}/rynek`);
    revalidatePath(`${sciezka}/rynek/uslugi/${profileId}`);
    revalidatePath(`${sciezka}/rynek/firmy/${profileId}`);
  }
  revalidatePath("/panel/moje");
  revalidatePath("/panel/moje/firmy");
}
