import type { SupabaseClient } from "@supabase/supabase-js";
import { czyProfilLesnictwaUzupelniony, parsujProfilLesnictwa, type ProfilLesnictwaJson } from "@/lib/lesnictwo/profil-lesnictwa";

export type ProfilLesnictwaPubliczny = {
  villageId: string;
  profil: ProfilLesnictwaJson;
  opublikowany: boolean;
};

export async function pobierzProfilLesnictwaPubliczny(
  supabase: SupabaseClient,
  villageId: string,
): Promise<ProfilLesnictwaPubliczny | null> {
  const { data } = await supabase
    .from("village_forestry_profiles")
    .select("village_id, profile_data, is_published")
    .eq("village_id", villageId)
    .maybeSingle();

  if (!data?.is_published) return null;
  const profil = parsujProfilLesnictwa(data.profile_data);
  if (!czyProfilLesnictwaUzupelniony(profil)) return null;

  return {
    villageId: data.village_id as string,
    profil: profil!,
    opublikowany: true,
  };
}
