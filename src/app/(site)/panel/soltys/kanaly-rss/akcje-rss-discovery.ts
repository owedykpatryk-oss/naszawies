"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { proponujKanalyRssDlaWsi } from "@/lib/rss/odkryj-kanaly-rss";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzUzytkownikaDoAkcji } from "@/lib/auth/pobierz-uzytkownika-serwer";

export type WynikOdkryciaRss =
  | { blad: string }
  | { ok: true; propozycje: { label: string; feed_url: string; zrodlo: string }[] };

export async function odkryjRssDlaWsiSoltys(villageId: string): Promise<WynikOdkryciaRss> {
  const vid = z.string().uuid().safeParse(villageId);
  if (!vid.success) return { blad: "Nieprawidłowa wieś." };

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się." };

  const vids = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  if (!vids.includes(vid.data)) return { blad: "Brak uprawnień." };

  const [{ data: wies }, { data: linki }] = await Promise.all([
    supabase.from("villages").select("commune, county, website_url").eq("id", vid.data).maybeSingle(),
    supabase
      .from("village_useful_links")
      .select("url, link_kind")
      .eq("village_id", vid.data)
      .in("link_kind", ["bip_gmina", "strona_gminy", "urzad_gminy"]),
  ]);

  const bip = linki?.find((l) => l.link_kind === "bip_gmina")?.url ?? null;
  const strona =
    wies?.website_url ??
    linki?.find((l) => l.link_kind === "strona_gminy" || l.link_kind === "urzad_gminy")?.url ??
    null;

  const propozycje = await proponujKanalyRssDlaWsi({
    commune: wies?.commune,
    county: wies?.county,
    bipUrl: bip,
    stronaGminyUrl: strona,
  });

  return {
    ok: true,
    propozycje: propozycje.map((p) => ({ label: p.label, feed_url: p.feed_url, zrodlo: p.zrodlo })),
  };
}

export async function dodajWieleKanalowRss(
  villageId: string,
  kanaly: { label: string; feed_url: string }[],
): Promise<{ ok: true; dodano: number } | { blad: string }> {
  const vid = z.string().uuid().safeParse(villageId);
  if (!vid.success) return { blad: "Nieprawidłowa wieś." };

  const user = await pobierzUzytkownikaDoAkcji();
  const supabase = utworzKlientaSupabaseSerwer();
  if (!user) return { blad: "Zaloguj się." };

  const vids = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  if (!vids.includes(vid.data)) return { blad: "Brak uprawnień." };

  let dodano = 0;
  for (const k of kanaly.slice(0, 10)) {
    const url = k.feed_url.trim();
    if (!url.startsWith("http")) continue;
    const { error } = await supabase.from("village_news_feed_sources").insert({
      village_id: vid.data,
      label: k.label.trim().slice(0, 120) || "RSS",
      feed_url: url.slice(0, 2048),
      is_enabled: true,
    });
    if (!error) dodano += 1;
  }

  revalidatePath("/panel/soltys/kanaly-rss");
  return { ok: true, dodano };
}
