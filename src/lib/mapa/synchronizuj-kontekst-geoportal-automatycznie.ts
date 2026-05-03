import type { SupabaseClient } from "@supabase/supabase-js";
import { pobierzPrngWokolWsi } from "@/lib/geoportal/prng-wfs-client";
import { pobierzWarstwyInstytucjonalnePrgWokolWsi } from "@/lib/geoportal/prg-institutional-wfs-client";

type VillageRow = {
  id: string;
  name: string;
  latitude: number | string | null;
  longitude: number | string | null;
  population: number | null;
};

type SyncStateRow = { village_id: string; last_sync_at: string | null };

type SyncStateUpsert = {
  village_id: string;
  last_sync_at: string | null;
  last_status: "success" | "error";
  last_error_message: string | null;
  last_source_name: string | null;
  last_source_type_name: string | null;
  last_synced_features_count: number | null;
  updated_at: string;
};

export type GeoportalContextSyncSummary = {
  attemptedVillages: number;
  processedVillages: number;
  scannedVillages: number;
  upsertedPrng: number;
  upsertedInstitutional: number;
  skippedRecentSync: number;
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
  if (!population || population <= 0) return 6000;
  return Math.min(30000, Math.max(5000, 3000 + Math.sqrt(population) * 120));
}

async function readSyncState(
  supabase: SupabaseClient,
  table: "geoportal_prng_sync_state" | "geoportal_institutional_sync_state",
  ids: string[],
): Promise<Map<string, SyncStateRow>> {
  const out = new Map<string, SyncStateRow>();
  if (ids.length === 0) return out;
  const { data, error } = await supabase.from(table).select("village_id,last_sync_at").in("village_id", ids);
  if (error) throw new Error(`Nie udało się odczytać ${table}: ${error.message}`);
  for (const r of (data ?? []) as SyncStateRow[]) out.set(r.village_id, r);
  return out;
}

async function upsertSyncState(
  supabase: SupabaseClient,
  table: "geoportal_prng_sync_state" | "geoportal_institutional_sync_state",
  row: SyncStateUpsert,
) {
  await supabase.from(table).upsert(row);
}

export async function synchronizujKontekstGeoportalAutomatycznie(
  supabase: SupabaseClient,
): Promise<GeoportalContextSyncSummary> {
  const maxPerRun = parseIntEnv("GEOPORTAL_CONTEXT_SYNC_VILLAGES_PER_RUN", 1, 1, 20);
  const maxScanned = parseIntEnv("GEOPORTAL_CONTEXT_SYNC_VILLAGES_SCANNED", 8, 3, 120);
  const minDays = parseIntEnv("GEOPORTAL_CONTEXT_SYNC_MIN_DAYS", 21, 1, 180);
  const minSyncMs = minDays * 24 * 60 * 60 * 1000;

  const summary: GeoportalContextSyncSummary = {
    attemptedVillages: 0,
    processedVillages: 0,
    scannedVillages: 0,
    upsertedPrng: 0,
    upsertedInstitutional: 0,
    skippedRecentSync: 0,
    skippedNoCoords: 0,
    errors: [],
  };

  const { data: wsie, error: errWsie } = await supabase
    .from("villages")
    .select("id,name,latitude,longitude,population")
    .eq("is_active", true)
    .order("updated_at", { ascending: true })
    .limit(maxScanned);
  if (errWsie) throw new Error(`Nie udało się pobrać wsi do sync kontekstu: ${errWsie.message}`);
  const villages = (wsie ?? []) as VillageRow[];
  summary.scannedVillages = villages.length;
  if (villages.length === 0) return summary;

  const ids = villages.map((v) => v.id);
  const statePrng = await readSyncState(supabase, "geoportal_prng_sync_state", ids);
  const stateInst = await readSyncState(supabase, "geoportal_institutional_sync_state", ids);

  for (const village of villages) {
    if (summary.attemptedVillages >= maxPerRun) break;
    const lat = Number(village.latitude);
    const lon = Number(village.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      summary.skippedNoCoords += 1;
      continue;
    }

    const stP = statePrng.get(village.id);
    const stI = stateInst.get(village.id);
    const recentP = msFromIso(stP?.last_sync_at) > 0 && Date.now() - msFromIso(stP?.last_sync_at) < minSyncMs;
    const recentI = msFromIso(stI?.last_sync_at) > 0 && Date.now() - msFromIso(stI?.last_sync_at) < minSyncMs;
    if (recentP && recentI) {
      summary.skippedRecentSync += 1;
      continue;
    }

    summary.attemptedVillages += 1;
    const radius = radiusForVillage(village.population);
    const nowIso = new Date().toISOString();

    if (!recentP) {
      const prng = await pobierzPrngWokolWsi(lat, lon, radius);
      if (!prng.ok) {
        summary.errors.push(`${village.name} PRNG: ${prng.reason}`);
        await upsertSyncState(supabase, "geoportal_prng_sync_state", {
          village_id: village.id,
          last_sync_at: nowIso,
          last_status: "error",
          last_error_message: prng.reason.slice(0, 1000),
          last_source_name: null,
          last_source_type_name: null,
          last_synced_features_count: null,
          updated_at: nowIso,
        });
      } else {
        const payload = prng.features.map((f) => ({
          village_id: village.id,
          dataset: "PRNG",
          layer_name: prng.sourceTypeName,
          feature_category: f.featureCategory,
          feature_name: f.featureName,
          source_external_id: f.sourceExternalId,
          latitude: f.latitude,
          longitude: f.longitude,
          geometry: f.geometry,
          raw_payload: f.rawPayload,
          updated_at: nowIso,
        }));
        if (payload.length > 0) {
          const { error: upErr } = await supabase
            .from("geo_context_features")
            .upsert(payload, { onConflict: "village_id,dataset,layer_name,source_external_id" });
          if (upErr) {
            summary.errors.push(`${village.name} PRNG upsert: ${upErr.message}`);
          } else {
            summary.upsertedPrng += payload.length;
          }
        }
        await upsertSyncState(supabase, "geoportal_prng_sync_state", {
          village_id: village.id,
          last_sync_at: nowIso,
          last_status: "success",
          last_error_message: null,
          last_source_name: prng.sourceName,
          last_source_type_name: prng.sourceTypeName,
          last_synced_features_count: payload.length,
          updated_at: nowIso,
        });
      }
    }

    if (!recentI) {
      const inst = await pobierzWarstwyInstytucjonalnePrgWokolWsi(lat, lon, radius);
      if (!inst.ok) {
        summary.errors.push(`${village.name} INST: ${inst.reason}`);
        await upsertSyncState(supabase, "geoportal_institutional_sync_state", {
          village_id: village.id,
          last_sync_at: nowIso,
          last_status: "error",
          last_error_message: inst.reason.slice(0, 1000),
          last_source_name: null,
          last_source_type_name: null,
          last_synced_features_count: null,
          updated_at: nowIso,
        });
      } else {
        const payload = inst.features.map((f) => ({
          village_id: village.id,
          dataset: "PRG_INSTITUTIONAL",
          layer_name: f.layerName,
          feature_category: f.featureCategory,
          feature_name: f.featureName,
          source_external_id: f.sourceExternalId,
          latitude: f.latitude,
          longitude: f.longitude,
          geometry: f.geometry,
          raw_payload: f.rawPayload,
          updated_at: nowIso,
        }));
        if (payload.length > 0) {
          const { error: upErr } = await supabase
            .from("geo_context_features")
            .upsert(payload, { onConflict: "village_id,dataset,layer_name,source_external_id" });
          if (upErr) {
            summary.errors.push(`${village.name} INST upsert: ${upErr.message}`);
          } else {
            summary.upsertedInstitutional += payload.length;
          }
        }
        await upsertSyncState(supabase, "geoportal_institutional_sync_state", {
          village_id: village.id,
          last_sync_at: nowIso,
          last_status: "success",
          last_error_message: null,
          last_source_name: inst.sourceName,
          last_source_type_name: inst.sourceTypeName,
          last_synced_features_count: payload.length,
          updated_at: nowIso,
        });
      }
    }

    summary.processedVillages += 1;
  }

  return summary;
}
