import type { SupabaseClient } from "@supabase/supabase-js";

/** Liczba POI per village_id (tylko publiczne rekordy z mapy). */
export async function pobierzLicznikiPoiDlaWsi(
  supabase: SupabaseClient,
  villageIds: string[],
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (villageIds.length === 0) return out;

  const chunk = 200;
  for (let i = 0; i < villageIds.length; i += chunk) {
    const partia = villageIds.slice(i, i + chunk);
    const { data, error } = await supabase.from("pois").select("village_id").in("village_id", partia);
    if (error) continue;
    for (const row of data ?? []) {
      const id = row.village_id as string;
      out.set(id, (out.get(id) ?? 0) + 1);
    }
  }
  return out;
}

export function dolaczLicznikiPoiDoWsi<T extends { id: string }>(
  wsie: T[],
  liczniki: Map<string, number>,
): (T & { liczba_poi: number })[] {
  return wsie.map((w) => ({ ...w, liczba_poi: liczniki.get(w.id) ?? 0 }));
}

export function sumaLicznikaPoi(liczniki: Map<string, number>): number {
  let s = 0;
  for (const n of Array.from(liczniki.values())) s += n;
  return s;
}

export function liczbaWsiZPoi(liczniki: Map<string, number>): number {
  let s = 0;
  for (const n of Array.from(liczniki.values())) if (n > 0) s += 1;
  return s;
}
