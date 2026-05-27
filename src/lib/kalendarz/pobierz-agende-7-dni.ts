import type { SupabaseClient } from "@supabase/supabase-js";
import { pobierzKalendarzSoltysa } from "./pobierz-kalendarz-soltysa";
import { ETYKIETA_RODZAJU, type RodzajWpisKalendarza, type WpisKalendarza } from "./typy-kalendarza";

export type WpisAgendySoltysa = WpisKalendarza & {
  starts_at: string;
  wies: string;
  tytulPelny: string;
};

/** Zunifikowana agenda na 7 dni (wydarzenia, świetlica, zadania, terminy…). */
export async function pobierzAgende7DniSoltysa(
  supabase: SupabaseClient,
  villageIds: string[],
  limit = 18,
): Promise<WpisAgendySoltysa[]> {
  if (villageIds.length === 0) return [];

  const od = new Date();
  od.setHours(0, 0, 0, 0);
  const doDaty = new Date(od.getTime() + 7 * 24 * 60 * 60 * 1000);
  doDaty.setHours(23, 59, 59, 999);

  const { wpisy } = await pobierzKalendarzSoltysa(supabase, villageIds, od, doDaty);

  return wpisy
    .filter((w) => new Date(w.start).getTime() >= Date.now() - 60 * 60 * 1000)
    .slice(0, limit)
    .map((w) => ({
      ...w,
      starts_at: w.start,
      wies: w.wiesNazwa,
      tytulPelny: `${ETYKIETA_RODZAJU[w.rodzaj]}: ${w.tytul}`,
    }));
}

export function mapujAgendeNaWydarzenia(
  wpisy: WpisAgendySoltysa[],
): {
  id: string;
  title: string;
  starts_at: string;
  wies: string;
  href?: string | null;
  rodzaj: RodzajWpisKalendarza;
  pilne?: boolean;
}[] {
  return wpisy.map((w) => ({
    id: w.id,
    title: w.tytulPelny,
    starts_at: w.starts_at,
    wies: w.wies,
    href: w.href,
    rodzaj: w.rodzaj,
    pilne: w.pilne,
  }));
}
