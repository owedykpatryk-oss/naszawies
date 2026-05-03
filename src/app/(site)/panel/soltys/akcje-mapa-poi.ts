"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { pobierzPoiZOsmWokolPunktu } from "@/lib/mapa/overpass-poi-dla-punktu";
import { pobierzVillageIdsRoliPaneluSoltysa } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

const schemaOsmPoi = z.object({
  villageId: z.string().uuid(),
  promienM: z.coerce.number().min(400).max(8000).optional().default(2800),
});

export type WynikOsmPoi =
  | { ok: true; dodano: number; pominietoDuplikaty: number; odrzuconoBladZapisu: number }
  | { blad: string };

function odlegloscMetry(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

type WierszPoiLokalizacja = { category: string; latitude: string | number; longitude: string | number };

/**
 * Dopisuje do `pois` obiekty z OpenStreetMap w promieniu od punktu GPS wsi.
 * Pomija punkty, które w bazie są już w tej samej kategorii w odległości ok. 120 m.
 */
export async function dodajBrakujacePoiZOpenStreetMap(niesprawdzone: unknown): Promise<WynikOsmPoi> {
  const p = schemaOsmPoi.safeParse(niesprawdzone);
  if (!p.success) {
    return { blad: "Niepoprawne parametry zapytania." };
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { blad: "Zaloguj się." };
  }

  const vids = await pobierzVillageIdsRoliPaneluSoltysa(supabase, user.id);
  if (!vids.includes(p.data.villageId)) {
    return { blad: "Nie możesz zarządzać punktami mapy dla tej wsi." };
  }

  const { data: v, error } = await supabase
    .from("villages")
    .select("id, latitude, longitude, voivodeship, county, commune, slug")
    .eq("id", p.data.villageId)
    .maybeSingle();

  if (error || !v) {
    return { blad: "Nie znaleziono wsi." };
  }

  const lat = v.latitude != null ? Number(v.latitude) : NaN;
  const lon = v.longitude != null ? Number(v.longitude) : NaN;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return {
      blad:
        "W bazie brak punktu GPS wsi (szerokość / długość). Bez tego mapa i import z OSM nie mają odniesienia — poproś administratora platformy o uzupełnienie współrzędnych wsi.",
    };
  }

  const osm = await pobierzPoiZOsmWokolPunktu(lat, lon, p.data.promienM);
  if (!osm.ok) {
    return { blad: osm.blad };
  }

  const { data: istniejace, error: errPoi } = await supabase
    .from("pois")
    .select("category, latitude, longitude")
    .eq("village_id", p.data.villageId);

  if (errPoi) {
    console.error("[dodajBrakujacePoiZOpenStreetMap] read pois", errPoi.message);
    return { blad: "Nie udało się odczytać istniejących punktów mapy." };
  }

  const rows: WierszPoiLokalizacja[] = [...(istniejace ?? [])];
  let dodano = 0;
  let pominietoDuplikaty = 0;
  let odrzuconoBladZapisu = 0;

  for (const pt of osm.punkty) {
    const zaBlisko = rows.some((r) => {
      const rl = Number(r.latitude);
      const ro = Number(r.longitude);
      if (!Number.isFinite(rl) || !Number.isFinite(ro)) return false;
      return r.category === pt.category && odlegloscMetry(rl, ro, pt.lat, pt.lon) < 120;
    });
    if (zaBlisko) {
      pominietoDuplikaty += 1;
      continue;
    }

    const { error: insErr } = await supabase.from("pois").insert({
      village_id: p.data.villageId,
      category: pt.category,
      name: pt.name.slice(0, 200),
      description: `Dane z OpenStreetMap (${pt.osmType} ${pt.osmId}). Zweryfikuj na miejscu — społecznościowa mapa bywa niekompletna lub nieaktualna.`,
      latitude: pt.lat,
      longitude: pt.lon,
      source: "osm_manual",
      confidence: 0.8,
      verified_at: new Date().toISOString(),
      is_local_override: true,
    });

    if (insErr) {
      console.error("[dodajBrakujacePoiZOpenStreetMap] insert", insErr.message);
      odrzuconoBladZapisu += 1;
      continue;
    }

    dodano += 1;
    rows.push({ category: pt.category, latitude: pt.lat, longitude: pt.lon });
  }

  revalidatePath("/mapa");
  revalidatePath(sciezkaProfiluWsi(v));
  revalidatePath("/panel/soltys/moja-wies");

  return { ok: true, dodano, pominietoDuplikaty, odrzuconoBladZapisu };
}
