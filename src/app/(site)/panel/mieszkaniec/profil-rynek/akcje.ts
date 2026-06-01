"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { schemaMarketplaceProfil } from "@/lib/marketplace/schema-profil";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

export type WynikProsty = { blad: string } | { ok: true };

export async function zapiszProfilUslugodawcyMieszkanca(
  dane: z.infer<typeof schemaMarketplaceProfil>,
): Promise<WynikProsty> {
  const parsed = schemaMarketplaceProfil.safeParse(dane);
  if (!parsed.success) return { blad: "Sprawdź pola profilu." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const { data: rola } = await supabase
    .from("user_village_roles")
    .select("id")
    .eq("user_id", user.id)
    .eq("village_id", parsed.data.villageId)
    .eq("status", "active")
    .maybeSingle();

  if (!rola) return { blad: "Musisz być aktywnym mieszkańcem tej wsi." };

  const categories = parsed.data.categories_csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 15);

  const { error } = await supabase.from("marketplace_profiles").upsert(
    {
      village_id: parsed.data.villageId,
      owner_user_id: user.id,
      profile_kind: parsed.data.profile_kind ?? "firma",
      business_name: parsed.data.business_name,
      short_description: parsed.data.short_description?.trim() || null,
      details: parsed.data.details?.trim() || null,
      phone: parsed.data.phone?.trim() || null,
      email: parsed.data.email?.trim() || null,
      website: parsed.data.website?.trim() || null,
      categories,
      service_area: parsed.data.service_area?.trim() || null,
      is_active: true,
    },
    { onConflict: "village_id,owner_user_id" },
  );

  if (error) {
    console.error("[zapiszProfilUslugodawcyMieszkanca]", error.message);
    return { blad: "Nie udało się zapisać profilu." };
  }

  const { data: v } = await supabase
    .from("villages")
    .select("voivodeship, county, commune, slug")
    .eq("id", parsed.data.villageId)
    .maybeSingle();
  if (v?.slug) revalidatePath(sciezkaProfiluWsi(v));

  revalidatePath("/panel/mieszkaniec/profil-rynek");
  revalidatePath("/panel/mieszkaniec/marketplace");
  return { ok: true };
}
