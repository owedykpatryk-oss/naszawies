import { NextResponse } from "next/server";
import { z } from "zod";
import { zbudujLinkiTransportuDlaWsi } from "@/lib/transport/linki-zewnetrzne";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";

type Params = { params: { villageId: string } };

export async function GET(_req: Request, { params }: Params) {
  const id = z.string().uuid().safeParse(params.villageId);
  if (!id.success) {
    return NextResponse.json({ blad: "Nieprawidłowy identyfikator wsi." }, { status: 400 });
  }

  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ blad: "Usługa chwilowo niedostępna." }, { status: 503 });
  }

  const [{ data: wies }, { data: status }, { data: odjazdy }, { data: pois }, { data: stacjeMap }] =
    await Promise.all([
      supabase
        .from("villages")
        .select("name, voivodeship, county, commune, latitude, longitude, is_active")
        .eq("id", id.data)
        .maybeSingle(),
      supabase
        .from("village_transport_line_status")
        .select("status_color, status_label, delayed_count, cancelled_count, fallback_mode, updated_at")
        .eq("village_id", id.data)
        .maybeSingle(),
      supabase
        .from("transport_departures_cache")
        .select(
          "id, station_name, train_label, destination, platform, planned_at, realtime_at, delay_min, is_cancelled, status, fetched_at",
        )
        .eq("village_id", id.data)
        .gte("planned_at", new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
        .order("planned_at", { ascending: true })
        .limit(8),
      supabase
        .from("pois")
        .select("id, name, category, latitude, longitude, description")
        .eq("village_id", id.data)
        .in("category", ["przystanek", "stacja_kolejowa"])
        .order("name", { ascending: true })
        .limit(24),
      supabase
        .from("village_transport_stations")
        .select("station_name, distance_km")
        .eq("village_id", id.data)
        .eq("is_active", true)
        .order("distance_km", { ascending: true })
        .limit(5),
    ]);

  if (!wies) {
    return NextResponse.json({ blad: "Nie znaleziono wsi." }, { status: 404 });
  }

  const przystanki = (pois ?? []).filter((p) => p.category === "przystanek");
  const stacjePoi = (pois ?? []).filter((p) => p.category === "stacja_kolejowa");
  const maKolej = (odjazdy?.length ?? 0) > 0 || !!status || (stacjeMap?.length ?? 0) > 0 || stacjePoi.length > 0;
  const maAutobus = przystanki.length > 0;

  const kontekst = {
    name: wies.name,
    voivodeship: wies.voivodeship,
    county: wies.county,
    commune: wies.commune,
    latitude: wies.latitude != null ? Number(wies.latitude) : null,
    longitude: wies.longitude != null ? Number(wies.longitude) : null,
  };

  return NextResponse.json(
    {
      status: status ?? null,
      odjazdy: odjazdy ?? [],
      przystanki,
      stacjeKolejowe: stacjePoi,
      stacjePkp: stacjeMap ?? [],
      maKolej,
      maAutobus,
      linkiZewnetrzne: zbudujLinkiTransportuDlaWsi(kontekst),
      wies: kontekst,
    },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } },
  );
}
