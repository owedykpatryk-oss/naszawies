import type { Metadata } from "next";
import { PanelStronaSoltysa } from "@/components/panel/panel-strona-soltysa";
import { KalendarzLowieckiKlient } from "@/components/panel/soltys/kalendarz-lowiecki-klient";
import { miesiacZParam, zakresMiesiacaKalendarza } from "@/lib/lowiectwo/kalendarz-lowiecki";
import { pobierzAmbonyWsi } from "@/lib/lowiectwo/pobierz-ambony-wsi";
import { pobierzKalendarzLowieckiDlaWsi } from "@/lib/lowiectwo/pobierz-kalendarz-harmonogram";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzUzytkownikaPanelu } from "@/lib/auth/pobierz-uzytkownika-serwer";

export const metadata: Metadata = {
  title: "Kalendarz łowiecki",
};

type Props = {
  searchParams?: { miesiac?: string; ostrzezenie?: string; wies?: string };
};

export default async function KalendarzLowieckiPage({ searchParams }: Props) {
  const supabase = utworzKlientaSupabaseSerwer();
  const user = await pobierzUzytkownikaPanelu();
  const villageIds = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);

  const miesiac = miesiacZParam(searchParams?.miesiac);
  const { od, doDaty } = zakresMiesiacaKalendarza(miesiac);

  const wsie: { id: string; name: string }[] = [];
  const nazwy: Record<string, string> = {};
  const ambonyPoWsi: Record<string, Awaited<ReturnType<typeof pobierzAmbonyWsi>>> = {};

  if (villageIds.length > 0) {
    const { data: vs } = await supabase.from("villages").select("id, name").in("id", villageIds);
    for (const v of vs ?? []) {
      wsie.push({ id: v.id, name: v.name });
      nazwy[v.id] = v.name;
    }
    await Promise.all(
      villageIds.map(async (id) => {
        ambonyPoWsi[id] = await pobierzAmbonyWsi(supabase, id);
      }),
    );
  }

  const wpisy = await pobierzKalendarzLowieckiDlaWsi(supabase, villageIds, od, doDaty, nazwy);

  const ostrzezenia: { id: string; villageId: string; title: string; startsAt: string }[] = [];
  if (villageIds.length > 0) {
    const { data } = await supabase
      .from("village_hunting_notices")
      .select("id, village_id, title, starts_at")
      .in("village_id", villageIds)
      .in("status", ["approved", "pending"])
      .gte("ends_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(40);
    for (const r of data ?? []) {
      ostrzezenia.push({
        id: r.id,
        villageId: r.village_id,
        title: r.title,
        startsAt: r.starts_at,
      });
    }
  }

  return (
    <PanelStronaSoltysa
      tytul="Kalendarz łowiecki"
      opis="Harmonogram polowań, zebrań i obsady ambony — kto siedzi na jakim stanowisku. Widoczne dla mieszkańców wsi po zalogowaniu."
      akcje={
        <>
          <a href="/panel/soltys/lowiectwo" className="btn-panel-secondary text-sm">
            Ostrzeżenia na mapie
          </a>
          <a href="/panel/soltys/kalendarz" className="btn-panel-secondary text-sm">
            Kalendarz organizacyjny
          </a>
        </>
      }
      dzieci={
        <KalendarzLowieckiKlient
          wpisy={wpisy}
          wsie={wsie}
          ambonyPoWsi={ambonyPoWsi}
          ostrzezenia={ostrzezenia}
          miesiac={miesiac}
          sciezkaMiesiaca={(ym) => `/panel/soltys/lowiectwo/kalendarz?miesiac=${ym}`}
          poczatkoweOstrzezenieId={searchParams?.ostrzezenie}
          poczatkowaWiesId={searchParams?.wies}
        />
      }
    />
  );
}
