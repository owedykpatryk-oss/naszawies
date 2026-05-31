"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { pobierzCmentarzeZOsmWokolPunktu, pobierzKosciolZOsmWokolPunktu, pobierzOspZOsmWokolPunktu, pobierzPoiZOsmWokolPunktu, type SugerowanyPoiZOsm } from "@/lib/mapa/overpass-poi-dla-punktu";
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

type WynikWstawianiaOsm = {
  ok: true;
  dodano: number;
  pominietoDuplikaty: number;
  odrzuconoBladZapisu: number;
};

async function wstawPunktyOsmDoWsi(
  supabase: Awaited<ReturnType<typeof utworzKlientaSupabaseSerwer>>,
  villageId: string,
  village: { voivodeship: string; county: string; commune: string; slug: string },
  punkty: SugerowanyPoiZOsm[],
): Promise<WynikWstawianiaOsm | { blad: string }> {
  const { data: istniejace, error: errPoi } = await supabase
    .from("pois")
    .select("category, latitude, longitude")
    .eq("village_id", villageId);

  if (errPoi) {
    console.error("[wstawPunktyOsmDoWsi] read pois", errPoi.message);
    return { blad: "Nie udało się odczytać istniejących punktów mapy." };
  }

  const rows: WierszPoiLokalizacja[] = [...(istniejace ?? [])];
  const doWstawienia: {
    village_id: string;
    category: string;
    name: string;
    description: string;
    latitude: number;
    longitude: number;
    source: string;
    confidence: number;
    verified_at: string;
    is_local_override: boolean;
  }[] = [];

  let pominietoDuplikaty = 0;

  for (const pt of punkty) {
    const zaBlisko = rows.some((r) => {
      const rl = Number(r.latitude);
      const ro = Number(r.longitude);
      if (!Number.isFinite(rl) || !Number.isFinite(ro)) return false;
      const prog = pt.category === "cmentarz" ? 180 : 120;
      return r.category === pt.category && odlegloscMetry(rl, ro, pt.lat, pt.lon) < prog;
    });
    if (zaBlisko) {
      pominietoDuplikaty += 1;
      continue;
    }

    doWstawienia.push({
      village_id: villageId,
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
    rows.push({ category: pt.category, latitude: pt.lat, longitude: pt.lon });
  }

  let dodano = 0;
  let odrzuconoBladZapisu = 0;

  if (doWstawienia.length > 0) {
    const { error: insErr } = await supabase.from("pois").insert(doWstawienia);
    if (insErr) {
      console.error("[wstawPunktyOsmDoWsi] batch insert", insErr.message);
      for (const row of doWstawienia) {
        const { error: oneErr } = await supabase.from("pois").insert(row);
        if (oneErr) {
          odrzuconoBladZapisu += 1;
        } else {
          dodano += 1;
        }
      }
    } else {
      dodano = doWstawienia.length;
    }
  }

  if (dodano > 0) {
    revalidatePath("/mapa");
    revalidatePath(sciezkaProfiluWsi(village));
    revalidatePath("/panel/soltys/moja-wies");
  }

  return { ok: true, dodano, pominietoDuplikaty, odrzuconoBladZapisu };
}

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

  const wynik = await wstawPunktyOsmDoWsi(supabase, p.data.villageId, v, osm.punkty);
  if ("blad" in wynik) return wynik;
  return wynik;
}

const schemaCmentarzOsm = z.object({
  villageId: z.string().uuid(),
  promienM: z.coerce.number().min(800).max(8000).optional().default(4000),
});

const schemaCmentarzReczny = z.object({
  villageId: z.string().uuid(),
  name: z.string().trim().min(2).max(200),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  description: z.string().trim().max(800).nullable().optional(),
});

/** Szybki import tylko cmentarzy z OSM (mniejsze zapytanie Overpass). */
export async function dodajCmentarzeZOsm(niesprawdzone: unknown): Promise<WynikOsmPoi> {
  const p = schemaCmentarzOsm.safeParse(niesprawdzone);
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
        "W bazie brak punktu GPS wsi — poproś administratora o uzupełnienie współrzędnych, potem spróbuj ponownie.",
    };
  }

  const osm = await pobierzCmentarzeZOsmWokolPunktu(lat, lon, p.data.promienM);
  if (!osm.ok) {
    return { blad: osm.blad };
  }

  const wynik = await wstawPunktyOsmDoWsi(supabase, p.data.villageId, v, osm.punkty);
  if ("blad" in wynik) return wynik;
  return wynik;
}

const schemaKosciolOsm = z.object({
  villageId: z.string().uuid(),
  promienM: z.coerce.number().min(600).max(8000).optional().default(3500),
});

/** Szybki import kościoła / obiektu kultu z OSM. */
export async function dodajKosciolZOsm(niesprawdzone: unknown): Promise<WynikOsmPoi> {
  const p = schemaKosciolOsm.safeParse(niesprawdzone);
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
        "W bazie brak punktu GPS wsi — poproś administratora o uzupełnienie współrzędnych, potem spróbuj ponownie.",
    };
  }

  const osm = await pobierzKosciolZOsmWokolPunktu(lat, lon, p.data.promienM);
  if (!osm.ok) {
    return { blad: osm.blad };
  }

  const wynik = await wstawPunktyOsmDoWsi(supabase, p.data.villageId, v, osm.punkty);
  if ("blad" in wynik) return wynik;
  return wynik;
}

const schemaOspOsm = z.object({
  villageId: z.string().uuid(),
  promienM: z.coerce.number().min(800).max(8000).optional().default(4000),
});

/** Szybki import remizy / straży z OSM. */
export async function dodajOspZOsm(niesprawdzone: unknown): Promise<WynikOsmPoi> {
  const p = schemaOspOsm.safeParse(niesprawdzone);
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
        "W bazie brak punktu GPS wsi — poproś administratora o uzupełnienie współrzędnych, potem spróbuj ponownie.",
    };
  }

  const osm = await pobierzOspZOsmWokolPunktu(lat, lon, p.data.promienM);
  if (!osm.ok) {
    return { blad: osm.blad };
  }

  const wynik = await wstawPunktyOsmDoWsi(supabase, p.data.villageId, v, osm.punkty);
  if ("blad" in wynik) return wynik;
  return wynik;
}

/** Ręczne dodanie pinezki cmentarza (gdy OSM nie ma obrysu). */
export async function dodajCmentarzRecznie(niesprawdzone: unknown): Promise<WynikDodaniaPunktuWodyOsp> {
  const p = schemaCmentarzReczny.safeParse(niesprawdzone);
  if (!p.success) {
    return { blad: "Sprawdź nazwę i punkt na mapie." };
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

  const { data: village, error: vErr } = await supabase
    .from("villages")
    .select("voivodeship, county, commune, slug")
    .eq("id", p.data.villageId)
    .maybeSingle();
  if (vErr || !village) {
    return { blad: "Nie znaleziono wsi." };
  }

  const opis =
    p.data.description?.trim() ||
    "Cmentarz dodany ręcznie przez sołtysa. Zweryfikuj lokalizację na miejscu.";

  const { error } = await supabase.from("pois").insert({
    village_id: p.data.villageId,
    category: "cmentarz",
    name: p.data.name,
    description: opis,
    latitude: p.data.latitude,
    longitude: p.data.longitude,
    source: "local_corrected",
    confidence: 0.95,
    verified_at: new Date().toISOString(),
    is_local_override: true,
  });

  if (error) {
    console.error("[dodajCmentarzRecznie]", error.message);
    return { blad: "Nie udało się zapisać cmentarza na mapie." };
  }

  revalidatePath("/mapa");
  revalidatePath(sciezkaProfiluWsi(village));
  revalidatePath("/panel/soltys/moja-wies");
  return { ok: true };
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

const schemaWeryfikacjaPoi = z.object({
  poiId: z.string().uuid(),
  name: z.string().trim().min(2).max(200).optional(),
});

export type WynikWeryfikacjiPoi = { ok: true } | { blad: string };

async function wymagajUprawnienDoPoi(poiId: string) {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, blad: "Zaloguj się." };

  const { data: poi, error } = await supabase
    .from("pois")
    .select("id, village_id, source, verified_at, is_local_override")
    .eq("id", poiId)
    .maybeSingle();
  if (error || !poi) return { ok: false as const, blad: "Nie znaleziono punktu na mapie." };

  const vids = await pobierzVillageIdsRoliPaneluSoltysa(supabase, user.id);
  if (!vids.includes(poi.village_id)) {
    return { ok: false as const, blad: "Nie możesz zarządzać mapą tej wsi." };
  }

  const { data: village } = await supabase
    .from("villages")
    .select("voivodeship, county, commune, slug")
    .eq("id", poi.village_id)
    .maybeSingle();

  return { ok: true as const, supabase, poi, village };
}

/** Sołtys zatwierdza automatycznie dodany punkt (OSM / Geoportal). */
export async function zatwierdzPoiAutomatyczny(niesprawdzone: unknown): Promise<WynikWeryfikacjiPoi> {
  const p = schemaWeryfikacjaPoi.safeParse(niesprawdzone);
  if (!p.success) return { blad: "Niepoprawne dane." };

  const auth = await wymagajUprawnienDoPoi(p.data.poiId);
  if (!auth.ok) return { blad: auth.blad };

  const src = auth.poi.source ?? "";
  if (src !== "osm_auto" && src !== "geoportal") {
    return { blad: "Ten punkt nie wymaga zatwierdzenia automatycznego." };
  }

  const aktualizacja: Record<string, unknown> = {
    verified_at: new Date().toISOString(),
    is_local_override: true,
    confidence: 0.92,
    source: "local_corrected",
  };
  if (p.data.name) aktualizacja.name = p.data.name;

  const { error } = await auth.supabase.from("pois").update(aktualizacja).eq("id", p.data.poiId);
  if (error) {
    console.error("[zatwierdzPoiAutomatyczny]", error.message);
    return { blad: "Nie udało się zatwierdzić punktu." };
  }

  revalidatePath("/mapa");
  revalidatePath("/panel/soltys/moja-wies");
  if (auth.village) revalidatePath(sciezkaProfiluWsi(auth.village));
  return { ok: true };
}

/** Sołtys odrzuca błędny punkt z automatycznego importu. */
export async function odrzucPoiAutomatyczny(poiId: string): Promise<WynikWeryfikacjiPoi> {
  const id = z.string().uuid().safeParse(poiId);
  if (!id.success) return { blad: "Niepoprawny identyfikator." };

  const auth = await wymagajUprawnienDoPoi(id.data);
  if (!auth.ok) return { blad: auth.blad };

  const src = auth.poi.source ?? "";
  if (src !== "osm_auto" && src !== "geoportal") {
    return { blad: "Można usunąć tylko niezweryfikowane punkty z importu automatycznego." };
  }
  if (auth.poi.verified_at || auth.poi.is_local_override) {
    return { blad: "Ten punkt został już zatwierdzony — edytuj go ręcznie zamiast usuwać." };
  }

  const { error } = await auth.supabase.from("pois").delete().eq("id", id.data);
  if (error) {
    console.error("[odrzucPoiAutomatyczny]", error.message);
    return { blad: "Nie udało się usunąć punktu." };
  }

  revalidatePath("/mapa");
  revalidatePath("/panel/soltys/moja-wies");
  if (auth.village) revalidatePath(sciezkaProfiluWsi(auth.village));
  return { ok: true };
}

const schemaVillageId = z.object({ villageId: z.string().uuid() });

export type WynikBatchWeryfikacjiPoi =
  | { ok: true; zatwierdzono: number }
  | { blad: string };

/** Zatwierdza do 50 niezweryfikowanych punktów OSM/Geoportal w jednej wsi. */
export async function zatwierdzWszystkiePoiAutomatyczne(villageId: string): Promise<WynikBatchWeryfikacjiPoi> {
  const p = schemaVillageId.safeParse({ villageId });
  if (!p.success) return { blad: "Niepoprawna wieś." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const vids = await pobierzVillageIdsRoliPaneluSoltysa(supabase, user.id);
  if (!vids.includes(p.data.villageId)) {
    return { blad: "Nie możesz zarządzać mapą tej wsi." };
  }

  const { data: doZatwierdzenia, error: errList } = await supabase
    .from("pois")
    .select("id")
    .eq("village_id", p.data.villageId)
    .in("source", ["osm_auto", "geoportal"])
    .is("verified_at", null)
    .eq("is_local_override", false)
    .limit(50);

  if (errList) {
    console.error("[zatwierdzWszystkiePoiAutomatyczne]", errList.message);
    return { blad: "Nie udało się odczytać listy punktów." };
  }

  const ids = (doZatwierdzenia ?? []).map((r) => r.id).filter(Boolean) as string[];
  if (ids.length === 0) return { ok: true, zatwierdzono: 0 };

  const teraz = new Date().toISOString();
  const { error } = await supabase
    .from("pois")
    .update({
      verified_at: teraz,
      is_local_override: true,
      confidence: 0.92,
      source: "local_corrected",
    })
    .in("id", ids);

  if (error) {
    console.error("[zatwierdzWszystkiePoiAutomatyczne] update", error.message);
    return { blad: "Nie udało się zatwierdzić punktów." };
  }

  const { data: village } = await supabase
    .from("villages")
    .select("voivodeship, county, commune, slug")
    .eq("id", p.data.villageId)
    .maybeSingle();

  revalidatePath("/mapa");
  revalidatePath("/panel/soltys/moja-wies");
  if (village) revalidatePath(sciezkaProfiluWsi(village));
  return { ok: true, zatwierdzono: ids.length };
}
