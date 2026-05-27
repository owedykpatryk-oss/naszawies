import type { SupabaseClient } from "@supabase/supabase-js";

export type ZdjeciePubliczne = {
  id: string;
  url: string;
  caption: string | null;
  takenAt: string | null;
  createdAt: string;
};

export async function pobierzFotokronikePublicznaWsi(
  supabase: SupabaseClient,
  villageId: string,
  limit = 24,
): Promise<ZdjeciePubliczne[]> {
  const { data } = await supabase
    .from("photos")
    .select("id, url, caption, taken_at, created_at")
    .eq("village_id", villageId)
    .eq("status", "approved")
    .eq("visibility", "public")
    .is("contest_id", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((p) => ({
    id: p.id as string,
    url: p.url as string,
    caption: (p.caption as string | null) ?? null,
    takenAt: (p.taken_at as string | null) ?? null,
    createdAt: p.created_at as string,
  }));
}
