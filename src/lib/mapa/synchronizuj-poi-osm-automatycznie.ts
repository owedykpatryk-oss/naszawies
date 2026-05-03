import type { SupabaseClient } from "@supabase/supabase-js";
import { pobierzPoiZOsmWokolPunktu, type SugerowanyPoiZOsm } from "@/lib/mapa/overpass-poi-dla-punktu";

type VillageRow = {
  id: string;
  name: string;
  latitude: number | string | null;
  longitude: number | string | null;
  population: number | null;
};

type PoiRow = {
  village_id: string;
  category: string;
  latitude: number | string;
  longitude: number | string;
  created_at: string;
  description: string | null;
  source: string | null;
  is_local_override: boolean | null;
};

const KATEGORIE_BAZOWE = ["swietlica", "osp", "sklep", "kosciol", "szkola", "przystanek", "stacja_kolejowa"] as const;

const LIMITY_KATEGORII: Record<string, number> = {
  szkola: 2,
  przedszkole: 2,
  kosciol: 2,
  swietlica: 2,
  osp: 2,
  biblioteka: 2,
  cmentarz: 2,
  przystanek: 4,
  stacja_kolejowa: 2,
  sklep: 4,
};

const LIMITY_DOMYSLNE = {
  maxVillagesScanned: 30,
  maxVillagesPerRun: 3,
  minDaysBetweenSync: 7,
};

type SyncVillageStats = {
  villageId: string;
  villageName: string;
  dodano: number;
  missingBefore: string[];
};

export type PoiAutoSyncSummary = {
  attemptedVillages: number;
  processedVillages: number;
  scannedVillages: number;
  added: number;
  skippedRecentSync: number;
  skippedComplete: number;
  skippedNoCoords: number;
  errors: string[];
  villages: SyncVillageStats[];
};

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

function promienDlaWsi(population: number | null): number {
  if (!population || population <= 0) return 2600;
  return Math.min(6000, Math.max(1800, 1400 + Math.sqrt(population) * 42));
}

function czyOsmOpis(desc: string | null): boolean {
  if (!desc) return false;
  return desc.startsWith("AUTO_OSM_SYNC");
}

function czyPoiZEwidentnieAutomatycznegoOsm(p: PoiRow): boolean {
  if (p.source === "osm_auto") return true;
  return czyOsmOpis(p.description);
}

function czasPoISO(iso: string): number {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

function missingKategorie(rows: PoiRow[]): string[] {
  const set = new Set(rows.map((r) => r.category));
  return KATEGORIE_BAZOWE.filter((k) => !set.has(k));
}

function filtrujKandydatyDoZapisu(
  kandydaci: SugerowanyPoiZOsm[],
  istniejace: PoiRow[],
  missingNaStart: string[],
): SugerowanyPoiZOsm[] {
  const byCategoryCount = new Map<string, number>();
  for (const r of istniejace) {
    byCategoryCount.set(r.category, (byCategoryCount.get(r.category) ?? 0) + 1);
  }

  const missingSet = new Set(missingNaStart);
  const kategorieZLokalnaKorekta = new Set(
    istniejace.filter((p) => p.is_local_override === true).map((p) => p.category),
  );
  const sorted = [...kandydaci].sort((a, b) => {
    const pa = missingSet.has(a.category) ? 0 : 1;
    const pb = missingSet.has(b.category) ? 0 : 1;
    if (pa !== pb) return pa - pb;
    return a.name.localeCompare(b.name, "pl");
  });

  const wybrane: SugerowanyPoiZOsm[] = [];
  for (const p of sorted) {
    // Lokalna korekta ma pierwszeństwo nad automatyką.
    if (kategorieZLokalnaKorekta.has(p.category)) continue;
    const limit = LIMITY_KATEGORII[p.category] ?? 2;
    const cnt = byCategoryCount.get(p.category) ?? 0;
    if (cnt >= limit) continue;

    const zaBliskoIstniejacego = istniejace.some((e) => {
      if (e.category !== p.category) return false;
      const lat = Number(e.latitude);
      const lon = Number(e.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
      return odlegloscMetry(lat, lon, p.lat, p.lon) < 120;
    });
    if (zaBliskoIstniejacego) continue;

    const zaBliskoNowego = wybrane.some((w) => w.category === p.category && odlegloscMetry(w.lat, w.lon, p.lat, p.lon) < 120);
    if (zaBliskoNowego) continue;

    wybrane.push(p);
    byCategoryCount.set(p.category, cnt + 1);
  }
  return wybrane;
}

export async function synchronizujPoiOsmAutomatycznie(
  supabase: SupabaseClient,
  opts?: { maxVillagesPerRun?: number; maxVillagesScanned?: number; minDaysBetweenSync?: number },
): Promise<PoiAutoSyncSummary> {
  const maxVillagesScanned = Math.max(5, opts?.maxVillagesScanned ?? LIMITY_DOMYSLNE.maxVillagesScanned);
  const maxVillagesPerRun = Math.max(1, opts?.maxVillagesPerRun ?? LIMITY_DOMYSLNE.maxVillagesPerRun);
  const minDaysBetweenSync = Math.max(1, opts?.minDaysBetweenSync ?? LIMITY_DOMYSLNE.minDaysBetweenSync);
  const minSyncMs = minDaysBetweenSync * 24 * 60 * 60 * 1000;

  const summary: PoiAutoSyncSummary = {
    attemptedVillages: 0,
    processedVillages: 0,
    scannedVillages: 0,
    added: 0,
    skippedRecentSync: 0,
    skippedComplete: 0,
    skippedNoCoords: 0,
    errors: [],
    villages: [],
  };

  const { data: wsie, error: errWsie } = await supabase
    .from("villages")
    .select("id, name, latitude, longitude, population")
    .eq("is_active", true)
    .order("updated_at", { ascending: true })
    .limit(maxVillagesScanned);

  if (errWsie) {
    throw new Error(`Nie udało się pobrać listy wsi: ${errWsie.message}`);
  }

  const villages = ((wsie ?? []) as VillageRow[]).filter((w) => {
    const lat = Number(w.latitude);
    const lon = Number(w.longitude);
    return Number.isFinite(lat) && Number.isFinite(lon);
  });
  summary.scannedVillages = villages.length;

  const villageIds = villages.map((v) => v.id);
  if (villageIds.length === 0) {
    summary.skippedNoCoords = (wsie ?? []).length;
    return summary;
  }

  const { data: pois, error: errPois } = await supabase
    .from("pois")
    .select("village_id, category, latitude, longitude, created_at, description, source, is_local_override")
    .in("village_id", villageIds);
  if (errPois) {
    throw new Error(`Nie udało się pobrać punktów POI: ${errPois.message}`);
  }

  const byVillage = new Map<string, PoiRow[]>();
  for (const id of villageIds) byVillage.set(id, []);
  for (const p of (pois ?? []) as PoiRow[]) {
    const arr = byVillage.get(p.village_id);
    if (!arr) continue;
    arr.push(p);
  }

  for (const v of villages) {
    if (summary.attemptedVillages >= maxVillagesPerRun) break;

    const lat = Number(v.latitude);
    const lon = Number(v.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      summary.skippedNoCoords += 1;
      continue;
    }

    const existing = byVillage.get(v.id) ?? [];
    const missing = missingKategorie(existing);
    if (missing.length === 0) {
      summary.skippedComplete += 1;
      continue;
    }

    const lastOsmSync = existing
      .filter((p) => czyPoiZEwidentnieAutomatycznegoOsm(p))
      .map((p) => czasPoISO(p.created_at))
      .reduce((a, b) => Math.max(a, b), 0);
    if (lastOsmSync > 0 && Date.now() - lastOsmSync < minSyncMs) {
      summary.skippedRecentSync += 1;
      continue;
    }

    summary.attemptedVillages += 1;
    const promien = promienDlaWsi(v.population);
    const osm = await pobierzPoiZOsmWokolPunktu(lat, lon, promien);
    if (!osm.ok) {
      summary.errors.push(`${v.name}: ${osm.blad}`);
      continue;
    }

    const doZapisu = filtrujKandydatyDoZapisu(osm.punkty, existing, missing);
    if (doZapisu.length === 0) {
      continue;
    }

    const { error: insertErr } = await supabase.from("pois").insert(
      doZapisu.map((p) => ({
        village_id: v.id,
        category: p.category,
        name: p.name,
        description: `AUTO_OSM_SYNC v1 (${p.osmType} ${p.osmId}). Zweryfikuj lokalnie: dane OSM mogą być niepełne.`,
        latitude: p.lat,
        longitude: p.lon,
        source: "osm_auto",
        confidence: 0.45,
        verified_at: null,
        is_local_override: false,
      })),
    );

    if (insertErr) {
      summary.errors.push(`${v.name}: insert ${insertErr.message}`);
      continue;
    }

    summary.processedVillages += 1;
    summary.added += doZapisu.length;
    summary.villages.push({
      villageId: v.id,
      villageName: v.name,
      dodano: doZapisu.length,
      missingBefore: missing,
    });
  }

  return summary;
}
