import type { SupabaseClient } from "@supabase/supabase-js";

export type WpisKronikiPoi = {
  id: string;
  title: string;
  short_description: string | null;
  event_date: string | null;
  era_label: string | null;
  media_urls: string[];
  sciezka: string;
};

export async function pobierzWpisyKronikiDlaPoi(
  supabase: SupabaseClient,
  args: {
    poiId: string;
    villageId: string;
    sciezkaProfiluWsi: string;
    limit?: number;
  },
): Promise<WpisKronikiPoi[]> {
  const limit = args.limit ?? 6;
  const { data } = await supabase
    .from("village_history_entries")
    .select("id, title, short_description, event_date, era_label, media_urls")
    .eq("village_id", args.villageId)
    .eq("linked_poi_id", args.poiId)
    .eq("status", "approved")
    .order("event_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((w) => ({
    id: w.id as string,
    title: w.title as string,
    short_description: (w.short_description as string | null) ?? null,
    event_date: (w.event_date as string | null) ?? null,
    era_label: (w.era_label as string | null) ?? null,
    media_urls: Array.isArray(w.media_urls) ? (w.media_urls as string[]) : [],
    sciezka: `${args.sciezkaProfiluWsi}/historia/${w.id as string}`,
  }));
}
