import type { Metadata } from "next";
import { PanelStronaSoltysa } from "@/components/panel/panel-strona-soltysa";
import { pobierzUzytkownikaPanelu } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { AlertySoltysKlient } from "./alerty-soltys-klient";
import type { AlertWsi } from "@/lib/alerty/typy-alertow";

export const metadata: Metadata = { title: "Alerty awarii" };

export default async function SoltysAlertyPage() {
  const user = await pobierzUzytkownikaPanelu();
  const supabase = utworzKlientaSupabaseSerwer();
  const villageIds = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);

  const wsie: { id: string; name: string }[] = [];
  if (villageIds.length > 0) {
    const { data } = await supabase.from("villages").select("id, name").in("id", villageIds);
    for (const v of data ?? []) wsie.push({ id: v.id, name: v.name });
  }

  let alerty: (AlertWsi & { village_id: string })[] = [];
  if (villageIds.length > 0) {
    const { data } = await supabase
      .from("village_alerts")
      .select("id, village_id, kind, title, body, status, expected_end_at, resolved_at, created_at")
      .in("village_id", villageIds)
      .order("created_at", { ascending: false })
      .limit(40);
    alerty = (data ?? []) as (AlertWsi & { village_id: string })[];
  }

  return (
    <PanelStronaSoltysa
      etykieta="Organizacja"
      tytul="Alerty awarii"
      opis="Pilne komunikaty o prądzie, wodzie lub drodze — z natychmiastowym powiadomieniem mieszkańców."
      dzieci={<AlertySoltysKlient wsie={wsie} alerty={alerty} />}
    />
  );
}
