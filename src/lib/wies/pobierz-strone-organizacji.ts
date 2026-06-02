import type { SupabaseClient } from "@supabase/supabase-js";
import {
  czySegmentOrganizacji,
  pasujeOrganizacjaDoSegmentu,
  slugPublicznyOrganizacji,
  type SegmentOrganizacji,
} from "@/lib/wies/sciezka-organizacji-publicznej";

export type WierszOrganizacjiPublicznej = {
  id: string;
  village_id: string;
  group_type: string;
  name: string;
  short_description: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  meeting_place: string | null;
  schedule_text: string | null;
  profile_data: unknown;
  public_slug: string | null;
};

export async function pobierzOrganizacjeAktywneWsi(
  supabase: SupabaseClient,
  villageId: string,
): Promise<WierszOrganizacjiPublicznej[]> {
  const { data } = await supabase
    .from("village_community_groups")
    .select(
      "id, village_id, group_type, name, short_description, contact_phone, contact_email, meeting_place, schedule_text, profile_data, public_slug",
    )
    .eq("village_id", villageId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  return (data ?? []) as WierszOrganizacjiPublicznej[];
}

export async function znajdzOrganizacjePoSegmencieISlugu(
  supabase: SupabaseClient,
  villageId: string,
  segment: string,
  slug: string,
): Promise<{ org: WierszOrganizacjiPublicznej; segment: SegmentOrganizacji } | null> {
  if (!czySegmentOrganizacji(segment)) return null;

  const rows = await pobierzOrganizacjeAktywneWsi(supabase, villageId);
  const kandydaci = rows.filter((r) => pasujeOrganizacjaDoSegmentu(r.group_type, r.name, segment));

  for (const org of kandydaci) {
    const s = slugPublicznyOrganizacji(org.name, org.id, org.public_slug);
    if (s === slug) return { org, segment };
  }

  return null;
}
