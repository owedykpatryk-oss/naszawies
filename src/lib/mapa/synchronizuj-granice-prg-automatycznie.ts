import type { SupabaseClient } from "@supabase/supabase-js";
import { pobierzGraniceWsiZPrgWfs } from "@/lib/geoportal/prg-wfs-client";

type VillageRow = {
  id: string;
  name: string;
  teryt_id: string | null;
  boundary_geojson: unknown | null;
  latitude: number | null;
  longitude: number | null;
};

type SyncStateRow = {
  village_id: string;
  last_boundary_sync_at: string | null;
};

type SyncStateUpsert = {
  village_id: string;
  last_boundary_sync_at: string | null;
  last_status: "success" | "error";
  last_error_message: string | null;
  last_source_name: string | null;
  last_source_type_name: string | null;
  updated_at: string;
};

export type PrgBoundarySyncSummary = {
  attemptedVillages: number;
  processedVillages: number;
  scannedVillages: number;
  updatedBoundaries: number;
  skippedAlreadyHasBoundary: number;
  skippedRecentSync: number;
  skippedMissingTeryt: number;
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

export async function synchronizujGranicePrgAutomatycznie(supabase: SupabaseClient): Promise<PrgBoundarySyncSummary> {
  const maxPerRun = parseIntEnv("GEOPORTAL_BOUNDARY_SYNC_VILLAGES_PER_RUN", 2, 1, 20);
  const maxScanned = parseIntEnv("GEOPORTAL_BOUNDARY_SYNC_VILLAGES_SCANNED", 20, 5, 200);
  const minDays = parseIntEnv("GEOPORTAL_BOUNDARY_SYNC_MIN_DAYS", 30, 1, 180);
  const forceRefresh = process.env.GEOPORTAL_BOUNDARY_FORCE_REFRESH?.trim() === "1";
  const minSyncMs = minDays * 24 * 60 * 60 * 1000;

  const summary: PrgBoundarySyncSummary = {
    attemptedVillages: 0,
    processedVillages: 0,
    scannedVillages: 0,
    updatedBoundaries: 0,
    skippedAlreadyHasBoundary: 0,
    skippedRecentSync: 0,
    skippedMissingTeryt: 0,
    errors: [],
  };

  /** Bez force: tylko brakujące granice, kolejka „żywe wsie” (RPC). Przy force — ponowny PRG także tam, gdzie już jest granica. */
  const { data: wsie, error: errWsie } = forceRefresh
    ? await supabase
        .from("villages")
        .select("id, name, teryt_id, boundary_geojson, latitude, longitude")
        .eq("is_active", true)
        .order("updated_at", { ascending: true })
        .limit(maxScanned)
    : await supabase.rpc("villages_kolejka_sync_granic_prg", { p_limit: maxScanned });

  if (errWsie) {
    throw new Error(`Nie udało się pobrać listy wsi do sync granic: ${errWsie.message}`);
  }

  const villages = (wsie ?? []) as VillageRow[];
  summary.scannedVillages = villages.length;
  if (villages.length === 0) return summary;

  const ids = villages.map((v) => v.id);
  const { data: syncRows, error: errSyncRows } = await supabase
    .from("geoportal_boundary_sync_state")
    .select("village_id, last_boundary_sync_at")
    .in("village_id", ids);

  if (errSyncRows) {
    throw new Error(`Nie udało się odczytać stanu sync granic: ${errSyncRows.message}`);
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
    if (!forceRefresh && village.boundary_geojson != null) {
      summary.skippedAlreadyHasBoundary += 1;
      continue;
    }

    const state = syncByVillage.get(village.id);
    const lastSyncMs = msFromIso(state?.last_boundary_sync_at);
    if (lastSyncMs > 0 && Date.now() - lastSyncMs < minSyncMs) {
      summary.skippedRecentSync += 1;
      continue;
    }

    summary.attemptedVillages += 1;
    const wynik = await pobierzGraniceWsiZPrgWfs(village.teryt_id, {
      lat: village.latitude,
      lon: village.longitude,
    });
    const nowIso = new Date().toISOString();

    if (!wynik.ok) {
      summary.errors.push(`${village.name}: ${wynik.reason}`);
      const syncUpdate: SyncStateUpsert = {
        village_id: village.id,
        last_boundary_sync_at: nowIso,
        last_status: "error",
        last_error_message: wynik.reason.slice(0, 1000),
        last_source_name: null,
        last_source_type_name: null,
        updated_at: nowIso,
      };
      await supabase.from("geoportal_boundary_sync_state").upsert(syncUpdate);
      if (!wynik.retryable) {
        // Dla błędów konfiguracyjnych/formatu nie ma sensu obciążać API kolejnymi próbami w tej samej iteracji.
        break;
      }
      continue;
    }

    const { error: updateErr } = await supabase
      .from("villages")
      .update({ boundary_geojson: wynik.boundaryGeojson })
      .eq("id", village.id);
    if (updateErr) {
      summary.errors.push(`${village.name}: update villages ${updateErr.message}`);
      const syncUpdate: SyncStateUpsert = {
        village_id: village.id,
        last_boundary_sync_at: nowIso,
        last_status: "error",
        last_error_message: `update villages: ${updateErr.message}`.slice(0, 1000),
        last_source_name: wynik.sourceName,
        last_source_type_name: wynik.sourceTypeName,
        updated_at: nowIso,
      };
      await supabase.from("geoportal_boundary_sync_state").upsert(syncUpdate);
      continue;
    }

    const syncUpdate: SyncStateUpsert = {
      village_id: village.id,
      last_boundary_sync_at: nowIso,
      last_status: "success",
      last_error_message: null,
      last_source_name: wynik.sourceName,
      last_source_type_name: wynik.sourceTypeName,
      updated_at: nowIso,
    };
    await supabase.from("geoportal_boundary_sync_state").upsert(syncUpdate);

    summary.processedVillages += 1;
    summary.updatedBoundaries += 1;
  }

  return summary;
}
