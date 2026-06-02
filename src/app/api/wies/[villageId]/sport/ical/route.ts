import { NextResponse } from "next/server";
import { z } from "zod";
import { utworzPlikIcsWiele } from "@/lib/kalendarz/utworz-plik-ics";
import { wpisyIcsZeSlotowTygodniowych } from "@/lib/wies/ical-sport-tygodniowy";
import { pobierzTerminarzSportuWsi } from "@/lib/wies/pobierz-terminarz-sportu-wsi";
import { bazowyUrlWitryny } from "@/lib/wies/kody-embed-wsi";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";

type Props = { params: { villageId: string } };

export const revalidate = 300;

export async function GET(_request: Request, { params }: Props) {
  const id = z.string().uuid().safeParse(params.villageId);
  if (!id.success) {
    return new NextResponse("Niepoprawny identyfikator.", { status: 400 });
  }

  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return new NextResponse("Serwis niedostępny.", { status: 503 });
  }

  const { data: wies } = await supabase
    .from("villages")
    .select("id, name, voivodeship, county, commune, slug, is_active")
    .eq("id", id.data)
    .maybeSingle();

  if (!wies?.is_active || !wies.slug) {
    return new NextResponse("Nie znaleziono wsi.", { status: 404 });
  }

  const sciezka = sciezkaProfiluWsi(wies);
  const baza = bazowyUrlWitryny();
  const terminarz = await pobierzTerminarzSportuWsi(supabase, wies.id);

  const wpisyWydarzen = terminarz.wydarzenia.map((ev) => ({
    uid: `sport-event-${ev.id}`,
    title: ev.title,
    description: ev.description,
    location: ev.location_text,
    startAt: new Date(ev.starts_at),
    endAt: ev.ends_at ? new Date(ev.ends_at) : null,
    url: `${baza}${sciezka}/wydarzenia/${ev.id}`,
  }));

  const wpisyTreningi = wpisyIcsZeSlotowTygodniowych(terminarz.treningi, {
    tygodnie: 10,
    urlBazy: baza,
    sciezkaProfilu: sciezka,
  });

  const ics = utworzPlikIcsWiele([...wpisyWydarzen, ...wpisyTreningi], `Sport — ${wies.name}`);

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="sport-${wies.slug}.ics"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
