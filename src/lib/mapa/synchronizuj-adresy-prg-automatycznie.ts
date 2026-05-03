import type { SupabaseClient } from "@supabase/supabase-js";
import { pobierzAdresyWsiZPrgWfs } from "@/lib/geoportal/prg-address-wfs-client";

type VillageRow = {
  id: string;
  name: string;
  teryt_id: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  population: number | null;
};

type SyncStateRow = {
  village_id: string;
  last_address_sync_at: string | null;
};

type AddressSyncStateUpsert = {
  village_id: string;
  last_address_sync_at: string | null;
  last_status: "success" | "error";
  last_error_message: string | null;
  last_source_name: string | null;
  last_source_type_name: string | null;
  last_synced_points_count: number | null;
  updated_at: string;
};

export type PrgAddressSyncSummary = {
  attemptedVillages: number;
  processedVillages: number;
  scannedVillages: number;
  upsertedPoints: number;
  skippedRecentSync: number;
  skippedMissingTeryt: number;
  skippedNoCoords: number;
  errors: string[];
};

function parseIntEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name]?.trim();
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function msFromIso(iso: string | null | undefined): number {
  if (!iso) return 0;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

function radiusForVillage(population: number | null): number {
  if (!population || population <= 0) return 2600;
  return Math.min(9000, Math.max(1800, 1200 + Math.sqrt(population) * 55));
}

export async function synchronizujAdresyPrgAutomatycznie(supabase: SupabaseClient): Promise<PrgAddressSyncSummary> {
  const maxPerRun = parseIntEnv("GEOPORTAL_ADDRESS_SYNC_VILLAGES_PER_RUN", 1, 1, 20);
  const maxScanned = parseIntEnv("GEOPORTAL_ADDRESS_SYNC_VILLAGES_SCANNED", 10, 3, 200);
  const minDays = parseIntEnv("GEOPORTAL_ADDRESS_SYNC_MIN_DAYS", 30, 1, 180);
  const minSyncMs = minDays * 24 * 60 * 60 * 1000;

  const summary: PrgAddressSyncSummary = {
    attemptedVillages: 0,
    processedVillages: 0,
    scannedVillages: 0,
    upsertedPoints: 0,
    skippedRecentSync: 0,
    skippedMissingTeryt: 0,
    skippedNoCoords: 0,
    errors: [],
  };

  const { data: wsie, error: errWsie } = await supabase
    .from("villages")
    .select("id, name, teryt_id, latitude, longitude, population")
    .eq("is_active", true)
    .order("updated_at", { ascending: true })
    .limit(maxScanned);
  if (errWsie) {
    throw new Error(`Nie udało się pobrać listy wsi do sync adresów: ${errWsie.message}`);
  }

  const villages = (wsie ?? []) as VillageRow[];
  summary.scannedVillages = villages.length;
  if (villages.length === 0) return summary;

  const ids = villages.map((v) => v.id);
  const { data: syncRows, error: errSyncRows } = await supabase
    .from("geoportal_address_sync_state")
    .select("village_id, last_address_sync_at")
    .in("village_id", ids);
  if (errSyncRows) {
    throw new Error(`Nie udało się odczytać stanu sync adresów: ${errSyncRows.message}`);
  }

  const syncByVillage = new Map<string, SyncStateRow>();
  for (const row of (syncRows ?? []) as SyncStateRow[]) {
    syncByVillage.set(row.village_id, row);
  }

  for (const village of villages) {
    if (summary.attemptedVillages >= maxPerRun) break;
    if (!village.teryt_id) {
      summary.skippedMissingTeryt += 1;
      continue;
    }
    const lat = Number(village.latitude);
    const lon = Number(village.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      summary.skippedNoCoords += 1;
      continue;
    }

    const state = syncByVillage.get(village.id);
    const lastMs = msFromIso(state?.last_address_sync_at);
    if (lastMs > 0 && Date.now() - lastMs < minSyncMs) {
      summary.skippedRecentSync += 1;
      continue;
    }

    summary.attemptedVillages += 1;
    const radius = radiusForVillage(village.population);
    const wynik = await pobierzAdresyWsiZPrgWfs(village.teryt_id, lat, lon, radius);
    const nowIso = new Date().toISOString();

    if (!wynik.ok) {
      summary.errors.push(`${village.name}: ${wynik.reason}`);
      const syncUpdate: AddressSyncStateUpsert = {
        village_id: village.id,
        last_address_sync_at: nowIso,
        last_status: "error",
        last_error_message: wynik.reason.slice(0, 1000),
        last_source_name: null,
        last_source_type_name: null,
        last_synced_points_count: null,
        updated_at: nowIso,
      };
      await supabase.from("geoportal_address_sync_state").upsert(syncUpdate);
      continue;
    }

    const payload = wynik.points.map((p) => ({
      village_id: village.id,
      teryt_simc: p.terytSimc,
      teryt_ulic: p.terytUlic,
      street_name: p.streetName,
      house_number: p.houseNumber,
      postal_code: p.postalCode,
      source_name: "PRG_WFS",
      source_external_id: p.sourceExternalId,
      location_geom: p.locationGeom,
      latitude: p.latitude,
      longitude: p.longitude,
      raw_payload: p.rawPayload,
      updated_at: nowIso,
    }));

    if (payload.length > 0) {
      const { error: upsertErr } = await supabase
        .from("address_points")
        .upsert(payload, { onConflict: "village_id,source_name,source_external_id" });
      if (upsertErr) {
        summary.errors.push(`${village.name}: upsert address_points ${upsertErr.message}`);
        const syncUpdate: AddressSyncStateUpsert = {
          village_id: village.id,
          last_address_sync_at: nowIso,
          last_status: "error",
          last_error_message: `upsert address_points: ${upsertErr.message}`.slice(0, 1000),
          last_source_name: wynik.sourceName,
          last_source_type_name: wynik.sourceTypeName,
          last_synced_points_count: null,
          updated_at: nowIso,
        };
        await supabase.from("geoportal_address_sync_state").upsert(syncUpdate);
        continue;
      }
    }

    const syncUpdate: AddressSyncStateUpsert = {
      village_id: village.id,
      last_address_sync_at: nowIso,
      last_status: "success",
      last_error_message: null,
      last_source_name: wynik.sourceName,
      last_source_type_name: wynik.sourceTypeName,
      last_synced_points_count: payload.length,
      updated_at: nowIso,
    };
    await supabase.from("geoportal_address_sync_state").upsert(syncUpdate);

    summary.processedVillages += 1;
    summary.upsertedPoints += payload.length;
  }

  return summary;
}
