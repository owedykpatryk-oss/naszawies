import { NextResponse } from "next/server";
import { z } from "zod";
import {
  frazaStacjiDlaPowiatu,
  frazaStacjiDlaWojewodztwa,
  odjazdPasujeDoCelu,
} from "@/lib/transport/huby-powiatowe";
import { zbudujLinkiTransportuDlaWsi } from "@/lib/transport/linki-zewnetrzne";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

type Params = { params: { villageId: string } };

type OdjazdAutobusRow = {
  id: string;
  stop_name: string | null;
  line_label: string;
  destination: string | null;
  planned_at: string;
  provider: string;
  fetched_at: string;
};

function grupujAutobusPoPrzystanku(rows: OdjazdAutobusRow[]) {
  const mapa = new Map<string, OdjazdAutobusRow[]>();
  for (const r of rows) {
    const klucz = r.stop_name?.trim() || "Przystanek";
    const arr = mapa.get(klucz) ?? [];
    arr.push(r);
    mapa.set(klucz, arr);
  }
  return Array.from(mapa.entries()).map(([przystanek, odjazdy]) => ({
    przystanek,
    odjazdy: odjazdy.slice(0, 8),
  }));
}

export async function GET(_req: Request, { params }: Params) {
  const id = z.string().uuid().safeParse(params.villageId);
  if (!id.success) {
    return NextResponse.json({ blad: "Nieprawidłowy identyfikator wsi." }, { status: 400 });
  }

  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ blad: "Usługa chwilowo niedostępna." }, { status: 503 });
  }

  const [{ data: wies }, { data: status }, { data: odjazdy }, { data: odjazdyAutobus }, { data: pois }, { data: stacjeMap }] =
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
        .from("bus_departures_cache")
        .select(
          "id, stop_name, line_label, destination, planned_at, provider, fetched_at",
        )
        .eq("village_id", id.data)
        .gte("planned_at", new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
        .order("planned_at", { ascending: true })
        .limit(12),
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
  const maAutobus = przystanki.length > 0 || (odjazdyAutobus?.length ?? 0) > 0;

  const frazaPowiat = frazaStacjiDlaPowiatu(wies.county ?? "");
  const frazaWoj = frazaStacjiDlaWojewodztwa(wies.voivodeship ?? "");

  let stacjaPowiatuPkp: string | null = null;
  let stacjaWojPkp: string | null = null;
  try {
    const supabaseUser = utworzKlientaSupabaseSerwer();
    const {
      data: { user },
    } = await supabaseUser.auth.getUser();
    if (user) {
      const { data: relacje } = await supabaseUser
        .from("user_transport_favorite_relations")
        .select("relation_key, target_station_name")
        .eq("user_id", user.id)
        .eq("village_id", id.data)
        .eq("is_active", true)
        .in("relation_key", ["powiat_default", "wojewodztwo_default"]);
      for (const r of relacje ?? []) {
        if (r.relation_key === "powiat_default" && r.target_station_name) {
          stacjaPowiatuPkp = r.target_station_name;
        }
        if (r.relation_key === "wojewodztwo_default" && r.target_station_name) {
          stacjaWojPkp = r.target_station_name;
        }
      }
    }
  } catch {
    /* publiczny widok bez sesji */
  }

  const polaczeniaDoPowiatu = (odjazdy ?? []).filter((o) =>
    odjazdPasujeDoCelu(o.destination, frazaPowiat, stacjaPowiatuPkp),
  );
  const polaczeniaDoWojewodztwa = (odjazdy ?? []).filter((o) =>
    odjazdPasujeDoCelu(o.destination, frazaWoj, stacjaWojPkp),
  );

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
      odjazdyAutobus: odjazdyAutobus ?? [],
      odjazdyAutobusPoPrzystanku: grupujAutobusPoPrzystanku(odjazdyAutobus ?? []),
      polaczeniaDoPowiatu,
      polaczeniaDoWojewodztwa,
      hubPowiatu: {
        fraza: frazaPowiat,
        county: wies.county,
        stacjaPkp: stacjaPowiatuPkp,
      },
      hubWojewodztwa: {
        fraza: frazaWoj,
        voivodeship: wies.voivodeship,
        stacjaPkp: stacjaWojPkp,
      },
      ostatniaAktualizacja: {
        kolej: (odjazdy ?? []).reduce<string | null>((max, o) => {
          const t = o.fetched_at;
          if (!t) return max;
          if (!max || t > max) return t;
          return max;
        }, null),
        autobus: (odjazdyAutobus ?? []).reduce<string | null>((max, o) => {
          const t = o.fetched_at;
          if (!t) return max;
          if (!max || t > max) return t;
          return max;
        }, null),
      },
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
