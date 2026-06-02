import type { SupabaseClient } from "@supabase/supabase-js";
import { KATEGORIA_AMBONA, KATEGORIA_POSTERUNEK } from "@/lib/mapa/poi-lowieckie-widocznosc";

export type AmbonaNaLiscie = {
  id: string;
  name: string;
  category: string;
};

/** Ambony i posterunki z mapy POI (do kalendarza obsady). */
export async function pobierzAmbonyWsi(
  supabase: SupabaseClient,
  villageId: string,
): Promise<AmbonaNaLiscie[]> {
  const { data } = await supabase
    .from("pois")
    .select("id, name, category")
    .eq("village_id", villageId)
    .in("category", [KATEGORIA_AMBONA, KATEGORIA_POSTERUNEK])
    .order("name", { ascending: true });

  return (data ?? []).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    category: r.category as string,
  }));
}
