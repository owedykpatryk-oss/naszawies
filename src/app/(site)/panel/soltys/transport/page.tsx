import type { Metadata } from "next";
import { PanelStronaSoltysa } from "@/components/panel/panel-strona-soltysa";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzUzytkownikaPanelu } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { pobierzStanSyncTransportuDlaWsi } from "@/lib/transport/pobierz-stan-sync-transportu";
import { epodroznikSkonfigurowany } from "@/lib/transport/epodroznik-api";
import { gtfsCsvSkonfigurowany } from "@/lib/transport/gtfs-csv";
import { SoltysTransportKlient, type WierszStacji } from "./soltys-transport-klient";

export const metadata: Metadata = {
  title: "Transport — stacje PKP",
};

export default async function SoltysTransportPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const user = await pobierzUzytkownikaPanelu();

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

  const syncStan =
    villageIds.length > 0 ? await pobierzStanSyncTransportuDlaWsi(villageIds) : {};

  let stacje: WierszStacji[] = [];
  if (villageIds.length > 0) {
    const { data } = await supabase
      .from("village_transport_stations")
      .select(
        "id, village_id, station_id, station_name, station_name_source, distance_km, is_manual_override, poi_id, pois(name)",
      )
      .in("village_id", villageIds)
      .eq("is_active", true)
      .order("distance_km", { ascending: true });

    stacje = (data ?? []).map((r) => {
      const poi = Array.isArray(r.pois) ? r.pois[0] : r.pois;
      return {
        id: r.id,
        villageId: r.village_id,
        wiesNazwa: nazwy[r.village_id] ?? "—",
        stationId: r.station_id,
        stationName: r.station_name,
        stationNameSource: r.station_name_source,
        distanceKm: r.distance_km != null ? Number(r.distance_km) : null,
        isManualOverride: Boolean(r.is_manual_override),
        poiName: poi && typeof poi === "object" && "name" in poi ? String(poi.name) : null,
      };
    });
  }

  return (
    <PanelStronaSoltysa
      tytul="Transport — mapowanie stacji"
      opis={
        <>
          Kolej (PKP): synchronizacja wymaga <code className="text-xs">PKP_PLK_API_KEY</code> i{" "}
          <code className="text-xs">TRANSPORT_SYNC_ENABLED=1</code>. Autobusy:{" "}
          {gtfsCsvSkonfigurowany() ? (
            <span className="text-emerald-800">GTFS CSV włączone</span>
          ) : epodroznikSkonfigurowany() ? (
            <span className="text-emerald-800">e-podróżnik API włączone</span>
          ) : (
            <span>linki zewnętrzne (brak API autobusów)</span>
          )}
          .
        </>
      }
      dzieci={
        <div className="mt-4">
          <SoltysTransportKlient wsie={wsie} stacje={stacje} syncStan={syncStan} />
        </div>
      }
    />
  );
}
