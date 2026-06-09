import type { SupabaseClient } from "@supabase/supabase-js";

export type KomentarzHistoriiWiersz = {
  id: string;
  body: string;
  createdAt: string;
  authorLabel: string;
};

export async function pobierzKomentarzeWpisuHistorii(
  supabase: SupabaseClient,
  entryId: string,
): Promise<KomentarzHistoriiWiersz[]> {
  const { data } = await supabase
    .from("village_history_entry_comments")
    .select("id, body, created_at, author_id")
    .eq("entry_id", entryId)
    .eq("status", "visible")
    .order("created_at", { ascending: true })
    .limit(120);

  const wiersze = data ?? [];
  if (wiersze.length === 0) return [];

  const autorzy = Array.from(new Set(wiersze.map((w) => w.author_id as string)));
  const { data: profile } = await supabase
    .from("users")
    .select("id, display_name")
    .in("id", autorzy);

  const nazwy = new Map(
    (profile ?? []).map((p) => [p.id as string, (p.display_name as string | null)?.trim() || "Mieszkaniec"]),
  );

  return wiersze.map((k, i) => ({
    id: k.id as string,
    body: k.body as string,
    createdAt: k.created_at as string,
    authorLabel: nazwy.get(k.author_id as string) ?? `Gość ${i + 1}`,
  }));
}
