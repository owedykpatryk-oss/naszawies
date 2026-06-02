import type { Metadata } from "next";
import { PanelStronaSoltysa } from "@/components/panel/panel-strona-soltysa";
import { pobierzUzytkownikaPanelu } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { GlosowaniaSoltysKlient, type WierszGlosowaniaSoltys } from "./glosowania-soltys-klient";

export const metadata: Metadata = { title: "Głosowania sołeckie" };

export default async function SoltysGlosowaniaPage() {
  const user = await pobierzUzytkownikaPanelu();
  const supabase = utworzKlientaSupabaseSerwer();
  const villageIds = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);

  const wsie: { id: string; name: string }[] = [];
  if (villageIds.length > 0) {
    const { data } = await supabase.from("villages").select("id, name").in("id", villageIds);
    for (const v of data ?? []) wsie.push({ id: v.id, name: v.name });
  }

  const glosowania: WierszGlosowaniaSoltys[] = [];
  if (villageIds.length > 0) {
    const { data: polls } = await supabase
      .from("village_polls")
      .select("id, village_id, pytanie, status, rozpoczyna_sie_at, konczy_sie_at")
      .in("village_id", villageIds)
      .order("created_at", { ascending: false })
      .limit(30);

    for (const poll of polls ?? []) {
      const { data: opts } = await supabase
        .from("village_poll_options")
        .select("id, tresc")
        .eq("poll_id", poll.id)
        .order("kolejnosc");
      const { data: votes } = await supabase.from("village_poll_votes").select("option_id").eq("poll_id", poll.id);
      const licznik = new Map<string, number>();
      for (const v of votes ?? []) {
        const oid = v.option_id as string;
        licznik.set(oid, (licznik.get(oid) ?? 0) + 1);
      }
      glosowania.push({
        ...poll,
        opcje: (opts ?? []).map((o) => ({ id: o.id, tresc: o.tresc, glosy: licznik.get(o.id) ?? 0 })),
      });
    }
  }

  return (
    <PanelStronaSoltysa etykieta="Społeczność" tytul="Głosowania sołeckie" opis="Głosowania nad funduszem sołeckim i sprawami wsi." dzieci={<GlosowaniaSoltysKlient wsie={wsie} glosowania={glosowania} />} />
  );
}
