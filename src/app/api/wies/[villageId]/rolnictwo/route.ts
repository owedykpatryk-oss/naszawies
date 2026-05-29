import { NextResponse } from "next/server";
import { z } from "zod";
import { pobierzPsrGminy } from "@/lib/gus/pobierz-dane-gus-wies";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import { cenyGusAktualne, historiaProduktuGus } from "@/lib/rolnictwo/grupuj-ceny-gus";
import { MIN_POTWIERDZEN_SPOLECZNYCH } from "@/lib/rolnictwo/produkty-rolne";

const KATEGORIE_ROLNE = ["skup_zboz", "sklep_rolniczy", "sprzedaz_z_gospodarstwa", "spoldzielnia_rolna"];

type Params = { params: { villageId: string } };

type PoiRolny = {
  id: string;
  name: string;
  category: string;
  latitude: number | string | null;
  longitude: number | string | null;
  phone: string | null;
  opening_hours: unknown;
  village_id?: string;
};

function uporzadkujPoisRolne(
  wiersze: PoiRolny[] | null,
  villageId: string,
): { pois: PoiRolny[]; zPowiatu: boolean } {
  const widziane = new Set<string>();
  const zWsi: PoiRolny[] = [];
  const zPowiatu: PoiRolny[] = [];
  for (const p of wiersze ?? []) {
    if (widziane.has(p.id)) continue;
    widziane.add(p.id);
    if (p.village_id === villageId) zWsi.push(p);
    else zPowiatu.push(p);
  }
  return {
    pois: [...zWsi, ...zPowiatu].slice(0, 30),
    zPowiatu: zPowiatu.length > 0,
  };
}

export async function GET(req: Request, { params }: Params) {
  const id = z.string().uuid().safeParse(params.villageId);
  if (!id.success) {
    return NextResponse.json({ blad: "Nieprawidłowy identyfikator wsi." }, { status: 400 });
  }

  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ blad: "Usługa chwilowo niedostępna." }, { status: 503 });
  }

  const url = new URL(req.url);
  const produktWykres = url.searchParams.get("produkt")?.trim() || "pszenica";
  const minRokGus = new Date().getFullYear() - 1;

  const { data: wies } = await supabase
    .from("villages")
    .select(
      "id, name, county, commune, voivodeship, powiat_teryt_kod, gmina_teryt_kod, latitude, longitude, population, gmina_population, gmina_population_rok, gmina_population_zrodlo",
    )
    .eq("id", id.data)
    .maybeSingle();

  if (!wies) {
    return NextResponse.json({ blad: "Nie znaleziono wsi." }, { status: 404 });
  }

  const powiatKod = (wies.powiat_teryt_kod as string | null)?.trim() ?? null;
  const gminaTeryt = (wies.gmina_teryt_kod as string | null)?.trim() ?? null;

  const poisPromise = powiatKod
    ? supabase
        .from("pois")
        .select(
          "id, name, category, latitude, longitude, phone, opening_hours, village_id, villages!inner(powiat_teryt_kod)",
        )
        .eq("villages.powiat_teryt_kod", powiatKod)
        .in("category", KATEGORIE_ROLNE)
        .order("name")
        .limit(50)
    : supabase
        .from("pois")
        .select("id, name, category, latitude, longitude, phone, opening_hours, village_id")
        .eq("village_id", id.data)
        .in("category", KATEGORIE_ROLNE)
        .order("name");

  const [{ data: cenyGus }, { data: cenyLokalne }, psrGminy, { data: poisRaw }] = await Promise.all([
    powiatKod
      ? supabase
          .from("agri_ceny_gus")
          .select(
            "product_key, product_label, year, month, value, unit, fetched_at, gus_region_nazwa, gus_channel",
          )
          .eq("powiat_teryt_kod", powiatKod)
          .gte("year", minRokGus)
          .order("year", { ascending: true })
          .order("month", { ascending: true })
      : Promise.resolve({ data: [] }),
    supabase
      .from("agri_ceny_lokalne")
      .select(
        "id, product_key, price_value, price_unit, place_name, place_lat, place_lon, observed_at, notes, confirmation_count, poi_id, created_at",
      )
      .eq("village_id", id.data)
      .order("observed_at", { ascending: false })
      .limit(40),
    pobierzPsrGminy(gminaTeryt),
    poisPromise,
  ]);

  const { pois: poisRolne, zPowiatu: poisZPowiatu } = uporzadkujPoisRolne(
    (poisRaw ?? []) as PoiRolny[],
    id.data,
  );

  const wierszeGus = cenyGus ?? [];
  const cenyZWiarygodnoscia = (cenyLokalne ?? []).map((c) => ({
    ...c,
    zweryfikowane_spolecznie: (c.confirmation_count ?? 1) >= MIN_POTWIERDZEN_SPOLECZNYCH,
  }));

  return NextResponse.json(
    {
      wies: {
        name: wies.name,
        commune: wies.commune,
        county: wies.county,
        voivodeship: wies.voivodeship,
        powiat_teryt_kod: powiatKod,
        regionGus: wierszeGus[0]?.gus_region_nazwa ?? wies.county,
        population: wies.population,
        gmina_population: wies.gmina_population,
        gmina_population_rok: wies.gmina_population_rok,
        gmina_population_zrodlo: wies.gmina_population_zrodlo,
      },
      psrGminy,
      cenyGus: wierszeGus,
      cenyGusAktualne: cenyGusAktualne(wierszeGus, "skup"),
      cenyTargAktualne: cenyGusAktualne(wierszeGus, "targ"),
      historiaGusSkup: historiaProduktuGus(wierszeGus, produktWykres, 12, "skup"),
      historiaGusTarg: historiaProduktuGus(wierszeGus, produktWykres, 12, "targ"),
      historiaGus: historiaProduktuGus(wierszeGus, produktWykres, 12, "skup"),
      produktWykres,
      poisRolne,
      poisZPowiatu,
      cenyLokalne: cenyZWiarygodnoscia,
      minPotwierdzen: MIN_POTWIERDZEN_SPOLECZNYCH,
      disclaimer:
        "Średnie GUS to orientacja statystyczna dla regionu (NUTS2): skup (P2967) i targowiska (P2968). Opóźnienie ok. 1 miesiąca. Zawsze potwierdź telefonicznie przed wywozem.",
    },
    { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" } },
  );
}
