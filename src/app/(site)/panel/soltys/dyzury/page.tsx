import type { Metadata } from "next";
import { PanelStronaSoltysa } from "@/components/panel/panel-strona-soltysa";
import { pobierzUzytkownikaPanelu } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { DyzurySoltysKlient } from "./dyzury-soltys-klient";
import type { DyżurSoltysa } from "@/components/wies/sekcja-dyzury-soltysa";

export const metadata: Metadata = { title: "Dyżury sołtysa" };

export default async function SoltysDyzuryPage() {
  const user = await pobierzUzytkownikaPanelu();
  const supabase = utworzKlientaSupabaseSerwer();
  const villageIds = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);

  const wsie: { id: string; name: string }[] = [];
  let dyzury: DyżurSoltysa[] = [];
  if (villageIds.length > 0) {
    const { data: vs } = await supabase.from("villages").select("id, name").in("id", villageIds);
    for (const v of vs ?? []) wsie.push({ id: v.id, name: v.name });
    const { data } = await supabase
      .from("soltys_duty_slots")
      .select("id, day_of_week, specific_date, start_time, end_time, location, notes, phone")
      .in("village_id", villageIds)
      .order("day_of_week", { ascending: true, nullsFirst: false });
    dyzury = (data ?? []) as DyżurSoltysa[];
  }

  return (
    <PanelStronaSoltysa etykieta="Administracja" tytul="Dyżury sołtysa" opis="Kiedy mieszkańcy mogą się z Tobą skontaktować." dzieci={<DyzurySoltysKlient wsie={wsie} dyzury={dyzury} />} />
  );
}
