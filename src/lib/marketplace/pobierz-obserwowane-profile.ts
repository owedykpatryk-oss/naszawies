import type { SupabaseClient } from "@supabase/supabase-js";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import type { RodzajProfiluRynku } from "@/lib/marketplace/rodzaj-profilu-rynku";

export type ObserwowanyProfilRynku = {
  followId: string;
  profileId: string;
  business_name: string;
  short_description: string | null;
  profile_kind: RodzajProfiluRynku;
  is_verified: boolean;
  village_id: string;
  village_name: string;
  sciezkaProfilu: string;
  sciezkaFirmy: string;
  liczbaOfert: number;
};

export async function pobierzObserwowaneProfileRynku(
  supabase: SupabaseClient,
  userId: string,
): Promise<ObserwowanyProfilRynku[]> {
  const { data: rows } = await supabase
    .from("marketplace_profile_follows")
    .select(
      "id, profile_id, marketplace_profiles ( id, business_name, short_description, profile_kind, is_verified, village_id, villages ( name, voivodeship, county, commune, slug ) )",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const out: ObserwowanyProfilRynku[] = [];

  for (const row of rows ?? []) {
    const mp = row.marketplace_profiles;
    const profil = Array.isArray(mp) ? mp[0] : mp;
    if (!profil?.id) continue;
    const vRaw = profil.villages;
    const v = Array.isArray(vRaw) ? vRaw[0] : vRaw;
    if (!v?.slug) continue;

    const sciezkaWsi = sciezkaProfiluWsi({
      voivodeship: v.voivodeship,
      county: v.county,
      commune: v.commune,
      slug: v.slug,
    });

    const { count } = await supabase
      .from("marketplace_listings")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profil.id)
      .eq("status", "approved");

    const kind =
      profil.profile_kind === "sklep" ||
      profil.profile_kind === "gospodarstwo" ||
      profil.profile_kind === "uslugi"
        ? profil.profile_kind
        : "firma";

    out.push({
      followId: row.id,
      profileId: profil.id,
      business_name: profil.business_name,
      short_description: profil.short_description,
      profile_kind: kind,
      is_verified: Boolean(profil.is_verified),
      village_id: profil.village_id,
      village_name: v.name,
      sciezkaProfilu: sciezkaWsi,
      sciezkaFirmy: `${sciezkaWsi}/rynek/firmy/${profil.id}`,
      liczbaOfert: count ?? 0,
    });
  }

  return out;
}
