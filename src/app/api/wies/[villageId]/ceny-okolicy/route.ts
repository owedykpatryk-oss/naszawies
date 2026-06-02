import { NextResponse } from "next/server";
import { z } from "zod";
import {
  KLUCZE_PRODUKTOW_OPAL,
  MIN_POTWIERDZEN_SPOLECZNYCH,
  etykietaProduktuLokalnego,
} from "@/lib/ceny/produkty-lokalne";
import {
  najtanszeStacje,
  pobierzStatystykiPaliwKraj,
  stacjePaliwWOkolicy,
} from "@/lib/paliwa/stacje-w-okolicy";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";

type Params = { params: { villageId: string } };

type CenaLokalnaOpal = {
  id: string;
  product_key: string;
  product_label: string;
  price_value: number;
  price_unit: string;
  place_name: string;
  observed_at: string;
  notes: string | null;
  confirmation_count: number;
  zweryfikowane_spolecznie: boolean;
};

export async function GET(_req: Request, { params }: Params) {
  const id = z.string().uuid().safeParse(params.villageId);
  if (!id.success) {
    return NextResponse.json({ blad: "Nieprawidłowy identyfikator wsi." }, { status: 400 });
  }

  const supabase = createPublicSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ blad: "Usługa chwilowo niedostępna." }, { status: 503 });
  }

  const { data: wies } = await supabase
    .from("villages")
    .select("id, name, latitude, longitude")
    .eq("id", id.data)
    .maybeSingle();

  if (!wies) {
    return NextResponse.json({ blad: "Nie znaleziono wsi." }, { status: 404 });
  }

  const lat = wies.latitude != null ? Number(wies.latitude) : null;
  const lon = wies.longitude != null ? Number(wies.longitude) : null;

  const [statystyki, cenyOpalRaw] = await Promise.all([
    pobierzStatystykiPaliwKraj(supabase),
    supabase
      .from("agri_ceny_lokalne")
      .select(
        "id, product_key, price_value, price_unit, place_name, observed_at, notes, confirmation_count",
      )
      .eq("village_id", id.data)
      .in("product_key", KLUCZE_PRODUKTOW_OPAL)
      .order("observed_at", { ascending: false })
      .limit(30),
  ]);

  let stacje: Awaited<ReturnType<typeof stacjePaliwWOkolicy>> = [];
  let najtansze = { pb95: [] as typeof stacje, on: [] as typeof stacje, lpg: [] as typeof stacje };

  if (lat != null && lon != null && Number.isFinite(lat) && Number.isFinite(lon)) {
    stacje = await stacjePaliwWOkolicy(supabase, lat, lon, 25);
    najtansze = {
      pb95: najtanszeStacje(stacje, "pb95", 5),
      on: najtanszeStacje(stacje, "on", 5),
      lpg: najtanszeStacje(stacje, "lpg", 5),
    };
  }

  const cenyOpal: CenaLokalnaOpal[] = (cenyOpalRaw.data ?? []).map((c) => ({
    id: c.id as string,
    product_key: c.product_key as string,
    product_label: etykietaProduktuLokalnego(c.product_key as string),
    price_value: Number(c.price_value),
    price_unit: c.price_unit as string,
    place_name: c.place_name as string,
    observed_at: c.observed_at as string,
    notes: (c.notes as string | null) ?? null,
    confirmation_count: Number(c.confirmation_count),
    zweryfikowane_spolecznie: Number(c.confirmation_count) >= MIN_POTWIERDZEN_SPOLECZNYCH,
  }));

  return NextResponse.json({
    wies: { name: wies.name as string, maWspolrzedne: lat != null && lon != null },
    statystyki,
    stacjeWKola: stacje.length,
    promienKm: 25,
    najtansze,
    cenyOpal,
    minPotwierdzen: MIN_POTWIERDZEN_SPOLECZNYCH,
    zrodloPaliw: "BenzynaMAPA",
    disclaimer:
      "Ceny paliw pochodzą z serwisu BenzynaMAPA (aktualizacja kilka razy dziennie) — orientacyjnie, przed tankowaniem sprawdź cenę na stacji. Opał i pellet zgłaszają mieszkańcy; im więcej potwierdzeń, tym większa wiarygodność.",
  });
}
