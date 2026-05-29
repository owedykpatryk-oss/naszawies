import { NextResponse } from "next/server";
import { z } from "zod";
import { wymagajLogowaniaApi } from "@/lib/auth/wymagaj-logowania-api";
import { formatujGodzinyOtwarcia } from "@/lib/mapa/formatuj-godziny-otwarcia";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import { pobierzKalendarzZajetosciDlaHali } from "@/components/swietlica/kalendarz-zajetosci-publiczny";
import { pobierzSalePubliczneDlaWsi } from "@/lib/swietlica/pobierz-sale-publiczne-wsi";

type Params = { params: { poiId: string } };

const fmt = new Intl.DateTimeFormat("pl-PL", { dateStyle: "short", timeStyle: "short" });

export async function GET(_req: Request, { params }: Params) {
  const auth = await wymagajLogowaniaApi();
  if (!auth.ok) return auth.response;

  const parsed = z.string().uuid().safeParse(params.poiId);
  if (!parsed.success) {
    return NextResponse.json({ blad: "Nieprawidłowy punkt." }, { status: 400 });
  }

  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ blad: "Usługa niedostępna." }, { status: 503 });
  }

  const { data: poi, error } = await supabase
    .from("pois")
    .select("id, village_id, category, name, phone, opening_hours, linked_entity_id, linked_hall_id")
    .eq("id", parsed.data)
    .maybeSingle();

  if (error || !poi) {
    return NextResponse.json({ blad: "Nie znaleziono punktu." }, { status: 404 });
  }

  const kat = String(poi.category ?? "").trim().toLowerCase();
  const wynik: Record<string, unknown> = {
    kategoria: kat,
    telefon: poi.phone?.trim() || null,
    godziny: formatujGodzinyOtwarcia(poi.opening_hours),
  };

  if (kat === "swietlica") {
    const hallId = poi.linked_hall_id as string | null;
    if (hallId) {
      const [{ data: sala }, kalendarz] = await Promise.all([
        supabase.from("halls").select("id, name, address, max_capacity").eq("id", hallId).maybeSingle(),
        pobierzKalendarzZajetosciDlaHali(supabase, hallId),
      ]);
      const teraz = Date.now();
      const nadchodzace = kalendarz
        .filter((w) => Date.parse(w.end_at) >= teraz)
        .sort((a, b) => Date.parse(a.start_at) - Date.parse(b.start_at))
        .slice(0, 10)
        .map((w) => ({
          sala: sala?.name ?? "Sala",
          start: w.start_at,
          koniec: w.end_at,
          zakres: `${fmt.format(new Date(w.start_at))} – ${fmt.format(new Date(w.end_at))}`,
          status: "Zajęte",
        }));
      wynik.swietlica = {
        sale: sala
          ? [
              {
                id: sala.id,
                nazwa: sala.name,
                adres: sala.address ?? null,
                pojemnosc: sala.max_capacity ?? null,
              },
            ]
          : [],
        kalendarz: nadchodzace,
        tylkoPodglad: true,
      };
    } else {
      const sale = await pobierzSalePubliczneDlaWsi(supabase, poi.village_id as string);
      wynik.swietlica = {
        sale: sale.map((s) => ({
          id: s.id,
          nazwa: s.name,
          adres: s.address ?? null,
          pojemnosc: s.max_capacity ?? null,
        })),
        kalendarz: [] as { sala: string; zakres: string; status: string }[],
        komunikat: "Sołtys może powiązać pinezkę ze salą w panelu Profil wsi → punkty na mapie.",
        tylkoPodglad: true,
      };
    }
  }

  if (poi.linked_entity_id) {
    const { data: podmiot } = await supabase
      .from("entities")
      .select("name, phone, email, website, address, opening_hours")
      .eq("id", poi.linked_entity_id as string)
      .maybeSingle();
    if (podmiot) {
      wynik.podmiot = {
        nazwa: podmiot.name,
        telefon: podmiot.phone,
        email: podmiot.email,
        strona: podmiot.website,
        adres: podmiot.address,
        godziny: formatujGodzinyOtwarcia(podmiot.opening_hours),
      };
    }
  }

  return NextResponse.json(wynik, {
    headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=120" },
  });
}
