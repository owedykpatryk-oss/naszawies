import type { SupabaseClient } from "@supabase/supabase-js";

export type LicznikiOczekujacychSoltysa = {
  wnioski: number;
  rezerwacje: number;
  posty: number;
  wiadomosci: number;
  rynek: number;
  pomoc: number;
  zgloszenia: number;
  zdjecia: number;
  raportySpolecznosci: number;
};

export type LicznikiPerWies = LicznikiOczekujacychSoltysa & { villageId: string };

const PUSTE: LicznikiOczekujacychSoltysa = {
  wnioski: 0,
  rezerwacje: 0,
  posty: 0,
  wiadomosci: 0,
  rynek: 0,
  pomoc: 0,
  zgloszenia: 0,
  zdjecia: 0,
  raportySpolecznosci: 0,
};

function sumaLicznika(a: LicznikiOczekujacychSoltysa): number {
  return (
    a.wnioski +
    a.rezerwacje +
    a.posty +
    a.wiadomosci +
    a.rynek +
    a.pomoc +
    a.zgloszenia +
    a.zdjecia +
    a.raportySpolecznosci
  );
}

export function lacznaLiczbaOczekujacych(l: LicznikiOczekujacychSoltysa): number {
  return sumaLicznika(l);
}

/** Tylko zadania sołtysa (bez moderacji treści — to rola rady / współadmina). */
export function lacznaLiczbaZadanSoltysa(l: LicznikiOczekujacychSoltysa): number {
  return l.wnioski + l.rezerwacje + l.zgloszenia;
}

/** Liczniki kolejek moderacji / decyzji dla wsi sołtysa (do KPI i badge w menu). */
export async function pobierzLicznikiOczekujacychSoltysa(
  supabase: SupabaseClient,
  villageIds: string[],
): Promise<LicznikiOczekujacychSoltysa> {
  if (villageIds.length === 0) return { ...PUSTE };

  const { data: hallsRows } = await supabase.from("halls").select("id").in("village_id", villageIds).limit(500);
  const hallIds = (hallsRows ?? []).map((h) => h.id).filter(Boolean) as string[];

  const [
    wnioskiRes,
    postyRes,
    wiadomosciRes,
    rynekRes,
    pomocRes,
    zgloszeniaRes,
    zdjeciaRes,
    raportyRes,
    rezerwacjeRes,
  ] = await Promise.all([
    supabase
      .from("user_village_roles")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds)
      .in("role", ["mieszkaniec", "osp_naczelnik", "kgw_przewodniczaca", "rada_solecka"])
      .eq("status", "pending"),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds)
      .eq("status", "pending"),
    supabase
      .from("local_news_items")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds)
      .in("status", ["pending", "draft"]),
    supabase
      .from("marketplace_listings")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds)
      .eq("status", "pending"),
    supabase
      .from("neighbor_help_offers")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds)
      .eq("status", "pending"),
    supabase
      .from("issues")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds)
      .in("status", ["nowe", "w_trakcie"]),
    supabase
      .from("photos")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds)
      .eq("status", "pending"),
    supabase
      .from("village_content_reports")
      .select("id", { count: "exact", head: true })
      .in("village_id", villageIds)
      .eq("status", "open"),
    hallIds.length > 0
      ? supabase
          .from("hall_bookings")
          .select("id", { count: "exact", head: true })
          .in("hall_id", hallIds)
          .eq("status", "pending")
      : Promise.resolve({ count: 0 }),
  ]);

  return {
    wnioski: wnioskiRes.count ?? 0,
    posty: postyRes.count ?? 0,
    wiadomosci: wiadomosciRes.count ?? 0,
    rynek: rynekRes.count ?? 0,
    pomoc: pomocRes.count ?? 0,
    zgloszenia: zgloszeniaRes.count ?? 0,
    zdjecia: zdjeciaRes.count ?? 0,
    raportySpolecznosci: raportyRes.count ?? 0,
    rezerwacje: rezerwacjeRes.count ?? 0,
  };
}

/** Rozbicie oczekujących po wsiach (gdy sołtys ma kilka miejscowości). */
export async function pobierzLicznikiPerWiesSoltysa(
  supabase: SupabaseClient,
  villageIds: string[],
): Promise<LicznikiPerWies[]> {
  if (villageIds.length <= 1) return [];

  const wyniki = await Promise.all(
    villageIds.map(async (villageId) => ({
      villageId,
      ...(await pobierzLicznikiOczekujacychSoltysa(supabase, [villageId])),
    })),
  );
  return wyniki.filter((w) => lacznaLiczbaOczekujacych(w) > 0).sort((a, b) => lacznaLiczbaOczekujacych(b) - lacznaLiczbaOczekujacych(a));
}
