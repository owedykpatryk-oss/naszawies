import type { SupabaseClient } from "@supabase/supabase-js";
import { pojedynczaWies } from "@/lib/supabase/wies-z-zapytania";

export type MojaPropozycjaPoi = {
  id: string;
  village_id: string;
  nazwaWsi: string;
  category: string;
  name: string;
  description: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at: string | null;
  review_note: string | null;
  created_poi_id: string | null;
};

export async function pobierzMojePropozycjePoi(
  supabase: SupabaseClient,
  userId: string,
): Promise<MojaPropozycjaPoi[]> {
  const { data, error } = await supabase
    .from("poi_proposals")
    .select(
      "id, village_id, category, name, description, status, created_at, reviewed_at, review_note, created_poi_id, villages(name)",
    )
    .eq("proposed_by", userId)
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    console.error("[pobierzMojePropozycjePoi]", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const v = pojedynczaWies<{ name: string }>(row.villages);
    return {
      id: row.id,
      village_id: row.village_id,
      nazwaWsi: v?.name ?? "—",
      category: row.category,
      name: row.name,
      description: row.description,
      status: row.status as MojaPropozycjaPoi["status"],
      created_at: row.created_at,
      reviewed_at: row.reviewed_at,
      review_note: row.review_note,
      created_poi_id: row.created_poi_id,
    };
  });
}
