import { NextResponse } from "next/server";
import { z } from "zod";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import {
  najblizszeOdjazdyReczne,
  parsujRozkladPrzystankuReczny,
} from "@/lib/transport/rozklad-przystanku-reczny";
import { linkRozkladPkpDlaStacji } from "@/lib/transport/pkp-plk-api";
import {
  cacheDoApiOdjazdow,
  reczneDoApiOdjazdow,
  scalOdjazdyAutobusApi,
} from "@/lib/transport/scal-odjazdy-przystanku";

type Params = { params: { poiId: string } };

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
    .select("id, village_id, category, name, bus_schedule_manual, photo_url, photo_caption")
    .eq("id", parsed.data)
    .maybeSingle();

  if (!poi) {
    return NextResponse.json({ blad: "Nie znaleziono punktu." }, { status: 404 });
  }

  const kat = poi.category.trim().toLowerCase();
  const odTeraz = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  if (kat === "przystanek") {
    const rozklad = parsujRozkladPrzystankuReczny(poi.bus_schedule_manual);
    const reczne = reczneDoApiOdjazdow(najblizszeOdjazdyReczne(rozklad, { limit: 8 }));

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

    const cache = cacheDoApiOdjazdow(rows ?? []);
    const odjazdy = scalOdjazdyAutobusApi(reczne, cache, 8);

    return NextResponse.json(
      {
        typ: "autobus" as const,
        nazwa: poi.name,
        odjazdy,
        maReczny: reczne.length > 0 || Boolean(rozklad?.notatka?.trim()),
        notatka: rozklad?.notatka?.trim() || null,
        linkPdf: rozklad?.linkPdf?.trim() || null,
        photoUrl: poi.photo_url ?? null,
        fetchedAt: (rows ?? [])[0]?.fetched_at ?? rozklad?.zaktualizowano ?? null,
      },
      { headers: { "Cache-Control": "public, s-maxage=45, stale-while-revalidate=90" } },
    );
  }

  if (kat === "stacja_kolejowa") {
    const fmt = new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit" });
    const { data: mapowania } = await supabase
      .from("village_transport_stations")
      .select("station_id, station_name")
      .eq("village_id", poi.village_id)
      .eq("is_active", true);

    const poiNorm = norm(poi.name);
    const stacjaIds = new Set<string>();
    let nazwaStacjiPkp = poi.name;
    for (const m of mapowania ?? []) {
      if (m.station_id) stacjaIds.add(m.station_id);
      const mn = norm(m.station_name ?? "");
      if (mn && (poiNorm.includes(mn) || mn.includes(poiNorm))) {
        if (m.station_id) stacjaIds.add(m.station_id);
        if (m.station_name) nazwaStacjiPkp = m.station_name;
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

    const { data: statusWsi } = await supabase
      .from("village_transport_line_status")
      .select("status_label, status_color")
      .eq("village_id", poi.village_id)
      .maybeSingle();

    return NextResponse.json(
      {
        typ: "kolej" as const,
        nazwa: poi.name,
        odjazdy,
        fetchedAt: (rows ?? [])[0]?.fetched_at ?? null,
        linkPkp: linkRozkladPkpDlaStacji(nazwaStacjiPkp),
        statusKolej: statusWsi?.status_label ?? null,
        statusKolor: statusWsi?.status_color ?? null,
        utrudnienie:
          statusWsi?.status_color === "orange" && statusWsi.status_label
            ? statusWsi.status_label
            : null,
      },
      { headers: { "Cache-Control": "public, s-maxage=45, stale-while-revalidate=90" } },
    );
  }

  return NextResponse.json({ typ: "brak" as const, odjazdy: [] });
}
