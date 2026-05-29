import { NextResponse } from "next/server";
import { z } from "zod";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import { cenyGusAktualne, historiaProduktuGus } from "@/lib/rolnictwo/grupuj-ceny-gus";
import { MIN_POTWIERDZEN_SPOLECZNYCH } from "@/lib/rolnictwo/produkty-rolne";

const KATEGORIE_ROLNE = ["skup_zboz", "sklep_rolniczy", "sprzedaz_z_gospodarstwa", "spoldzielnia_rolna"];

type Params = { params: { villageId: string } };

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

  const { data: wies } = await supabase
    .from("villages")
    .select("id, name, county, voivodeship, powiat_teryt_kod, latitude, longitude")
    .eq("id", id.data)
    .maybeSingle();

  if (!wies) {
    return NextResponse.json({ blad: "Nie znaleziono wsi." }, { status: 404 });
  }

  const powiatKod = (wies.powiat_teryt_kod as string | null)?.trim() ?? null;

  const [{ data: cenyGus }, { data: cenyLokalne }] = await Promise.all([
    powiatKod
      ? supabase
          .from("agri_ceny_gus")
          .select("product_key, product_label, year, month, value, unit, fetched_at, gus_region_nazwa")
          .eq("powiat_teryt_kod", powiatKod)
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
  ]);

  let poisRolne: {
    id: string;
    name: string;
    category: string;
    latitude: number | string | null;
    longitude: number | string | null;
    phone: string | null;
    opening_hours: unknown;
    village_id?: string;
  }[] = [];

  if (powiatKod) {
    const { data: wsiePowiat } = await supabase
      .from("villages")
      .select("id")
      .eq("powiat_teryt_kod", powiatKod)
      .limit(400);

    const idsPowiat = (wsiePowiat ?? []).map((w) => w.id);
    if (idsPowiat.length > 0) {
      const { data: poisPowiat } = await supabase
        .from("pois")
        .select("id, name, category, latitude, longitude, phone, opening_hours, village_id")
        .in("village_id", idsPowiat)
        .in("category", KATEGORIE_ROLNE)
        .order("name")
        .limit(50);

      const widziane = new Set<string>();
      const zWsi: typeof poisRolne = [];
      const zPowiatu: typeof poisRolne = [];
      for (const p of poisPowiat ?? []) {
        if (widziane.has(p.id)) continue;
        widziane.add(p.id);
        if (p.village_id === id.data) zWsi.push(p);
        else zPowiatu.push(p);
      }
      poisRolne = [...zWsi, ...zPowiatu].slice(0, 30);
    }
  } else {
    const { data: poisWies } = await supabase
      .from("pois")
      .select("id, name, category, latitude, longitude, phone, opening_hours, village_id")
      .eq("village_id", id.data)
      .in("category", KATEGORIE_ROLNE)
      .order("name");
    poisRolne = poisWies ?? [];
  }

  const wierszeGus = cenyGus ?? [];
  const cenyZWiarygodnoscia = (cenyLokalne ?? []).map((c) => ({
    ...c,
    zweryfikowane_spolecznie: (c.confirmation_count ?? 1) >= MIN_POTWIERDZEN_SPOLECZNYCH,
  }));

  return NextResponse.json(
    {
      wies: {
        name: wies.name,
        county: wies.county,
        voivodeship: wies.voivodeship,
        powiat_teryt_kod: powiatKod,
        regionGus: wierszeGus[0]?.gus_region_nazwa ?? wies.county,
      },
      cenyGus: wierszeGus,
      cenyGusAktualne: cenyGusAktualne(wierszeGus),
      historiaGus: historiaProduktuGus(wierszeGus, produktWykres),
      produktWykres,
      poisRolne,
      poisZPowiatu: poisRolne.some((p) => p.village_id && p.village_id !== id.data),
      cenyLokalne: cenyZWiarygodnoscia,
      minPotwierdzen: MIN_POTWIERDZEN_SPOLECZNYCH,
      disclaimer:
        "Średnia GUS to orientacja statystyczna dla regionu (NUTS2), nie cena w konkretnym skupie w Twoim powiecie. Opóźnienie ok. 1 miesiąca. Zawsze potwierdź telefonicznie przed wywozem.",
    },
    { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" } },
  );
}
