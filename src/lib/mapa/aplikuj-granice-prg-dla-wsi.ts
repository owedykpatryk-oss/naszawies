import type { SupabaseClient } from "@supabase/supabase-js";
import {
  czyObrysPodejrzanieDuzyDlaWsi,
  czyPunktWGranicyGeojson,
  czyZrodloGranicyGminy,
  pobierzGraniceWsiZPrgWfs,
  zrodloZWarstwyPrg,
  centroidZGeojson,
  type GeoJsonGeometry,
} from "@/lib/geoportal/prg-wfs-client";
import { geokodujLokalizacjeTekst } from "@/lib/marketplace/geokoduj-lokalizacje";

export { zrodloZWarstwyPrg, centroidZGeojson };

export type WiesDoSyncGranic = {
  id: string;
  name: string;
  teryt_id: string;
  /** 7-znakowy kod gminy (TERC) — do warstwy A05; `teryt_id` w bazie to zwykle SIMC miejscowości. */
  gmina_teryt_kod?: string | null;
  boundary_geojson?: unknown | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type WynikSyncGranicyJednejWsi =
  | { ok: true; source: string; zaktualizowanoCentroid: boolean }
  | { ok: false; reason: string; retryable: boolean };

function doNum(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number.parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

/**
 * Pobiera granicę z PRG WFS i zapisuje przez `ustaw_granice_wsi` (boundary_source, boundary_synced_at, opcjonalnie GPS).
 */
export async function aplikujGranicePrgDlaWsi(
  supabase: SupabaseClient,
  village: WiesDoSyncGranic,
  opcje?: { geokodujGdyBrakGps?: boolean; commune?: string; county?: string; voivodeship?: string },
): Promise<WynikSyncGranicyJednejWsi> {
  let lat = doNum(village.latitude);
  let lon = doNum(village.longitude);

  if ((lat == null || lon == null) && opcje?.geokodujGdyBrakGps) {
    const kontekst = [opcje.commune, opcje.county, opcje.voivodeship].filter(Boolean).join(", ");
    const gps = await geokodujLokalizacjeTekst(village.name, kontekst || null);
    if (gps) {
      lat = gps.latitude;
      lon = gps.longitude;
    }
  }

  if (lat == null || lon == null) {
    return {
      ok: false,
      reason: "Brak współrzędnych wsi — potrzebny punkt GPS do pobrania obrębu ewidencyjnego z PRG.",
      retryable: false,
    };
  }

  const wynik = await pobierzGraniceWsiZPrgWfs(village.teryt_id, {
    lat,
    lon,
    gminaTerytKod: village.gmina_teryt_kod ?? null,
  });
  if (!wynik.ok) {
    return { ok: false, reason: wynik.reason, retryable: wynik.retryable };
  }

  if (czyZrodloGranicyGminy(wynik.sourceTypeName)) {
    return {
      ok: false,
      reason:
        "Odrzucono granicę: pobrany obrys obejmuje całą gminę, a nie obręb ewidencyjny wsi.",
      retryable: false,
    };
  }

  if (czyObrysPodejrzanieDuzyDlaWsi(wynik.boundaryGeojson as GeoJsonGeometry)) {
    return {
      ok: false,
      reason: "Odrzucono granicę: obrys jest zbyt duży (prawdopodobnie granica gminy, nie wsi).",
      retryable: false,
    };
  }

  if (!czyPunktWGranicyGeojson(wynik.boundaryGeojson as GeoJsonGeometry, lon, lat)) {
    return {
      ok: false,
      reason:
        "Odrzucono granicę: punkt GPS wsi nie leży w pobranym obrysie (prawdopodobnie inny obręb ewidencyjny niż sołectwo).",
      retryable: false,
    };
  }

  const source = zrodloZWarstwyPrg(wynik.sourceTypeName);
  const c = centroidZGeojson(wynik.boundaryGeojson);
  const zapisLat = lat ?? c?.lat ?? null;
  const zapisLon = lon ?? c?.lon ?? null;

  const { data: zapisano, error } = await supabase.rpc("ustaw_granice_wsi", {
    p_teryt_id: village.teryt_id.trim(),
    p_boundary: wynik.boundaryGeojson,
    p_source: source,
    p_lat: zapisLat,
    p_lon: zapisLon,
  });

  if (error) {
    return { ok: false, reason: `ustaw_granice_wsi: ${error.message}`, retryable: true };
  }
  if (zapisano !== true) {
    return { ok: false, reason: "Nie znaleziono wsi o podanym TERYT w bazie.", retryable: false };
  }

  return {
    ok: true,
    source,
    zaktualizowanoCentroid: lat == null && c != null,
  };
}
