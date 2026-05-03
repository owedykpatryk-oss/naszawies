import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/logowanie?next=/panel/soltys/wiadomosci-lokalne");
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
        <h1 className="font-serif text-3xl text-green-950">Wiadomości lokalne</h1>
        <p className="mt-2 text-sm text-stone-600">Brak przypisanej wsi w roli sołtysa lub współadmina.</p>
      </main>
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
    <main>
      <p className="mb-4 text-sm text-stone-500">
        <Link href="/panel/soltys" className="text-green-800 underline">
          ← Panel sołtysa
        </Link>
        {" · "}
        <Link href="/panel/soltys/kanaly-rss" className="text-green-800 underline">
          Kanały RSS
        </Link>
      </p>
      <h1 className="font-serif text-3xl text-green-950">Wiadomości lokalne — do zatwierdzenia</h1>
      <p className="mt-2 max-w-2xl text-sm text-stone-600">
        Wpisy z RSS i od mieszkańców pojawiają się tutaj przed publikacją na publicznym profilu wsi.
      </p>
      <SoltysWiadomosciLokalneKlient wsie={wsie} wpisy={wpisy} />
    </main>
  );
}
