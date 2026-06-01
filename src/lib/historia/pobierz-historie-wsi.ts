import type { SupabaseClient } from "@supabase/supabase-js";
import type { WpisHistoriiPanel, WpisHistoriiPubliczny } from "@/lib/historia/typy-historii";

const POLE_PUBLICZNE =
  "id, title, short_description, body, event_date, era_label, created_at, media_urls, source_links, location_label, latitude, longitude, view_count, candle_count, is_featured";

const POLE_PANEL =
  `${POLE_PUBLICZNE}, status, published_at, updated_at, author_id`;

export function mapujWpisHistoriiPubliczny(w: Record<string, unknown>): WpisHistoriiPubliczny {
  const media = w.media_urls;
  const links = w.source_links;
  return {
    id: String(w.id),
    title: String(w.title),
    short_description: (w.short_description as string | null) ?? null,
    body: (w.body as string | null) ?? null,
    event_date: (w.event_date as string | null) ?? null,
    era_label: (w.era_label as string | null) ?? null,
    created_at: String(w.created_at),
    media_urls: Array.isArray(media) ? media.map(String) : [],
    source_links: Array.isArray(links) ? links.map(String) : [],
    location_label: (w.location_label as string | null) ?? null,
    latitude: typeof w.latitude === "number" ? w.latitude : w.latitude != null ? Number(w.latitude) : null,
    longitude: typeof w.longitude === "number" ? w.longitude : w.longitude != null ? Number(w.longitude) : null,
    view_count: typeof w.view_count === "number" ? w.view_count : Number(w.view_count ?? 0) || 0,
    candle_count: typeof w.candle_count === "number" ? w.candle_count : Number(w.candle_count ?? 0) || 0,
    is_featured: Boolean(w.is_featured),
  };
}

export async function pobierzHistoriePublicznaWsi(
  supabase: SupabaseClient,
  villageId: string,
  limit = 24,
): Promise<WpisHistoriiPubliczny[]> {
  const { data } = await supabase
    .from("village_history_entries")
    .select(POLE_PUBLICZNE)
    .eq("village_id", villageId)
    .eq("status", "approved")
    .order("is_featured", { ascending: false })
    .order("event_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((w) => mapujWpisHistoriiPubliczny(w as Record<string, unknown>));
}

export async function pobierzHistoriePaneluWsi(
  supabase: SupabaseClient,
  villageId: string,
  limit = 120,
): Promise<WpisHistoriiPanel[]> {
  const { data } = await supabase
    .from("village_history_entries")
    .select(POLE_PANEL)
    .eq("village_id", villageId)
    .order("event_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []).map((w) => ({
    ...mapujWpisHistoriiPubliczny(w as Record<string, unknown>),
    status: String((w as { status?: string }).status ?? "pending"),
    published_at: ((w as { published_at?: string | null }).published_at as string | null) ?? null,
    updated_at: String((w as { updated_at?: string }).updated_at ?? ""),
    author_id: ((w as { author_id?: string | null }).author_id as string | null) ?? null,
  }));
}
