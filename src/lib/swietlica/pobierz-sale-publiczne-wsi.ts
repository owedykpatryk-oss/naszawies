import type { SupabaseClient } from "@supabase/supabase-js";

export type SalaPublicznaWsi = {
  id: string;
  name: string;
  address: string | null;
  area_m2: number | null;
  max_capacity: number | null;
  parking_spaces: number | null;
  description: string | null;
};

export async function pobierzSalePubliczneDlaWsi(
  supabase: SupabaseClient,
  villageId: string,
): Promise<SalaPublicznaWsi[]> {
  const { data, error } = await supabase.rpc("halls_publiczne_dla_wsi", {
    p_village_id: villageId,
  });

  if (error) {
    console.warn("[pobierzSalePubliczneDlaWsi]", error.message);
    return [];
  }

  return ((data ?? []) as SalaPublicznaWsi[]).map((r) => ({
    id: r.id,
    name: r.name,
    address: r.address,
    area_m2: r.area_m2 != null ? Number(r.area_m2) : null,
    max_capacity: r.max_capacity,
    parking_spaces: r.parking_spaces,
    description: r.description,
  }));
}
