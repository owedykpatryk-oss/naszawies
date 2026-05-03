import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { SoltysKanalyRssKlient, type KanalRssWiersz, type WiesDoRss } from "./kanaly-rss-klient";

export const metadata: Metadata = {
  title: "Kanały RSS",
};

export default async function SoltysKanalyRssPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/logowanie?next=/panel/soltys/kanaly-rss");
  }
  const villageIds = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  if (villageIds.length === 0) {
    return (
      <main>
        <p className="mb-4 text-sm text-stone-500">
          <Link href="/panel/soltys" className="text-green-800 underline">
            ← Panel sołtysa
          </Link>
        </p>
        <h1 className="font-serif text-3xl text-green-950">Kanały RSS</h1>
        <p className="mt-2 text-sm text-stone-600">Brak przypisanej wsi w roli sołtysa lub współadmina.</p>
      </main>
    );
  }

  const { data: rows } = await supabase.from("villages").select("id, name").in("id", villageIds).order("name");
  const wsie: WiesDoRss[] = (rows ?? []).map((r) => ({ id: r.id, name: r.name }));

  const { data: feedRows } = await supabase
    .from("village_news_feed_sources")
    .select("id, village_id, label, feed_url, is_enabled, last_fetched_at, last_error")
    .in("village_id", villageIds)
    .order("label");

  const kanaly = (feedRows ?? []) as KanalRssWiersz[];

  return (
    <main>
      <p className="mb-4 text-sm text-stone-500">
        <Link href="/panel/soltys" className="text-green-800 underline">
          ← Panel sołtysa
        </Link>
        {" · "}
        <Link href="/panel/soltys/wiadomosci-lokalne" className="text-green-800 underline">
          Wiadomości lokalne
        </Link>
      </p>
      <h1 className="font-serif text-3xl text-green-950">Kanały RSS dla wsi</h1>
      <p className="mt-2 max-w-2xl text-sm text-stone-600">
        Podłącz oficjalne kanały informacyjne — system doda skróty jako wpisy do zatwierdzenia (bez duplikatów po
        identyfikatorze GUID z kanału).
      </p>
      <SoltysKanalyRssKlient wsie={wsie} kanaly={kanaly} />
    </main>
  );
}
