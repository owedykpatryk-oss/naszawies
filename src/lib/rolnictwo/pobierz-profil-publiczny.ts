import type { SupabaseClient } from "@supabase/supabase-js";
import {
  czyProfilRolnictwaUzupelniony,
  parsujProfilRolnictwa,
  type ProfilRolnictwaJson,
} from "@/lib/rolnictwo/profil-rolnictwa";

export type ProfilRolnictwaPubliczny = {
  villageId: string;
  profil: ProfilRolnictwaJson;
  opublikowany: boolean;
};

export async function pobierzProfilRolnictwaPubliczny(
  supabase: SupabaseClient,
  villageId: string,
): Promise<ProfilRolnictwaPubliczny | null> {
  const { data } = await supabase
    .from("village_agriculture_profiles")
    .select("village_id, profile_data, is_published")
    .eq("village_id", villageId)
    .maybeSingle();

  if (!data?.is_published) return null;
  const profil = parsujProfilRolnictwa(data.profile_data);
  if (!czyProfilRolnictwaUzupelniony(profil)) return null;

  return {
    villageId: data.village_id as string,
    profil: profil!,
    opublikowany: true,
  };
}
