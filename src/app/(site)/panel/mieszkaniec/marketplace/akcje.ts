"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { geokodujLokalizacjeTekst } from "@/lib/marketplace/geokoduj-lokalizacje";
import {
  mapujPolaRozszerzoneDoWiersza,
  schemaPolaRozszerzoneOgloszenia,
  type PolaRozszerzoneOgloszenia,
} from "@/lib/marketplace/schema-pola-rozszerzone";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

const uuid = z.string().uuid();

const schema = z.object({
  villageId: z.string().uuid(),
  listingType: z.enum(["sprzedam", "kupie", "oddam", "usluga", "praca", "wynajme", "wypozycze"]),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(8000),
  equipmentCategory: z.string().trim().max(40).optional().nullable(),
  priceAmount: z.number().nonnegative().optional().nullable(),
  priceUnit: z.string().trim().max(20).optional().nullable(),
  withOperator: z.boolean(),
  phone: z.string().trim().max(30).optional().nullable(),
  locationText: z.string().trim().max(200).optional().nullable(),
  imageUrls: z.array(z.string().url().max(2048)).max(3),
  dniWaznosci: z.number().int().min(7).max(90).optional(),
}).merge(schemaPolaRozszerzoneOgloszenia);

const schemaPozycjaKgw = z.object({
  listingType: z.enum(["sprzedam", "kupie", "oddam", "usluga", "praca", "wynajme", "wypozycze"]),
  title: z.string().trim().min(3).max(120),
  equipmentCategory: z.string().trim().max(40).optional().nullable(),
  priceAmount: z.number().nonnegative().optional().nullable(),
});

const schemaPakietKgw = z.object({
  villageId: z.string().uuid(),
  pozycje: z.array(schemaPozycjaKgw).min(1).max(6),
});

export type WynikMarketplace = { blad: string } | { ok: true; id?: string };

async function wspolrzedneDlaOgloszenia(
  supabase: ReturnType<typeof utworzKlientaSupabaseSerwer>,
  villageId: string,
  locationText: string | null | undefined,
  pola: PolaRozszerzoneOgloszenia,
): Promise<{ latitude: number | null; longitude: number | null }> {
  if (pola.latitude != null && pola.longitude != null) {
    return { latitude: pola.latitude, longitude: pola.longitude };
  }
  const tekst = locationText?.trim();
  if (!tekst || tekst.length < 3) {
    return { latitude: pola.latitude ?? null, longitude: pola.longitude ?? null };
  }
  const { data: wies } = await supabase.from("villages").select("name").eq("id", villageId).maybeSingle();
  const geo = await geokodujLokalizacjeTekst(tekst, wies?.name ?? null);
  if (!geo) return { latitude: null, longitude: null };
  return { latitude: geo.latitude, longitude: geo.longitude };
}

export async function dodajOgloszenieMarketplaceMieszkanca(
  body: z.infer<typeof schema>,
): Promise<WynikMarketplace> {
  const p = schema.safeParse(body);
  if (!p.success) return { blad: "Sprawdź dane ogłoszenia (tytuł, opis, max 3 zdjęcia)." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const dni = p.data.dniWaznosci ?? 30;
  const expires = new Date();
  expires.setDate(expires.getDate() + dni);

  const gps = await wspolrzedneDlaOgloszenia(supabase, p.data.villageId, p.data.locationText, p.data);
  const polaRozszerzone = {
    ...mapujPolaRozszerzoneDoWiersza(p.data),
    latitude: gps.latitude,
    longitude: gps.longitude,
  };

  const { data: wstaw, error } = await supabase
    .from("marketplace_listings")
    .insert({
      village_id: p.data.villageId,
      owner_user_id: user.id,
      listing_type: p.data.listingType,
      title: p.data.title,
      description: p.data.description,
      category: p.data.equipmentCategory?.length ? p.data.equipmentCategory : null,
      equipment_category: p.data.equipmentCategory?.length ? p.data.equipmentCategory : null,
      price_amount: p.data.priceAmount ?? null,
      price_unit: p.data.priceUnit?.length ? p.data.priceUnit : null,
      with_operator: p.data.withOperator,
      phone: p.data.phone?.length ? p.data.phone : null,
      location_text: p.data.locationText?.length ? p.data.locationText : null,
      image_urls: p.data.imageUrls.length ? p.data.imageUrls : [],
      status: "pending",
      expires_at: expires.toISOString(),
      ...polaRozszerzone,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[dodajOgloszenieMarketplaceMieszkanca]", error.message);
    return { blad: "Nie udało się dodać ogłoszenia." };
  }

  revalidatePath("/panel/mieszkaniec/marketplace");
  revalidatePath("/panel/soltys");
  revalidatePath("/mapa");
  return { ok: true, id: wstaw?.id };
}

const schemaEdycja = schema.extend({
  listingId: z.string().uuid(),
});

async function revalidateRynekDlaWsi(
  supabase: ReturnType<typeof utworzKlientaSupabaseSerwer>,
  villageId: string,
  listingId?: string,
) {
  const { data: v } = await supabase
    .from("villages")
    .select("voivodeship, county, commune, slug")
    .eq("id", villageId)
    .maybeSingle();
  if (v?.slug) {
    const sciezka = sciezkaProfiluWsi(v);
    revalidatePath(sciezka);
    revalidatePath(`${sciezka}/rynek`);
    if (listingId) revalidatePath(`${sciezka}/rynek/${listingId}`);
  }
}

export async function edytujOgloszenieMarketplaceMieszkanca(
  body: z.infer<typeof schemaEdycja>,
): Promise<WynikMarketplace> {
  const p = schemaEdycja.safeParse(body);
  if (!p.success) return { blad: "Sprawdź dane ogłoszenia." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const { data: row } = await supabase
    .from("marketplace_listings")
    .select("id, owner_user_id, village_id, status")
    .eq("id", p.data.listingId)
    .maybeSingle();

  if (!row || row.owner_user_id !== user.id) return { blad: "Nie znaleziono ogłoszenia." };
  if (!["pending", "approved", "rejected"].includes(row.status)) {
    return { blad: "Tego ogłoszenia nie można już edytować." };
  }

  const nowyStatus = row.status === "approved" ? "pending" : row.status;

  const gps = await wspolrzedneDlaOgloszenia(supabase, row.village_id, p.data.locationText, p.data);
  const polaRozszerzone = {
    ...mapujPolaRozszerzoneDoWiersza(p.data),
    latitude: gps.latitude,
    longitude: gps.longitude,
  };

  const { error } = await supabase
    .from("marketplace_listings")
    .update({
      listing_type: p.data.listingType,
      title: p.data.title,
      description: p.data.description,
      category: p.data.equipmentCategory?.length ? p.data.equipmentCategory : null,
      equipment_category: p.data.equipmentCategory?.length ? p.data.equipmentCategory : null,
      price_amount: p.data.priceAmount ?? null,
      price_unit: p.data.priceUnit?.length ? p.data.priceUnit : null,
      with_operator: p.data.withOperator,
      phone: p.data.phone?.length ? p.data.phone : null,
      location_text: p.data.locationText?.length ? p.data.locationText : null,
      image_urls: p.data.imageUrls.length ? p.data.imageUrls : [],
      status: nowyStatus,
      moderated_by: null,
      moderated_at: null,
      moderation_note: null,
      seller_verified: false,
      updated_at: new Date().toISOString(),
      ...polaRozszerzone,
    })
    .eq("id", p.data.listingId);

  if (error) {
    console.error("[edytujOgloszenieMarketplaceMieszkanca]", error.message);
    return { blad: "Nie udało się zapisać zmian." };
  }

  revalidatePath("/panel/mieszkaniec/marketplace");
  revalidatePath(`/panel/mieszkaniec/marketplace/${p.data.listingId}/edytuj`);
  revalidatePath("/panel/soltys");
  revalidatePath("/mapa");
  await revalidateRynekDlaWsi(supabase, row.village_id, p.data.listingId);
  return { ok: true, id: p.data.listingId };
}

export async function archiwizujOgloszenieMarketplaceMieszkanca(listingId: string): Promise<WynikMarketplace> {
  const id = uuid.safeParse(listingId);
  if (!id.success) return { blad: "Niepoprawny identyfikator." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const { data: row } = await supabase
    .from("marketplace_listings")
    .select("id, owner_user_id, village_id, status")
    .eq("id", id.data)
    .maybeSingle();

  if (!row || row.owner_user_id !== user.id) return { blad: "Nie znaleziono ogłoszenia." };

  const { error } = await supabase
    .from("marketplace_listings")
    .update({
      status: "archived",
      archived_at: new Date().toISOString(),
    })
    .eq("id", id.data);

  if (error) return { blad: "Nie udało się zarchiwizować ogłoszenia." };

  revalidatePath("/panel/mieszkaniec/marketplace");
  revalidatePath("/panel/soltys");
  await revalidateRynekDlaWsi(supabase, row.village_id, id.data);
  return { ok: true };
}

export async function przedluzWaznoscOgloszeniaMarketplace(
  listingId: string,
  dni: number = 30,
): Promise<WynikMarketplace> {
  const id = uuid.safeParse(listingId);
  const dniOk = z.number().int().min(7).max(90).safeParse(dni);
  if (!id.success || !dniOk.success) return { blad: "Niepoprawne dane." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const { data: row } = await supabase
    .from("marketplace_listings")
    .select("id, owner_user_id, village_id, status")
    .eq("id", id.data)
    .maybeSingle();

  if (!row || row.owner_user_id !== user.id) return { blad: "Nie znaleziono ogłoszenia." };
  if (row.status !== "approved") return { blad: "Przedłużyć można tylko opublikowane ogłoszenie." };

  const expires = new Date();
  expires.setDate(expires.getDate() + dniOk.data);

  const { error } = await supabase
    .from("marketplace_listings")
    .update({ expires_at: expires.toISOString() })
    .eq("id", id.data);

  if (error) return { blad: "Nie udało się przedłużyć ważności." };

  revalidatePath("/panel/mieszkaniec/marketplace");
  await revalidateRynekDlaWsi(supabase, row.village_id, id.data);
  return { ok: true };
}

export async function dodajPakietOgloszenKgw(body: z.infer<typeof schemaPakietKgw>): Promise<WynikMarketplace> {
  const p = schemaPakietKgw.safeParse(body);
  if (!p.success) return { blad: "Sprawdź szablon (1–6 pozycji)." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const expires = new Date();
  expires.setDate(expires.getDate() + 30);

  const wstaw = p.data.pozycje.map((poz) => ({
    village_id: p.data.villageId,
    owner_user_id: user.id,
    listing_type: poz.listingType,
    title: poz.title,
    description: `${poz.title} — oferta z szablonu KGW / gospodarstwa. Uzupełnij szczegóły po zatwierdzeniu w edycji ogłoszenia.`,
    category: poz.equipmentCategory?.length ? poz.equipmentCategory : null,
    equipment_category: poz.equipmentCategory?.length ? poz.equipmentCategory : null,
    price_amount: poz.priceAmount ?? null,
    currency: "PLN",
    status: "pending" as const,
    expires_at: expires.toISOString(),
    image_urls: [] as string[],
  }));

  const { error } = await supabase.from("marketplace_listings").insert(wstaw);
  if (error) {
    console.error("[dodajPakietOgloszenKgw]", error.message);
    return { blad: "Nie udało się dodać pakietu ogłoszeń." };
  }

  revalidatePath("/panel/mieszkaniec/marketplace");
  revalidatePath("/panel/soltys");
  return { ok: true };
}
