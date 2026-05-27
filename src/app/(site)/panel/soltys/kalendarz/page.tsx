import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PanelStronaSoltysa } from "@/components/panel/panel-strona-soltysa";
import { SoltysKalendarzKlient } from "@/components/panel/soltys-kalendarz-klient";
import { pobierzKalendarzSoltysa } from "@/lib/kalendarz/pobierz-kalendarz-soltysa";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

export const metadata: Metadata = {
  title: "Kalendarz organizacyjny",
};

type Props = {
  searchParams?: { miesiac?: string };
};

function miesiacZParam(miesiac?: string): string {
  const teraz = new Date();
  if (miesiac && /^\d{4}-\d{2}$/.test(miesiac)) return miesiac;
  return `${teraz.getFullYear()}-${String(teraz.getMonth() + 1).padStart(2, "0")}`;
}

function zakresMiesiaca(ym: string): { od: Date; doDaty: Date } {
  const [y, m] = ym.split("-").map(Number);
  const od = new Date(y!, m! - 1, 1, 0, 0, 0, 0);
  const doDaty = new Date(y!, m!, 0, 23, 59, 59, 999);
  return { od, doDaty };
}

export default async function SoltysKalendarzPage({ searchParams }: Props) {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/logowanie?next=/panel/soltys/kalendarz");

  const villageIds = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  const miesiac = miesiacZParam(searchParams?.miesiac);
  const { od, doDaty } = zakresMiesiaca(miesiac);

  const wsie: { id: string; name: string }[] = [];
  if (villageIds.length > 0) {
    const { data: vs } = await supabase.from("villages").select("id, name").in("id", villageIds);
    for (const v of vs ?? []) wsie.push({ id: v.id, name: v.name });
  }

  const kalendarz = await pobierzKalendarzSoltysa(supabase, villageIds, od, doDaty);

  return (
    <PanelStronaSoltysa
      tytul="Kalendarz organizacyjny"
      opis="Jeden widok: wydarzenia, zajętość świetlicy, stały plan tygodnia, terminy dotacji i konkursów, zadania sołtysa oraz imprezy z gminy."
      dzieci={
        <SoltysKalendarzKlient
          wpisy={kalendarz.wpisy}
          wsie={wsie}
          miesiac={miesiac}
          gminaLabel={kalendarz.gminaLabel}
          sciezkaMiesiaca={(ym) => `/panel/soltys/kalendarz?miesiac=${ym}`}
        />
      }
    />
  );
}
