import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import type {
  AktywnoscFitnessPubliczna,
  PodsumowanieAktywnosciFitness,
} from "@/lib/wies/aktywnosc-fitness-wspolne";

export type { AktywnoscFitnessPubliczna, PodsumowanieAktywnosciFitness } from "@/lib/wies/aktywnosc-fitness-wspolne";
export {
  formatujCzas,
  formatujDystans,
  etykietaRodzajuAktywnosci,
} from "@/lib/wies/aktywnosc-fitness-wspolne";

/** Agregat bieżącego miesiąca — bez rankingów indywidualnych. */
export async function pobierzPodsumowanieAktywnosciFitnessWsi(
  villageId: string,
): Promise<PodsumowanieAktywnosciFitness | null> {
  const supabase = utworzKlientaSupabaseSerwer();
  const teraz = new Date();
  const poczatek = new Date(teraz.getFullYear(), teraz.getMonth(), 1);

  const { data, error } = await supabase
    .from("village_fitness_activities")
    .select("distance_meters, user_id")
    .eq("village_id", villageId)
    .eq("status", "approved")
    .gte("activity_date", poczatek.toISOString());

  if (error || !data || data.length === 0) return null;

  const uczestnicy = new Set<string>();
  let lacznyDystans = 0;
  for (const r of data) {
    uczestnicy.add(r.user_id);
    if (r.distance_meters && r.distance_meters > 0) lacznyDystans += r.distance_meters;
  }

  return {
    liczbaAktywnosci: data.length,
    lacznyDystansMetrow: lacznyDystans,
    uczestnikow: uczestnicy.size,
    okres: "miesiac",
  };
}

/** Zatwierdzone aktywności mieszkańców — ostatnie wpisy na profilu wsi. */
export async function pobierzAktywnosciFitnessWsi(
  villageId: string,
  limit = 20,
): Promise<AktywnoscFitnessPubliczna[]> {
  const supabase = utworzKlientaSupabaseSerwer();

  const { data, error } = await supabase
    .from("village_fitness_activities")
    .select(
      "id, activity_kind, title, activity_date, duration_seconds, distance_meters, source, strava_url, notes, user_id, village_community_groups(name), users(display_name)",
    )
    .eq("village_id", villageId)
    .eq("status", "approved")
    .order("activity_date", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((r) => {
    const grupa = r.village_community_groups as { name?: string } | null;
    const user = r.users as { display_name?: string | null } | null;
    return {
      id: r.id,
      activity_kind: r.activity_kind,
      title: r.title,
      activity_date: r.activity_date,
      duration_seconds: r.duration_seconds,
      distance_meters: r.distance_meters,
      source: r.source,
      strava_url: r.strava_url,
      notes: r.notes,
      autor: { id: r.user_id, display_name: user?.display_name ?? null },
      nazwa_klubu: grupa?.name ?? null,
    };
  });
}
