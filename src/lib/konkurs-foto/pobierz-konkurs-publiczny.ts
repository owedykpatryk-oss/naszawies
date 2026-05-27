import type { SupabaseClient } from "@supabase/supabase-js";
import type { KonkursFotoPubliczny, ZdjecieKonkursu } from "./fazy-konkursu";

type WierszKonkurs = {
  id: string;
  title: string;
  description: string | null;
  rules_text: string | null;
  status: KonkursFotoPubliczny["status"];
  submissions_start: string;
  submissions_end: string;
  voting_start: string;
  voting_end: string;
  max_entries_per_user: number;
  winner_photo_id: string | null;
};

function mapujKonkurs(r: WierszKonkurs): KonkursFotoPubliczny {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    rulesText: r.rules_text,
    status: r.status,
    submissionsStart: r.submissions_start,
    submissionsEnd: r.submissions_end,
    votingStart: r.voting_start,
    votingEnd: r.voting_end,
    maxEntriesPerUser: r.max_entries_per_user,
    winnerPhotoId: r.winner_photo_id,
  };
}

/** Aktywny lub ostatnio zakończony konkurs na profilu wsi. */
export async function pobierzKonkursFotoDlaProfiluWsi(
  supabase: SupabaseClient,
  villageId: string,
): Promise<{ konkurs: KonkursFotoPubliczny; zdjecia: ZdjecieKonkursu[]; mojGlosPhotoId: string | null } | null> {
  const { data: konkursy } = await supabase
    .from("village_photo_contests")
    .select(
      "id, title, description, rules_text, status, submissions_start, submissions_end, voting_start, voting_end, max_entries_per_user, winner_photo_id",
    )
    .eq("village_id", villageId)
    .in("status", ["submissions", "voting", "closed"])
    .order("created_at", { ascending: false })
    .limit(1);

  const wiersz = (konkursy?.[0] ?? null) as WierszKonkurs | null;
  if (!wiersz) return null;

  const konkurs = mapujKonkurs(wiersz);

  let zdjecia: ZdjecieKonkursu[] = [];
  if (konkurs.status === "voting" || konkurs.status === "closed") {
    const { data: fotki } = await supabase
      .from("photos")
      .select("id, url, caption, vote_count, created_at")
      .eq("contest_id", konkurs.id)
      .eq("status", "approved")
      .order("vote_count", { ascending: false })
      .order("created_at", { ascending: true });

    zdjecia = (fotki ?? []).map((p) => ({
      id: p.id as string,
      url: p.url as string,
      caption: (p.caption as string | null) ?? null,
      voteCount: (p.vote_count as number) ?? 0,
      createdAt: p.created_at as string,
    }));
  }

  let mojGlosPhotoId: string | null = null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: glos } = await supabase
      .from("village_photo_votes")
      .select("photo_id")
      .eq("contest_id", konkurs.id)
      .eq("user_id", user.id)
      .maybeSingle();
    mojGlosPhotoId = (glos?.photo_id as string) ?? null;
  }

  return { konkurs, zdjecia, mojGlosPhotoId };
}

/** Otwarte konkursy do zgłoszeń (panel mieszkańca). */
export async function pobierzOtwarteKonkursyDlaWsi(
  supabase: SupabaseClient,
  villageIds: string[],
): Promise<{ id: string; villageId: string; title: string; maxEntriesPerUser: number }[]> {
  if (villageIds.length === 0) return [];
  const { data } = await supabase
    .from("village_photo_contests")
    .select("id, village_id, title, max_entries_per_user, submissions_end")
    .in("village_id", villageIds)
    .eq("status", "submissions")
    .gte("submissions_end", new Date().toISOString());

  return (data ?? []).map((r) => ({
    id: r.id as string,
    villageId: r.village_id as string,
    title: r.title as string,
    maxEntriesPerUser: r.max_entries_per_user as number,
  }));
}
