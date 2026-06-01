import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { PanelStronaSoltysa } from "@/components/panel/panel-strona-soltysa";
import { SoltysKanalyRssKlient, type KanalRssWiersz, type WiesDoRss } from "./kanaly-rss-klient";

export const metadata: Metadata = {
  title: "Kanały RSS",
};

export default async function SoltysKanalyRssPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) {
    redirect("/logowanie?next=/panel/soltys/kanaly-rss");
  }
  const villageIds = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  if (villageIds.length === 0) {
    return (
      <PanelStronaSoltysa
        tytul="Kanały RSS"
        opis="Brak przypisanej wsi w roli sołtysa lub współadmina."
        dzieci={null}
      />
    );
  }

  const { data: rows } = await supabase.from("villages").select("id, name").in("id", villageIds).order("name");
  const wsie: WiesDoRss[] = (rows ?? []).map((r) => ({ id: r.id, name: r.name }));

  const { data: feedRows } = await supabase
    .from("village_news_feed_sources")
    .select("id, village_id, label, feed_url, is_enabled, import_titles_only, last_fetched_at, last_error")
    .in("village_id", villageIds)
    .order("label");

  const kanaly = (feedRows ?? []) as KanalRssWiersz[];

  return (
    <PanelStronaSoltysa
      tytul="Kanały RSS dla wsi"
      opis={
        <>
          Podłącz oficjalne kanały informacyjne — system doda skróty jako wpisy do zatwierdzenia (bez duplikatów po
          identyfikatorze GUID z kanału).{" "}
          <Link href="/panel/soltys/wiadomosci-lokalne" className="font-medium text-green-800 underline">
            Wiadomości lokalne
          </Link>
        </>
      }
      dzieci={<SoltysKanalyRssKlient wsie={wsie} kanaly={kanaly} />}
    />
  );
}
