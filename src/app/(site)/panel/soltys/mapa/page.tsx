import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PanelStronaSoltysa } from "@/components/panel/panel-strona-soltysa";
import {
  EdytorMapyPoiSoltys,
  type PoiNaMapieEdycja,
  type WiesDoMapyEdycji,
} from "@/components/panel/edytor-mapy-poi-soltys";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

export const metadata: Metadata = {
  title: "Edytor mapy wsi",
};

export default async function SoltysMapaPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) redirect("/logowanie?next=/panel/soltys/mapa");

  const villageIds = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  if (villageIds.length === 0) {
    return (
      <PanelStronaSoltysa
        tytul="Mapa wsi"
        opis="Brak przypisanej wsi."
        dzieci={null}
      />
    );
  }

  const [{ data: wsieRaw }, { data: poisRaw }] = await Promise.all([
    supabase
      .from("villages")
      .select("id, name, latitude, longitude, boundary_geojson")
      .in("id", villageIds)
      .order("name"),
    supabase
      .from("pois")
      .select("id, village_id, name, category, latitude, longitude, source, description")
      .in("village_id", villageIds)
      .order("category")
      .order("name"),
  ]);

  const wsie: WiesDoMapyEdycji[] = (wsieRaw ?? []).map((v) => {
    const lat = Number(v.latitude);
    const lon = Number(v.longitude);
    return {
      id: v.id,
      name: v.name,
      lat: Number.isFinite(lat) ? lat : 52.1,
      lon: Number.isFinite(lon) ? lon : 19.3,
      boundaryGeojson: v.boundary_geojson ?? null,
    };
  });

  const poisByVillage: Record<string, PoiNaMapieEdycja[]> = {};
  for (const id of villageIds) poisByVillage[id] = [];
  for (const p of poisRaw ?? []) {
    const lista = poisByVillage[p.village_id];
    if (!lista) continue;
    lista.push({
      id: p.id,
      villageId: p.village_id,
      name: p.name,
      category: p.category,
      latitude: Number(p.latitude),
      longitude: Number(p.longitude),
      source: p.source ?? null,
      description: p.description,
    });
  }

  return (
    <PanelStronaSoltysa
      tytul="Mapa wsi — pinezki"
      opis="Kliknij na mapie lub satelicie, aby dodać przystanek, sklep, kościół… Bez wpisywania współrzędnych."
      szeroki
      akcje={
        <>
          <Link href="/mapa" target="_blank" className="btn-panel-secondary text-sm">
            Mapa publiczna ↗
          </Link>
          <Link href="/panel/soltys/moja-wies" className="btn-panel-secondary text-sm">
            Profil wsi
          </Link>
        </>
      }
      dzieci={<EdytorMapyPoiSoltys wsie={wsie} poisByVillage={poisByVillage} />}
    />
  );
}
