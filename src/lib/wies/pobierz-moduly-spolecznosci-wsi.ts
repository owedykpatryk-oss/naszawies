import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import type { AlertWsi } from "@/lib/alerty/typy-alertow";
import type { WpisHarmonogramuSmieci } from "@/lib/harmonogram-smieci/typy";
import type { DyżurSoltysa } from "@/components/wies/sekcja-dyzury-soltysa";
import type { GlosowaniePubliczne } from "@/components/wies/sekcja-glosowania-wsi";

export type ModulySpolecznosciWsi = {
  alerty: AlertWsi[];
  harmonogramSmieci: WpisHarmonogramuSmieci[];
  dyzurySoltysa: DyżurSoltysa[];
  glosowania: GlosowaniePubliczne[];
  mojGlos: Record<string, string>;
};

const puste: ModulySpolecznosciWsi = {
  alerty: [],
  harmonogramSmieci: [],
  dyzurySoltysa: [],
  glosowania: [],
  mojGlos: {},
};

/** Alerty, głosowania, harmonogram śmieci, dyżury — bez cache (świeże dane). */
export async function pobierzModulySpolecznosciWsi(
  villageId: string,
  userId?: string | null,
): Promise<ModulySpolecznosciWsi> {
  const supabase = utworzKlientaSupabaseSerwer();

  const [alertyRes, smieciRes, dyzuryRes, pollsRes] = await Promise.all([
    supabase
      .from("village_alerts")
      .select("id, kind, title, body, status, expected_end_at, resolved_at, created_at")
      .eq("village_id", villageId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("village_waste_schedule")
      .select("id, kind, day_of_week, time_hint, notes")
      .eq("village_id", villageId)
      .eq("is_active", true)
      .order("sort_order")
      .limit(20),
    supabase
      .from("soltys_duty_slots")
      .select("id, day_of_week, specific_date, start_time, end_time, location, notes, phone")
      .eq("village_id", villageId)
      .eq("is_active", true)
      .order("day_of_week", { ascending: true, nullsFirst: false })
      .limit(20),
    supabase
      .from("village_polls")
      .select("id, pytanie, opis, status, rozpoczyna_sie_at, konczy_sie_at, wynik_publiczny_w_trakcie")
      .eq("village_id", villageId)
      .in("status", ["aktywne", "zakonczone"])
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (alertyRes.error?.message?.includes("does not exist")) return puste;

  const glosowania: GlosowaniePubliczne[] = [];
  for (const poll of pollsRes.data ?? []) {
    const { data: opts } = await supabase
      .from("village_poll_options")
      .select("id, tresc")
      .eq("poll_id", poll.id)
      .order("kolejnosc");
    const { data: votes } = await supabase.from("village_poll_votes").select("option_id").eq("poll_id", poll.id);
    const licznik = new Map<string, number>();
    for (const v of votes ?? []) licznik.set(v.option_id as string, (licznik.get(v.option_id as string) ?? 0) + 1);
    glosowania.push({
      ...poll,
      wynik_publiczny_w_trakcie: Boolean(poll.wynik_publiczny_w_trakcie),
      opcje: (opts ?? []).map((o) => ({ id: o.id, tresc: o.tresc, glosy: licznik.get(o.id) ?? 0 })),
    });
  }

  let mojGlos: Record<string, string> = {};
  if (userId && glosowania.length > 0) {
    const ids = glosowania.map((g) => g.id);
    const { data: moje } = await supabase
      .from("village_poll_votes")
      .select("poll_id, option_id")
      .eq("voter_user_id", userId)
      .in("poll_id", ids);
    for (const m of moje ?? []) {
      mojGlos[m.poll_id as string] = m.option_id as string;
    }
  }

  return {
    alerty: (alertyRes.data ?? []) as AlertWsi[],
    harmonogramSmieci: (smieciRes.data ?? []) as WpisHarmonogramuSmieci[],
    dyzurySoltysa: (dyzuryRes.data ?? []) as DyżurSoltysa[],
    glosowania,
    mojGlos,
  };
}
