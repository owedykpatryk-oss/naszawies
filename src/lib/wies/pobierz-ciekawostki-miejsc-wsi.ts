import type { SupabaseClient } from "@supabase/supabase-js";

export type CiekawostkaMiejscaWsi = {
  id: string;
  nazwa: string;
  tekst: string;
  kategoria: string | null;
  sciezkaMapy: string | null;
};

/** Ciekawostki z profili miejsc (POI) na mapie wsi — publicznie widoczne. */
export async function pobierzCiekawostkiMiejscWsi(
  supabase: SupabaseClient,
  villageId: string,
): Promise<CiekawostkaMiejscaWsi[]> {
  const { data } = await supabase
    .from("pois")
    .select("id, name, category, facts_text")
    .eq("village_id", villageId)
    .not("facts_text", "is", null)
    .order("name")
    .limit(12);

  return (data ?? [])
    .filter((p) => String((p as { facts_text?: string }).facts_text ?? "").trim().length > 0)
    .map((p) => {
      const row = p as { id: string; name: string; category: string | null; facts_text: string };
      return {
        id: row.id,
        nazwa: row.name,
        tekst: row.facts_text.trim(),
        kategoria: row.category,
        sciezkaMapy: `/mapa/miejsce/${row.id}`,
      };
    });
}
