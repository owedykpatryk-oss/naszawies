import type { SupabaseClient } from "@supabase/supabase-js";
import { aplikujGranicePrgDlaWsi } from "@/lib/mapa/aplikuj-granice-prg-dla-wsi";

type VillageRow = {
  id: string;
  name: string;
  teryt_id: string | null;
  gmina_teryt_kod?: string | null;
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

type TrybSync = "cron" | "mapa";

type OpcjeSync = {
  tryb?: TrybSync;
};

function parseIntEnv(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name]?.trim();
  const n = raw ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function limityDlaTrybu(tryb: TrybSync): { maxPerRun: number; maxScanned: number; minDays: number } {
  if (tryb === "mapa") {
    return {
      maxPerRun: parseIntEnv("GEOPORTAL_BOUNDARY_SYNC_MAPA_PER_RUN", 20, 1, 60),
      maxScanned: parseIntEnv("GEOPORTAL_BOUNDARY_SYNC_MAPA_SCANNED", 150, 10, 400),
      minDays: parseIntEnv("GEOPORTAL_BOUNDARY_SYNC_MAPA_MIN_DAYS", 3, 0, 30),
    };
  }
  return {
    maxPerRun: parseIntEnv("GEOPORTAL_BOUNDARY_SYNC_VILLAGES_PER_RUN", 8, 1, 30),
    maxScanned: parseIntEnv("GEOPORTAL_BOUNDARY_SYNC_VILLAGES_SCANNED", 60, 10, 300),
    minDays: parseIntEnv("GEOPORTAL_BOUNDARY_SYNC_MIN_DAYS", 14, 1, 180),
  };
}

function msFromIso(iso: string | null | undefined): number {
  if (!iso) return 0;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}


export async function synchronizujGranicePrgAutomatycznie(
  supabase: SupabaseClient,
  opcje: OpcjeSync = {},
): Promise<PrgBoundarySyncSummary> {
  const tryb = opcje.tryb ?? "cron";
  const { maxPerRun, maxScanned, minDays } = limityDlaTrybu(tryb);
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

  const { data: wsie, error: errWsie } = forceRefresh
    ? await supabase
        .from("villages")
        .select("id, name, teryt_id, gmina_teryt_kod, boundary_geojson, latitude, longitude, boundary_source")
        .eq("is_active", true)
        .not("teryt_id", "is", null)
        .or("boundary_geojson.is.null,boundary_source.is.null,boundary_source.eq.demo")
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

    if (!village.teryt_id?.trim()) {
      summary.skippedMissingTeryt += 1;
      continue;
    }


    const state = syncByVillage.get(village.id);
    const lastSyncMs = msFromIso(state?.last_boundary_sync_at);
    if (!forceRefresh && lastSyncMs > 0 && Date.now() - lastSyncMs < minSyncMs) {
      summary.skippedRecentSync += 1;
      continue;
    }

    summary.attemptedVillages += 1;
    const nowIso = new Date().toISOString();

    const wynik = await aplikujGranicePrgDlaWsi(supabase, {
      id: village.id,
      name: village.name,
      teryt_id: village.teryt_id.trim(),
      gmina_teryt_kod: village.gmina_teryt_kod ?? null,
      latitude: village.latitude,
      longitude: village.longitude,
    });

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
      continue;
    }

    const syncUpdate: SyncStateUpsert = {
      village_id: village.id,
      last_boundary_sync_at: nowIso,
      last_status: "success",
      last_error_message: null,
      last_source_name: "ustaw_granice_wsi",
      last_source_type_name: wynik.source,
      updated_at: nowIso,
    };
    await supabase.from("geoportal_boundary_sync_state").upsert(syncUpdate);

    summary.processedVillages += 1;
    summary.updatedBoundaries += 1;

    await new Promise((r) => setTimeout(r, tryb === "mapa" ? 200 : 350));
  }

  return summary;
}
