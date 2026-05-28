import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PanelStronaSoltysa } from "@/components/panel/panel-strona-soltysa";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { SoltysLowiectwoKlient, type WierszOstrzezenia, type WiesGeoLowiectwo } from "./soltys-lowiectwo-klient";

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
  const wsie: WiesGeoLowiectwo[] = [];
  const nazwy: Record<string, string> = {};
  if (villageIds.length > 0) {
    const { data: vs } = await supabase
      .from("villages")
      .select("id, name, latitude, longitude, boundary_geojson")
      .in("id", villageIds);
    for (const v of vs ?? []) {
      const lat = Number(v.latitude);
      const lon = Number(v.longitude);
      wsie.push({
        id: v.id,
        name: v.name,
        lat: Number.isFinite(lat) ? lat : 52.1,
        lon: Number.isFinite(lon) ? lon : 19.3,
        boundaryGeojson: v.boundary_geojson ?? null,
      });
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
      maObszarMapy: r.area_geojson != null,
    }));
  }

  return (
    <PanelStronaSoltysa
      tytul="Polowania — ostrzeżenia"
      opis="Zaznacz obszar na mapie i ustaw termin — mieszkańcy zobaczą to na mapie naszawies i na profilu wsi."
      akcje={
        <>
          <a href="/panel/soltys/spolecznosc?tryb=mysliwi" className="btn-panel-secondary text-sm">
            Profil koła
          </a>
          <a href="/pomoc?rola=mysliwi" className="btn-panel-secondary text-sm">
            Przewodnik myśliwi
          </a>
        </>
      }
      dzieci={<SoltysLowiectwoKlient wsie={wsie} wiersze={wiersze} />}
    />
  );
}
