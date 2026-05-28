import { NextResponse } from "next/server";
import { z } from "zod";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";

type Params = { params: { poiId: string } };

const fmt = new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit" });

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export async function GET(_req: Request, { params }: Params) {
  const parsed = z.string().uuid().safeParse(params.poiId);
  if (!parsed.success) {
    return NextResponse.json({ blad: "Nieprawidłowy punkt." }, { status: 400 });
  }

  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ blad: "Usługa niedostępna." }, { status: 503 });
  }

  const { data: poi } = await supabase
    .from("pois")
    .select("id, village_id, category, name")
    .eq("id", parsed.data)
    .maybeSingle();

  if (!poi) {
    return NextResponse.json({ blad: "Nie znaleziono punktu." }, { status: 404 });
  }

  const kat = poi.category.trim().toLowerCase();
  const odTeraz = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  if (kat === "przystanek") {
    const { data: poPoi } = await supabase
      .from("bus_departures_cache")
      .select("line_label, destination, planned_at, stop_name, fetched_at, poi_id")
      .eq("village_id", poi.village_id)
      .eq("poi_id", poi.id)
      .gte("planned_at", odTeraz)
      .order("planned_at", { ascending: true })
      .limit(6);

    let rows = poPoi ?? [];
    if (rows.length === 0) {
      const { data: poWsi } = await supabase
        .from("bus_departures_cache")
        .select("line_label, destination, planned_at, stop_name, fetched_at, poi_id")
        .eq("village_id", poi.village_id)
        .gte("planned_at", odTeraz)
        .order("planned_at", { ascending: true })
        .limit(24);
      const pn = norm(poi.name);
      rows = (poWsi ?? []).filter((r) => norm(r.stop_name ?? "").includes(pn) || pn.includes(norm(r.stop_name ?? "")));
    }

    const odjazdy = (rows ?? []).map((r) => ({
      czas: fmt.format(new Date(r.planned_at)),
      linia: r.line_label,
      cel: r.destination,
      opis: r.stop_name,
    }));

    return NextResponse.json(
      {
        typ: "autobus" as const,
        nazwa: poi.name,
        odjazdy,
        fetchedAt: (rows ?? [])[0]?.fetched_at ?? null,
      },
      { headers: { "Cache-Control": "public, s-maxage=45, stale-while-revalidate=90" } },
    );
  }

  if (kat === "stacja_kolejowa") {
    const { data: mapowania } = await supabase
      .from("village_transport_stations")
      .select("station_id, station_name")
      .eq("village_id", poi.village_id)
      .eq("is_active", true);

    const poiNorm = norm(poi.name);
    const stacjaIds = new Set<string>();
    for (const m of mapowania ?? []) {
      if (m.station_id) stacjaIds.add(m.station_id);
      const mn = norm(m.station_name ?? "");
      if (mn && (poiNorm.includes(mn) || mn.includes(poiNorm))) {
        if (m.station_id) stacjaIds.add(m.station_id);
      }
    }

    let zapytanie = supabase
      .from("transport_departures_cache")
      .select(
        "train_label, destination, planned_at, realtime_at, delay_min, is_cancelled, platform, station_name, fetched_at",
      )
      .eq("village_id", poi.village_id)
      .gte("planned_at", odTeraz)
      .order("planned_at", { ascending: true })
      .limit(6);

    if (stacjaIds.size > 0) {
      zapytanie = zapytanie.in("station_id", Array.from(stacjaIds));
    } else {
      zapytanie = zapytanie.ilike("station_name", `%${poi.name.slice(0, 24).replace(/[%_]/g, "")}%`);
    }

    const { data: rows } = await zapytanie;

    const odjazdy = (rows ?? []).map((r) => {
      const when = r.realtime_at ?? r.planned_at;
      const delay = r.delay_min != null && r.delay_min > 0 ? ` (+${r.delay_min} min)` : "";
      return {
        czas: fmt.format(new Date(when)) + delay,
        linia: r.train_label,
        cel: r.destination,
        peron: r.platform,
        anulowany: r.is_cancelled,
      };
    });

    return NextResponse.json(
      {
        typ: "kolej" as const,
        nazwa: poi.name,
        odjazdy,
        fetchedAt: (rows ?? [])[0]?.fetched_at ?? null,
      },
      { headers: { "Cache-Control": "public, s-maxage=45, stale-while-revalidate=90" } },
    );
  }

  return NextResponse.json({ typ: "brak" as const, odjazdy: [] });
}
