import type { SupabaseClient } from "@supabase/supabase-js";
import type { ZnacznikWsi } from "@/components/mapa/mapa-wsi-leaflet";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

const ROZMIAR_STRONY = 1000;
const MAX_STRON = 5;

type WierszWsi = {
  id: string;
  name: string;
  slug: string;
  voivodeship: string;
  county: string;
  commune: string;
  teryt_id: string;
  gmina_teryt_kod?: string | null;
  powiat_teryt_kod?: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  population: number | null;
  boundary_source?: string | null;
  has_boundary?: boolean | null;
  public_offers_count?: number | string | null;
};

function doLiczby(v: string | number | null | undefined): number {
  if (v == null) return NaN;
  return typeof v === "number" ? v : Number.parseFloat(String(v));
}

function doLiczbyCalkowitej(v: number | string | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "number" ? Math.trunc(v) : Number.parseInt(String(v), 10) || 0;
}

function maObrysZeZrodla(zrodlo: string | null | undefined): boolean {
  return Boolean(zrodlo && !zrodlo.endsWith("_gmina"));
}

function mapujWiersz(w: WierszWsi): ZnacznikWsi | null {
  const lat = doLiczby(w.latitude);
  const lon = doLiczby(w.longitude);
  if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
  return {
    id: w.id,
    name: w.name,
    sciezka: sciezkaProfiluWsi({
      voivodeship: w.voivodeship,
      county: w.county,
      commune: w.commune,
      slug: w.slug,
    }),
    lat,
    lon,
    population: w.population,
    boundary_geojson: null,
    has_boundary: w.has_boundary === true || maObrysZeZrodla(w.boundary_source),
    public_offers_count: doLiczbyCalkowitej(w.public_offers_count),
    commune: w.commune,
    county: w.county,
    voivodeship: w.voivodeship,
    teryt_id: w.teryt_id,
    gmina_teryt_kod: w.gmina_teryt_kod ?? undefined,
    powiat_teryt_kod: w.powiat_teryt_kod ?? undefined,
  };
}

async function pobierzStroneRpc(
  supabase: SupabaseClient,
  offset: number,
  county: string | null,
): Promise<{ wiersze: WierszWsi[]; blad: string | null }> {
  const { data, error } = await supabase.rpc("mapa_wsi_znaczniki", {
    p_limit: ROZMIAR_STRONY,
    p_offset: offset,
    p_county: county,
  });
  if (error) return { wiersze: [], blad: error.message };
  return { wiersze: (data ?? []) as WierszWsi[], blad: null };
}

async function pobierzStroneTabeli(
  supabase: SupabaseClient,
  offset: number,
  county: string | null,
): Promise<{ wiersze: WierszWsi[]; blad: string | null }> {
  let q = supabase
    .from("villages")
    .select(
      "id, name, slug, voivodeship, county, commune, teryt_id, gmina_teryt_kod, powiat_teryt_kod, latitude, longitude, population, boundary_source",
    )
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .or("is_active.eq.true,boundary_source.not.is.null")
    .order("is_active", { ascending: false })
    .order("name", { ascending: true })
    .range(offset, offset + ROZMIAR_STRONY - 1);

  if (county) q = q.ilike("county", county);

  const { data, error } = await q;
  if (error) return { wiersze: [], blad: error.message };
  return { wiersze: (data ?? []) as WierszWsi[], blad: null };
}

/** Wsi na mapę katalogu — paginacja po 1000 (limit PostgREST). */
export async function pobierzZnacznikiMapyPaginacja(
  supabase: SupabaseClient,
  opts?: { county?: string | null; maxStron?: number },
): Promise<{ znaczniki: ZnacznikWsi[]; blad: string | null }> {
  const county = opts?.county?.trim() || null;
  const maxStron = opts?.maxStron ?? MAX_STRON;
  const znaczniki: ZnacznikWsi[] = [];
  let pierwszyBlad: string | null = null;

  for (let strona = 0; strona < maxStron; strona += 1) {
    const offset = strona * ROZMIAR_STRONY;
    let { wiersze, blad } = await pobierzStroneRpc(supabase, offset, county);

    if (blad && strona === 0) {
      pierwszyBlad = blad;
      ({ wiersze, blad } = await pobierzStroneTabeli(supabase, offset, county));
      if (blad) return { znaczniki: [], blad: `${pierwszyBlad} · ${blad}` };
    } else if (blad) {
      break;
    }

    if (wiersze.length === 0) break;

    for (const w of wiersze) {
      const z = mapujWiersz(w);
      if (z) znaczniki.push(z);
    }

    if (wiersze.length < ROZMIAR_STRONY) break;
  }

  return { znaczniki, blad: znaczniki.length > 0 ? null : pierwszyBlad };
}
