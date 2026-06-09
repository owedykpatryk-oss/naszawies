import type { SupabaseClient } from "@supabase/supabase-js";
import type { KomentarzPublicznyWiersz } from "@/components/wies/komentarze-publiczne-klient";

export async function pobierzKomentarzeOgloszenia(
  supabase: SupabaseClient,
  postId: string,
): Promise<KomentarzPublicznyWiersz[]> {
  const { data } = await supabase
    .from("comments")
    .select("id, body, created_at, author_id")
    .eq("post_id", postId)
    .eq("status", "approved")
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
    (profile ?? []).map((p) => [p.id as string, (p.display_name as string | null)?.trim() || "Użytkownik"]),
  );

  return wiersze.map((k, i) => ({
    id: k.id as string,
    body: k.body as string,
    createdAt: k.created_at as string,
    authorLabel: nazwy.get(k.author_id as string) ?? `Użytkownik ${i + 1}`,
  }));
}
