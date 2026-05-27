import type { SupabaseClient } from "@supabase/supabase-js";
import {
  frazaStacjiDlaPowiatu,
  frazaStacjiDlaWojewodztwa,
  rozwiazStacjePkp,
} from "@/lib/transport/huby-powiatowe";

type RelacjaRow = {
  id: string;
  relation_key: string;
  village_id: string;
  target_station_id: string | null;
  target_station_name: string | null;
};

/**
 * Uzupełnia target_station_id/name dla relacji powiat/województwo (PKP).
 * Wywoływane po seedzie relacji i z panelu mieszkańca.
 */
export async function uzupelnijRelacjeTransportoweUzytkownika(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ zaktualizowano: number }> {
  const { data: relacje, error } = await supabase
    .from("user_transport_favorite_relations")
    .select("id, relation_key, village_id, target_station_id, target_station_name")
    .eq("user_id", userId)
    .eq("is_active", true)
    .in("relation_key", ["powiat_default", "wojewodztwo_default"]);

  if (error || !relacje?.length) return { zaktualizowano: 0 };

  const villageIds = Array.from(new Set((relacje as RelacjaRow[]).map((r) => r.village_id)));
  const { data: wsie } = await supabase
    .from("villages")
    .select("id, county, voivodeship")
    .in("id", villageIds);

  const wiesMap = new Map((wsie ?? []).map((w) => [w.id as string, w]));

  let zaktualizowano = 0;
  for (const r of relacje as RelacjaRow[]) {
    if (r.target_station_id && r.target_station_name) continue;

    const w = wiesMap.get(r.village_id);
    if (!w) continue;

    const fraza =
      r.relation_key === "powiat_default"
        ? frazaStacjiDlaPowiatu(String(w.county ?? ""))
        : frazaStacjiDlaWojewodztwa(String(w.voivodeship ?? ""));

    const stacja = await rozwiazStacjePkp(fraza);
    if (!stacja) continue;

    const { error: upErr } = await supabase
      .from("user_transport_favorite_relations")
      .update({
        target_station_id: stacja.id,
        target_station_name: stacja.name,
      })
      .eq("id", r.id);

    if (!upErr) zaktualizowano += 1;
  }

  return { zaktualizowano };
}
