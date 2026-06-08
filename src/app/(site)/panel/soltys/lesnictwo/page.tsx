import type { Metadata } from "next";
import { PanelStronaSoltysa } from "@/components/panel/panel-strona-soltysa";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzUzytkownikaPanelu } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { czyRodzajOstrzezeniaLesnego } from "@/lib/lesnictwo/kategorie-ostrzezen";
import {
  SoltysLesnictwoKlient,
  type ProfilLesnictwaWiersz,
  type WierszOstrzezeniaLesnego,
  type WiesGeoLesnictwo,
} from "./soltys-lesnictwo-klient";

export const metadata: Metadata = {
  title: "Leśnictwo i las",
};

export default async function SoltysLesnictwoPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const user = await pobierzUzytkownikaPanelu();

  const villageIds = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  const wsie: WiesGeoLesnictwo[] = [];
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
  let wiersze: WierszOstrzezeniaLesnego[] = [];
  let profile: ProfilLesnictwaWiersz[] = [];

  if (villageIds.length > 0) {
    const [{ data: notices }, { data: profiles }] = await Promise.all([
      supabase
        .from("village_forestry_notices")
        .select("*")
        .in("village_id", villageIds)
        .order("starts_at", { ascending: false })
        .limit(50),
      supabase.from("village_forestry_profiles").select("village_id, profile_data, is_published").in("village_id", villageIds),
    ]);

    wiersze = (notices ?? []).map((r) => {
      const kind = String(r.notice_kind ?? "inne");
      return {
        id: r.id,
        villageId: r.village_id,
        wiesNazwa: nazwy[r.village_id] ?? "—",
        noticeKind: czyRodzajOstrzezeniaLesnego(kind) ? kind : "inne",
        title: r.title,
        areaDescription: r.area_description,
        safetyNote: r.safety_note,
        contactPhone: r.contact_phone,
        contactName: r.contact_name,
        startsAt: r.starts_at,
        endsAt: r.ends_at,
        status: r.status,
        aktywne:
          r.status === "approved" &&
          teraz >= new Date(r.starts_at).getTime() &&
          teraz <= new Date(r.ends_at).getTime(),
        maObszarMapy: r.area_geojson != null,
      };
    });

    profile = (profiles ?? []).map((p) => ({
      villageId: p.village_id,
      profileData: p.profile_data,
      isPublished: p.is_published,
    }));
  }

  return (
    <PanelStronaSoltysa
      tytul="Leśnictwo i las"
      opis="Profil leśny wsi, zakazy wstępu, wycinki i inne ostrzeżenia — mieszkańcy zobaczą je na profilu i mapie."
      akcje={
        <>
          <a href="/mapa?lesnictwa=1&ostrzezenia_lesne=1" className="btn-panel-secondary text-sm">
            Podgląd mapy
          </a>
          <a href="/panel/soltys/lowiectwo" className="btn-panel-secondary text-sm">
            Polowania
          </a>
        </>
      }
      dzieci={<SoltysLesnictwoKlient wsie={wsie} wiersze={wiersze} profile={profile} />}
    />
  );
}
