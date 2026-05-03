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

const schemaPunktCzerpaniaWodyOsp = z.object({
  villageId: z.string().uuid(),
  name: z.string().trim().min(3).max(200),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  sourceType: z.enum(["hydrant", "staw", "zbiornik", "rzeka", "inne"]),
  capacityLpm: z.coerce.number().int().min(0).max(50000).nullable().optional(),
  winterAccess: z.boolean().optional().default(false),
  heavyTruckAccess: z.boolean().optional().default(false),
  note: z.string().trim().max(1200).nullable().optional(),
});

export type WynikDodaniaPunktuWodyOsp = { ok: true } | { blad: string };

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

export async function dodajPunktCzerpaniaWodyOsp(
  niesprawdzone: unknown,
): Promise<WynikDodaniaPunktuWodyOsp> {
  const p = schemaPunktCzerpaniaWodyOsp.safeParse(niesprawdzone);
  if (!p.success) {
    return { blad: "Sprawdź dane punktu czerpania wody OSP." };
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
    return { blad: "Nie możesz zarządzać mapą tej wsi." };
  }

  const sourceLabelMap: Record<"hydrant" | "staw" | "zbiornik" | "rzeka" | "inne", string> = {
    hydrant: "Hydrant",
    staw: "Staw",
    zbiornik: "Zbiornik",
    rzeka: "Rzeka / ciek",
    inne: "Inne",
  };

  const detale = [
    `Typ źródła: ${sourceLabelMap[p.data.sourceType]}`,
    p.data.capacityLpm != null ? `Wydajność orientacyjna: ${p.data.capacityLpm} l/min` : null,
    `Dostęp zimą: ${p.data.winterAccess ? "tak" : "nie/ograniczony"}`,
    `Dojazd ciężkim wozem: ${p.data.heavyTruckAccess ? "tak" : "nie/utrudniony"}`,
    p.data.note?.trim() ? `Uwagi: ${p.data.note.trim()}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  const { data: village, error: vErr } = await supabase
    .from("villages")
    .select("voivodeship, county, commune, slug")
    .eq("id", p.data.villageId)
    .maybeSingle();
  if (vErr || !village) {
    return { blad: "Nie znaleziono wsi." };
  }

  const { error } = await supabase.from("pois").insert({
    village_id: p.data.villageId,
    category: "osp_punkt_czerpania_wody",
    name: p.data.name,
    description: detale,
    latitude: p.data.latitude,
    longitude: p.data.longitude,
    source: "local_corrected",
    confidence: 0.95,
    verified_at: new Date().toISOString(),
    is_local_override: true,
    osp_water_source_type: p.data.sourceType,
    osp_water_capacity_lpm: p.data.capacityLpm ?? null,
    osp_winter_access: p.data.winterAccess,
    osp_heavy_truck_access: p.data.heavyTruckAccess,
    osp_note: p.data.note?.trim() || null,
  });

  if (error) {
    console.error("[dodajPunktCzerpaniaWodyOsp]", error.message);
    return { blad: "Nie udało się zapisać punktu czerpania wody OSP." };
  }

  revalidatePath("/mapa");
  revalidatePath(sciezkaProfiluWsi(village));
  revalidatePath("/panel/soltys/moja-wies");
  revalidatePath("/panel/mieszkaniec/zgloszenia");
  return { ok: true };
}
