import { NextResponse } from "next/server";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

type WierszRpc = {
  id: string;
  name: string;
  slug: string;
  voivodeship: string;
  county: string;
  commune: string;
  teryt_id: string;
  latitude: string | number | null;
  longitude: string | number | null;
  population: number | null;
  boundary_geojson: unknown | null;
  public_offers_count: number | string | null;
};

/**
 * Publiczne dane pod mapę (te same co RPC `mapa_wsi_znaczniki`).
 * Przydatne do zewnętrznych narzędzi, cache na CDN lub prostego klienta bez Supabase.
 */
export async function GET() {
  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ blad: "Usługa chwilowo niedostępna." }, { status: 503 });
  }

  const { data, error } = await supabase.rpc("mapa_wsi_znaczniki");
  if (error) {
    console.error("[api/wies/mapa-znaczniki]", error.message);
    return NextResponse.json({ blad: "Nie udało się pobrać znaczników." }, { status: 500 });
  }

  const surowe = (data ?? []) as WierszRpc[];
  const wies = surowe.map((w) => ({
    id: w.id,
    nazwa: w.name,
    slug: w.slug,
    wojewodztwo: w.voivodeship,
    powiat: w.county,
    gmina: w.commune,
    terytId: w.teryt_id,
    szerokosc: w.latitude != null ? Number(w.latitude) : null,
    dlugosc: w.longitude != null ? Number(w.longitude) : null,
    ludnosc: w.population,
    liczbaOfertPublicznych:
      typeof w.public_offers_count === "number"
        ? w.public_offers_count
        : w.public_offers_count != null
          ? Number.parseInt(String(w.public_offers_count), 10) || 0
          : 0,
    sciezka: sciezkaProfiluWsi({
      voivodeship: w.voivodeship,
      county: w.county,
      commune: w.commune,
      slug: w.slug,
    }),
    granicaGeojson: w.boundary_geojson,
  }));

  return NextResponse.json(
    { wies, czas: new Date().toISOString() },
    {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
      },
    },
  );
}
