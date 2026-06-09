import { NextResponse } from "next/server";
import { wymagajLogowaniaApi } from "@/lib/auth/wymagaj-logowania-api";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { pobierzZnacznikiMapyPaginacja } from "@/lib/mapa/pobierz-znaczniki-mapy-paginacja";

/**
 * Publiczne dane pod mapę (te same co RPC `mapa_wsi_znaczniki`).
 * Przydatne do zewnętrznych narzędzi, cache na CDN lub prostego klienta bez Supabase.
 */
export async function GET() {
  const auth = await wymagajLogowaniaApi();
  if (!auth.ok) return auth.response;

  const supabase = createAdminSupabaseClient() ?? createPublicSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ blad: "Usługa chwilowo niedostępna." }, { status: 503 });
  }

  const { znaczniki, blad } = await pobierzZnacznikiMapyPaginacja(supabase);
  if (blad && znaczniki.length === 0) {
    console.error("[api/wies/mapa-znaczniki]", blad);
    return NextResponse.json({ blad: "Nie udało się pobrać znaczników." }, { status: 500 });
  }

  const wies = znaczniki.map((w) => ({
    id: w.id,
    nazwa: w.name,
    slug: w.sciezka.split("/").pop() ?? "",
    wojewodztwo: w.voivodeship,
    powiat: w.county,
    gmina: w.commune,
    terytId: w.teryt_id,
    szerokosc: w.lat,
    dlugosc: w.lon,
    ludnosc: w.population,
    liczbaOfertPublicznych: w.public_offers_count,
    sciezka: w.sciezka,
    granicaGeojson: w.boundary_geojson,
    maGranice: w.has_boundary === true || w.boundary_geojson != null,
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
