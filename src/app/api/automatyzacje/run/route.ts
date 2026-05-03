import { NextResponse } from "next/server";
import { czyZapytanieCronAutoryzowane } from "@/lib/api/autoryzacja-cron";
import { pobierzIpIUserAgentZRequestu, zapiszCronRun } from "@/lib/api/zapisz-cron-run";
import { synchronizujAdresyPrgAutomatycznie } from "@/lib/mapa/synchronizuj-adresy-prg-automatycznie";
import { synchronizujKontekstGeoportalAutomatycznie } from "@/lib/mapa/synchronizuj-kontekst-geoportal-automatycznie";
import { synchronizujPoiOsmAutomatycznie } from "@/lib/mapa/synchronizuj-poi-osm-automatycznie";
import { synchronizujGranicePrgAutomatycznie } from "@/lib/mapa/synchronizuj-granice-prg-automatycznie";
import { sprawdzJakoscDanychMapy } from "@/lib/mapa/sprawdz-jakosc-danych-mapy";
import { synchronizujTransportAutomatycznie } from "@/lib/transport/synchronizuj-transport-automatycznie";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";

type AutomationRunRow = {
  action: string;
  affected_rows: number;
};

const ENDPOINT = "/api/automatyzacje/run";

async function runAutomation(request: Request) {
  const startedAt = new Date().toISOString();
  const meta = pobierzIpIUserAgentZRequestu(request);
  const supabase = createAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Brak konfiguracji SUPABASE_SERVICE_ROLE_KEY lub NEXT_PUBLIC_SUPABASE_URL." },
      { status: 500 }
    );
  }

  const { data, error } = await supabase.rpc("run_village_automation_for_cron");
  if (error) {
    console.error("[api/automatyzacje/run]", error.message);
    await zapiszCronRun(supabase, {
      endpoint: ENDPOINT,
      started_at: startedAt,
      status: "error",
      error_message: error.message,
      ...meta,
    });
    return NextResponse.json({ error: "Nie udało się uruchomić automatyzacji." }, { status: 500 });
  }

  const rows = (data ?? []) as AutomationRunRow[];
  const pominiety =
    rows.length === 1 && rows[0]?.action === "skipped_concurrent_lock";
  let poiAuto:
    | {
        ok: true;
        added: number;
        attemptedVillages: number;
        processedVillages: number;
        skippedRecentSync: number;
        skippedComplete: number;
        skippedNoCoords: number;
        scannedVillages: number;
        errors: string[];
      }
    | {
        ok: false;
        error: string;
      } = { ok: true, added: 0, attemptedVillages: 0, processedVillages: 0, skippedRecentSync: 0, skippedComplete: 0, skippedNoCoords: 0, scannedVillages: 0, errors: [] };
  let granicePrgAuto:
    | {
        ok: true;
        updatedBoundaries: number;
        attemptedVillages: number;
        processedVillages: number;
        scannedVillages: number;
        skippedAlreadyHasBoundary: number;
        skippedRecentSync: number;
        skippedMissingTeryt: number;
        errors: string[];
      }
    | {
        ok: false;
        error: string;
      } = {
    ok: true,
    updatedBoundaries: 0,
    attemptedVillages: 0,
    processedVillages: 0,
    scannedVillages: 0,
    skippedAlreadyHasBoundary: 0,
    skippedRecentSync: 0,
    skippedMissingTeryt: 0,
    errors: [],
  };
  let adresyPrgAuto:
    | {
        ok: true;
        upsertedPoints: number;
        attemptedVillages: number;
        processedVillages: number;
        scannedVillages: number;
        skippedRecentSync: number;
        skippedMissingTeryt: number;
        skippedNoCoords: number;
        errors: string[];
      }
    | {
        ok: false;
        error: string;
      } = {
    ok: true,
    upsertedPoints: 0,
    attemptedVillages: 0,
    processedVillages: 0,
    scannedVillages: 0,
    skippedRecentSync: 0,
    skippedMissingTeryt: 0,
    skippedNoCoords: 0,
    errors: [],
  };
  let kontekstGeoportalAuto:
    | {
        ok: true;
        attemptedVillages: number;
        processedVillages: number;
        scannedVillages: number;
        upsertedPrng: number;
        upsertedInstitutional: number;
        skippedRecentSync: number;
        skippedNoCoords: number;
        errors: string[];
      }
    | {
        ok: false;
        error: string;
      } = {
    ok: true,
    attemptedVillages: 0,
    processedVillages: 0,
    scannedVillages: 0,
    upsertedPrng: 0,
    upsertedInstitutional: 0,
    skippedRecentSync: 0,
    skippedNoCoords: 0,
    errors: [],
  };
  let transportAuto:
    | {
        enabled: boolean;
        villagesProcessed: number;
        stationsObserved: number;
        departuresUpserted: number;
        statusGreen: number;
        statusOrange: number;
        statusRed: number;
        fallbackVillages: number;
        errors: string[];
      }
    | {
        ok: false;
        error: string;
      } = {
    enabled: false,
    villagesProcessed: 0,
    stationsObserved: 0,
    departuresUpserted: 0,
    statusGreen: 0,
    statusOrange: 0,
    statusRed: 0,
    fallbackVillages: 0,
    errors: [],
  };
  let geoDataQuality:
    | {
        ok: true;
        scannedVillages: number;
        openedAlerts: number;
        resolvedAlerts: number;
        errors: string[];
      }
    | {
        ok: false;
        error: string;
      } = {
    ok: true,
    scannedVillages: 0,
    openedAlerts: 0,
    resolvedAlerts: 0,
    errors: [],
  };

  if (pominiety) {
    rows.push({ action: "sync_auto_poi_from_osm_skipped_concurrent_lock", affected_rows: 0 });
    rows.push({ action: "sync_auto_prg_boundaries_skipped_concurrent_lock", affected_rows: 0 });
    rows.push({ action: "sync_auto_prg_addresses_skipped_concurrent_lock", affected_rows: 0 });
    rows.push({ action: "sync_auto_geoportal_context_skipped_concurrent_lock", affected_rows: 0 });
    rows.push({ action: "sync_auto_transport_skipped_concurrent_lock", affected_rows: 0 });
    rows.push({ action: "geo_data_quality_check_skipped_concurrent_lock", affected_rows: 0 });
  } else {
    try {
      const summary = await synchronizujPoiOsmAutomatycznie(supabase, {
        maxVillagesPerRun: Number.parseInt(process.env.POI_AUTO_SYNC_VILLAGES_PER_RUN ?? "", 10) || 3,
        maxVillagesScanned: Number.parseInt(process.env.POI_AUTO_SYNC_VILLAGES_SCANNED ?? "", 10) || 30,
        minDaysBetweenSync: Number.parseInt(process.env.POI_AUTO_SYNC_MIN_DAYS ?? "", 10) || 7,
      });
      poiAuto = {
        ok: true,
        added: summary.added,
        attemptedVillages: summary.attemptedVillages,
        processedVillages: summary.processedVillages,
        skippedRecentSync: summary.skippedRecentSync,
        skippedComplete: summary.skippedComplete,
        skippedNoCoords: summary.skippedNoCoords,
        scannedVillages: summary.scannedVillages,
        errors: summary.errors,
      };
      rows.push({ action: "sync_auto_poi_from_osm", affected_rows: summary.added });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[api/automatyzacje/run] poi auto sync", msg);
      poiAuto = { ok: false, error: msg };
      rows.push({ action: "sync_auto_poi_from_osm_failed", affected_rows: 0 });
    }

    try {
      const summary = await synchronizujGranicePrgAutomatycznie(supabase);
      granicePrgAuto = {
        ok: true,
        updatedBoundaries: summary.updatedBoundaries,
        attemptedVillages: summary.attemptedVillages,
        processedVillages: summary.processedVillages,
        scannedVillages: summary.scannedVillages,
        skippedAlreadyHasBoundary: summary.skippedAlreadyHasBoundary,
        skippedRecentSync: summary.skippedRecentSync,
        skippedMissingTeryt: summary.skippedMissingTeryt,
        errors: summary.errors,
      };
      rows.push({ action: "sync_auto_prg_boundaries", affected_rows: summary.updatedBoundaries });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[api/automatyzacje/run] prg boundary auto sync", msg);
      granicePrgAuto = { ok: false, error: msg };
      rows.push({ action: "sync_auto_prg_boundaries_failed", affected_rows: 0 });
    }

    try {
      const summary = await synchronizujAdresyPrgAutomatycznie(supabase);
      adresyPrgAuto = {
        ok: true,
        upsertedPoints: summary.upsertedPoints,
        attemptedVillages: summary.attemptedVillages,
        processedVillages: summary.processedVillages,
        scannedVillages: summary.scannedVillages,
        skippedRecentSync: summary.skippedRecentSync,
        skippedMissingTeryt: summary.skippedMissingTeryt,
        skippedNoCoords: summary.skippedNoCoords,
        errors: summary.errors,
      };
      rows.push({ action: "sync_auto_prg_addresses", affected_rows: summary.upsertedPoints });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[api/automatyzacje/run] prg address auto sync", msg);
      adresyPrgAuto = { ok: false, error: msg };
      rows.push({ action: "sync_auto_prg_addresses_failed", affected_rows: 0 });
    }

    try {
      const summary = await synchronizujKontekstGeoportalAutomatycznie(supabase);
      kontekstGeoportalAuto = {
        ok: true,
        attemptedVillages: summary.attemptedVillages,
        processedVillages: summary.processedVillages,
        scannedVillages: summary.scannedVillages,
        upsertedPrng: summary.upsertedPrng,
        upsertedInstitutional: summary.upsertedInstitutional,
        skippedRecentSync: summary.skippedRecentSync,
        skippedNoCoords: summary.skippedNoCoords,
        errors: summary.errors,
      };
      rows.push({
        action: "sync_auto_geoportal_context",
        affected_rows: summary.upsertedPrng + summary.upsertedInstitutional,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[api/automatyzacje/run] geoportal context auto sync", msg);
      kontekstGeoportalAuto = { ok: false, error: msg };
      rows.push({ action: "sync_auto_geoportal_context_failed", affected_rows: 0 });
    }

    try {
      const summary = await synchronizujTransportAutomatycznie(supabase);
      transportAuto = {
        enabled: summary.enabled,
        villagesProcessed: summary.villagesProcessed,
        stationsObserved: summary.stationsObserved,
        departuresUpserted: summary.departuresUpserted,
        statusGreen: summary.statusGreen,
        statusOrange: summary.statusOrange,
        statusRed: summary.statusRed,
        fallbackVillages: summary.fallbackVillages,
        errors: summary.errors,
      };
      rows.push({ action: "sync_auto_transport", affected_rows: summary.departuresUpserted });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[api/automatyzacje/run] transport auto sync", msg);
      transportAuto = { ok: false, error: msg };
      rows.push({ action: "sync_auto_transport_failed", affected_rows: 0 });
    }

    try {
      const summary = await sprawdzJakoscDanychMapy(supabase);
      geoDataQuality = {
        ok: true,
        scannedVillages: summary.scannedVillages,
        openedAlerts: summary.openedAlerts,
        resolvedAlerts: summary.resolvedAlerts,
        errors: summary.errors,
      };
      rows.push({ action: "geo_data_quality_check", affected_rows: summary.openedAlerts + summary.resolvedAlerts });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[api/automatyzacje/run] geo data quality check", msg);
      geoDataQuality = { ok: false, error: msg };
      rows.push({ action: "geo_data_quality_check_failed", affected_rows: 0 });
    }
  }

  const totalAffected = rows.reduce((sum, row) => sum + (row.affected_rows ?? 0), 0);

  await zapiszCronRun(supabase, {
    endpoint: ENDPOINT,
    started_at: startedAt,
    status: "success",
    affected_rows: {
      totalAffected,
      actions: rows,
      skippedConcurrent: pominiety,
      poiAuto,
      granicePrgAuto,
      adresyPrgAuto,
      kontekstGeoportalAuto,
      transportAuto,
      geoDataQuality,
    },
    ...meta,
  });

  return NextResponse.json({
    ok: true,
    skippedConcurrent: pominiety,
    totalAffected,
    actions: rows,
    poiAuto,
    granicePrgAuto,
    adresyPrgAuto,
    kontekstGeoportalAuto,
    transportAuto,
    geoDataQuality,
    ranAt: new Date().toISOString(),
  });
}

export async function GET(request: Request) {
  if (!czyZapytanieCronAutoryzowane(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runAutomation(request);
}

export async function POST(request: Request) {
  if (!czyZapytanieCronAutoryzowane(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runAutomation(request);
}
