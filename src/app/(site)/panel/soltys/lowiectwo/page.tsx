import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PanelStronaSoltysa } from "@/components/panel/panel-strona-soltysa";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { SoltysLowiectwoKlient, type WierszOstrzezenia } from "./soltys-lowiectwo-klient";

export const metadata: Metadata = {
  title: "Ostrzeżenia polowań",
};

export default async function SoltysLowiectwoPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/logowanie?next=/panel/soltys/lowiectwo");

  const villageIds = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  const wsie: { id: string; name: string }[] = [];
  const nazwy: Record<string, string> = {};
  if (villageIds.length > 0) {
    const { data: vs } = await supabase.from("villages").select("id, name").in("id", villageIds);
    for (const v of vs ?? []) {
      wsie.push({ id: v.id, name: v.name });
      nazwy[v.id] = v.name;
    }
  }

  const teraz = Date.now();
  let wiersze: WierszOstrzezenia[] = [];
  if (villageIds.length > 0) {
    const { data } = await supabase
      .from("village_hunting_notices")
      .select("*")
      .in("village_id", villageIds)
      .order("starts_at", { ascending: false })
      .limit(50);
    wiersze = (data ?? []).map((r) => ({
      id: r.id,
      villageId: r.village_id,
      wiesNazwa: nazwy[r.village_id] ?? "—",
      title: r.title,
      areaDescription: r.area_description,
      safetyNote: r.safety_note,
      contactPhone: r.contact_phone,
      contactName: r.contact_name,
      startsAt: r.starts_at,
      endsAt: r.ends_at,
      status: r.status,
      aktywne: r.status === "approved" && teraz >= new Date(r.starts_at).getTime() && teraz <= new Date(r.ends_at).getTime(),
    }));
  }

  return (
    <PanelStronaSoltysa
      tytul="Polowania — ostrzeżenia"
      opis="Informuj mieszkańców i gości, gdzie i kiedy prowadzone są polowania. Ostrzeżenie jest widoczne na publicznym profilu wsi."
      akcje={
        <a href="/pomoc?rola=mysliwi" className="btn-panel-secondary text-sm">
          Przewodnik myśliwi
        </a>
      }
      dzieci={<SoltysLowiectwoKlient wsie={wsie} wiersze={wiersze} />}
    />
  );
}
