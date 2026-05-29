import { unstable_cache } from "next/cache";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";

export type StatystykiKataloguWsi = {
  wsieLacznie: number;
  wsieZAktywnymProfilem: number;
};

async function pobierzStatystykiKataloguWsiRaw(): Promise<StatystykiKataloguWsi | null> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return null;

  const [lacznie, aktywne] = await Promise.all([
    supabase.from("villages").select("id", { count: "exact", head: true }),
    supabase.from("villages").select("id", { count: "exact", head: true }).eq("is_active", true),
  ]);

  if (lacznie.error || aktywne.error) {
    console.error(
      "[statystyki-katalogu-wsi]",
      lacznie.error?.message ?? aktywne.error?.message,
    );
    return null;
  }

  return {
    wsieLacznie: lacznie.count ?? 0,
    wsieZAktywnymProfilem: aktywne.count ?? 0,
  };
}

export const pobierzStatystykiKataloguWsi = unstable_cache(
  pobierzStatystykiKataloguWsiRaw,
  ["statystyki-katalogu-wsi-v1"],
  { revalidate: 300 },
);
