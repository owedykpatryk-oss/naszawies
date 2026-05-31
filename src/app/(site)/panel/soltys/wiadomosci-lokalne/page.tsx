import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { pobierzVillageIdsModeracjiTresciCache } from "@/lib/panel/rola-moderacji";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { PanelStronaSoltysa } from "@/components/panel/panel-strona-soltysa";
import {
  SoltysWiadomosciLokalneKlient,
  type WiadomoscDoModeracji,
  type WiesDoWiadomosci,
} from "./wiadomosci-lokalne-klient";

export const metadata: Metadata = {
  title: "Wiadomości lokalne — moderacja",
};

export default async function SoltysWiadomosciLokalnePage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) {
    redirect("/logowanie?next=/panel/soltys/wiadomosci-lokalne");
  }
  const villageIds = await pobierzVillageIdsModeracjiTresciCache(user.id);
  if (villageIds.length === 0) {
    return (
      <PanelStronaSoltysa
        tytul="Wiadomości lokalne"
        opis="Moderacja wiadomości należy do rady sołeckiej lub współadmina — nie do sołtysa."
        dzieci={
          <Link href="/panel/rada" className="inline-block font-medium text-green-800 underline">
            Panel rady sołeckiej →
          </Link>
        }
      />
    );
  }

  const { data: rows } = await supabase.from("villages").select("id, name").in("id", villageIds).order("name");
  const wsie: WiesDoWiadomosci[] = (rows ?? []).map((r) => ({ id: r.id, name: r.name }));

  const { data: newsRows } = await supabase
    .from("local_news_items")
    .select("id, village_id, title, summary, status, is_automated, source_name, source_url, created_at")
    .in("village_id", villageIds)
    .in("status", ["pending", "draft"])
    .order("created_at", { ascending: false });

  const wpisy = (newsRows ?? []) as WiadomoscDoModeracji[];

  return (
    <PanelStronaSoltysa
      tytul="Wiadomości lokalne — do zatwierdzenia"
      opis={
        <>
          Wpisy z RSS i od mieszkańców pojawiają się tutaj przed publikacją na publicznym profilu wsi.{" "}
          <Link href="/panel/soltys/kanaly-rss" className="font-medium text-green-800 underline">
            Kanały RSS
          </Link>
        </>
      }
      dzieci={<SoltysWiadomosciLokalneKlient wsie={wsie} wpisy={wpisy} />}
    />
  );
}
