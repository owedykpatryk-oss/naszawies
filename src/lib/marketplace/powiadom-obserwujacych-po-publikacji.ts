import type { SupabaseClient } from "@supabase/supabase-js";
import { powiadomObserwujacychProfiluRynkuOOgloszeniu } from "@/lib/powiadomienia/powiadom-obserwujacych-profilu-rynku";

/** Po zatwierdzeniu / ponownej aktywacji ogłoszenia powiązanego z profilem firmy. */
export async function powiadomObserwujacychPoPublikacjiOgloszenia(
  supabase: SupabaseClient,
  input: {
    listingId: string;
    villageId: string;
    title: string;
    ownerUserId: string;
  },
): Promise<void> {
  const { data: listing } = await supabase
    .from("marketplace_listings")
    .select("profile_id")
    .eq("id", input.listingId)
    .maybeSingle();

  if (!listing?.profile_id) return;

  const { data: profil } = await supabase
    .from("marketplace_profiles")
    .select("id, business_name")
    .eq("id", listing.profile_id)
    .eq("is_active", true)
    .maybeSingle();

  if (!profil) return;

  const { data: wies } = await supabase
    .from("villages")
    .select("name, voivodeship, county, commune, slug")
    .eq("id", input.villageId)
    .maybeSingle();

  await powiadomObserwujacychProfiluRynkuOOgloszeniu({
    listingId: input.listingId,
    profileId: profil.id,
    villageId: input.villageId,
    title: input.title,
    businessName: profil.business_name,
    ownerUserId: input.ownerUserId,
    wies: wies?.slug ? { ...wies, name: wies.name } : null,
  });
}
