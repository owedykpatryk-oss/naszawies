import type { SupabaseClient } from "@supabase/supabase-js";

export type WatekDyskusjiPubliczny = {
  id: string;
  title: string;
  body: string;
  category: string;
  commentCount: number;
  voteScore: number;
  createdAt: string;
  authorLabel: string;
};

export async function pobierzDyskusjePubliczneWsi(
  supabase: SupabaseClient,
  villageId: string,
  limit = 5,
): Promise<WatekDyskusjiPubliczny[]> {
  const { data } = await supabase
    .from("village_discussion_threads")
    .select(
      "id, title, body, category, comment_count, vote_score, created_at, author_id",
    )
    .eq("village_id", villageId)
    .eq("visibility", "public")
    .in("status", ["open", "closed"])
    .order("last_activity_at", { ascending: false })
    .limit(limit);

  const watki = data ?? [];
  if (watki.length === 0) return [];

  const autorzy = Array.from(new Set(watki.map((w) => w.author_id as string)));
  const { data: profile } = await supabase
    .from("users")
    .select("id, display_name")
    .in("id", autorzy);

  const nazwy = new Map(
    (profile ?? []).map((p) => [p.id as string, (p.display_name as string | null)?.trim() || "Mieszkaniec"]),
  );

  return watki.map((w, i) => ({
    id: w.id as string,
    title: w.title as string,
    body: w.body as string,
    category: w.category as string,
    commentCount: (w.comment_count as number) ?? 0,
    voteScore: (w.vote_score as number) ?? 0,
    createdAt: w.created_at as string,
    authorLabel: nazwy.get(w.author_id as string) ?? `Mieszkaniec ${i + 1}`,
  }));
}
