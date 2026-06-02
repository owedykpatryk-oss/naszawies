import type { ZnacznikRewirLowiecki } from "@/components/mapa/mapa-wsi-leaflet";
import { granicaJakoGeoJson } from "@/lib/mapa/granica-geojson";
import { parsujProfilLowiecki, parsujRewirGeojsonZProfilu } from "@/lib/wies/profil-organizacji";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import type { ZnacznikWsi } from "@/components/mapa/mapa-wsi-leaflet";

export async function pobierzRewiryNaMape(znaczniki: ZnacznikWsi[]): Promise<ZnacznikRewirLowiecki[]> {
  const supabase = createPublicSupabaseClient();
  if (!supabase || znaczniki.length === 0) return [];

  const idsWsi = znaczniki.map((z) => z.id);
  const { data } = await supabase
    .from("village_community_groups")
    .select("id, village_id, name, profile_data")
    .in("village_id", idsWsi)
    .eq("group_type", "lowiectwo")
    .eq("is_active", true)
    .limit(200);

  const wiesPoId = new Map(znaczniki.map((z) => [z.id, z]));
  const wynik: ZnacznikRewirLowiecki[] = [];

  for (const row of data ?? []) {
    const profil = parsujProfilLowiecki(row.profile_data);
    const rawRewir = parsujRewirGeojsonZProfilu(row.profile_data);
    const gj = granicaJakoGeoJson(rawRewir);
    if (!gj) continue;
    const z = wiesPoId.get(row.village_id as string);
    if (!z) continue;
    wynik.push({
      id: `rewir-${row.id}`,
      groupId: row.id as string,
      name: (row.name as string) || "Rewir łowiecki",
      villageId: z.id,
      villageName: z.name,
      sciezkaWsi: z.sciezka,
      numerKola: profil?.numer_kola ?? null,
      geojson: gj,
    });
  }

  return wynik;
}
