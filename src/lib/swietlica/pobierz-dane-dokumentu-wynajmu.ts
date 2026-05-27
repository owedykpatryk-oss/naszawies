import { pojedynczaWies } from "@/lib/supabase/wies-z-zapytania";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { normalizujAkcjeInwentarza, type AkcjaInwentarza } from "./inwentarz-status";
import { parsujPlanZJsonb, type PlanSaliJson } from "./plan-sali";
import { parsujRzutParteruZJsonb, type RzutParteruSaliJson } from "./rzut-parteru-sali";
import { parsujProtokolOdbioru, type ProtokolOdbioruSali } from "./protokol-odbioru";

export type PozycjaAsortymentuDokumentu = {
  kategoria: string;
  nazwa: string;
  ilosc: number;
  opis: string | null;
  image_url: string | null;
  inventory_action: string | null;
};

export type RezerwacjaWDokumencie = {
  id: string;
  numerReferencyjny: string;
  start_at: string;
  end_at: string;
  event_type: string;
  event_title: string | null;
  expected_guests: number;
  wynajmujacy: string | null;
  asortymentZamowiony: PozycjaAsortymentuDokumentu[];
  protokolOdbioru: ProtokolOdbioruSali | null;
};

export type DaneDokumentuWynajmu = {
  wygenerowano: string;
  /** Nr referencyjny dokumentu (czytelny, do druku / korespondencji). */
  numerReferencyjny: string;
  wies: string;
  gmina: string;
  powiat: string;
  wojewodztwo: string;
  /** Sołtys przypisany do wsi w bazie (`villages.soltys_user_id` → `users.display_name`). */
  soltysWsiNazwa: string | null;
  sala: {
    nazwa: string;
    adres: string | null;
    opis: string | null;
    max_capacity: number | null;
    area_m2: number | null;
    parking_spaces: number | null;
    telefon: string | null;
    email: string | null;
    opiekunObiektu: string | null;
  };
  regulamin: string | null;
  regulaminPlikUrl: string | null;
  regulaminPlikNazwa: string | null;
  /** Regulamin placu zabaw — z profilu sołectwa (`villages.playground_rules_text`). */
  regulaminPlacuZabaw: string | null;
  kaucjaPln: number | null;
  cenaMieszkaniec: number | null;
  cenaObcy: number | null;
  /** Sprzęt operacyjny (na sali / do naprawy). */
  asortyment: PozycjaAsortymentuDokumentu[];
  /** Plany zakupów i pozycje do wycofania — informacyjnie. */
  asortymentPlanowany: PozycjaAsortymentuDokumentu[];
  plan: PlanSaliJson | null;
  /** Schemat pomieszczeń od sołtysa (druk / PDF razem z dokumentem). */
  rzutParteru: RzutParteruSaliJson | null;
  dokumentacjaZniszczen: {
    start_at: string;
    end_at: string;
    event_type: string;
    event_title: string | null;
    damage_documentation_urls: string[];
    completion_notes: string | null;
    was_damaged: boolean | null;
  }[];
  /** Gdy dokument generowany dla konkretnej rezerwacji. */
  rezerwacja?: RezerwacjaWDokumencie;
};

const AKCJE_OPERACYJNE = new Set<AkcjaInwentarza>(["in_use", "to_repair"]);

function mapujPozycjeAsortymentu(
  inv: {
    category: string;
    name: string;
    description: string | null;
    quantity: number;
    image_url: string | null;
    inventory_action?: string | null;
  }[]
): { operacyjny: PozycjaAsortymentuDokumentu[]; planowany: PozycjaAsortymentuDokumentu[] } {
  const operacyjny: PozycjaAsortymentuDokumentu[] = [];
  const planowany: PozycjaAsortymentuDokumentu[] = [];
  for (const r of inv) {
    const akcja = normalizujAkcjeInwentarza(r.inventory_action);
    const pozycja: PozycjaAsortymentuDokumentu = {
      kategoria: r.category,
      nazwa: r.name,
      ilosc: r.quantity,
      opis: r.description,
      image_url: r.image_url as string | null,
      inventory_action: akcja,
    };
    if (AKCJE_OPERACYJNE.has(akcja)) operacyjny.push(pozycja);
    else planowany.push(pozycja);
  }
  return { operacyjny, planowany };
}

export async function pobierzDaneDokumentuWynajmu(hallId: string): Promise<DaneDokumentuWynajmu | null> {
  const supabase = utworzKlientaSupabaseSerwer();

  const { data: sala, error } = await supabase
    .from("halls")
    .select(
      "name, description, address, max_capacity, area_m2, parking_spaces, contact_phone, contact_email, caretaker_name, rules_text, rules_file_url, rules_file_name, deposit, price_resident, price_external, layout_data, floor_plan_data, villages(name, commune, county, voivodeship, playground_rules_text, soltys_user_id)"
    )
    .eq("id", hallId)
    .maybeSingle();

  if (error || !sala) {
    return null;
  }

  const wies = pojedynczaWies<{
    name: string;
    commune: string;
    county: string;
    voivodeship: string;
    playground_rules_text: string | null;
    soltys_user_id: string | null;
  }>(sala.villages);

  let soltysWsiNazwa: string | null = null;
  if (wies?.soltys_user_id) {
    const { data: su } = await supabase.from("users").select("display_name").eq("id", wies.soltys_user_id).maybeSingle();
    soltysWsiNazwa = su?.display_name?.trim() ? su.display_name.trim() : null;
  }

  const teraz = new Date();
  const numerReferencyjny = `NW-${teraz.getFullYear()}${String(teraz.getMonth() + 1).padStart(2, "0")}${String(teraz.getDate()).padStart(2, "0")}-${hallId.slice(0, 8).toUpperCase()}`;

  const { data: inv } = await supabase
    .from("hall_inventory")
    .select("category, name, description, quantity, image_url, inventory_action")
    .eq("hall_id", hallId)
    .order("category")
    .order("name");

  const { operacyjny, planowany } = mapujPozycjeAsortymentu(inv ?? []);

  const { data: rezerwacjeZniszczenia } = await supabase
    .from("hall_bookings")
    .select(
      "start_at, end_at, event_type, event_title, damage_documentation_urls, completion_notes, was_damaged"
    )
    .eq("hall_id", hallId)
    .in("status", ["approved", "completed"])
    .order("end_at", { ascending: false })
    .limit(25);

  const dokumentacjaZniszczen = (rezerwacjeZniszczenia ?? [])
    .map((r) => {
      const urls = Array.isArray(r.damage_documentation_urls)
        ? (r.damage_documentation_urls as string[])
        : [];
      return {
        start_at: r.start_at,
        end_at: r.end_at,
        event_type: r.event_type,
        event_title: r.event_title as string | null,
        damage_documentation_urls: urls,
        completion_notes: r.completion_notes as string | null,
        was_damaged: r.was_damaged as boolean | null,
      };
    })
    .filter(
      (w) =>
        w.damage_documentation_urls.length > 0 ||
        (w.completion_notes != null && w.completion_notes.trim().length > 0) ||
        w.was_damaged === true
    );

  return {
    wygenerowano: teraz.toISOString(),
    numerReferencyjny,
    wies: wies?.name ?? "—",
    gmina: wies?.commune ?? "—",
    powiat: wies?.county ?? "—",
    wojewodztwo: wies?.voivodeship ?? "—",
    soltysWsiNazwa,
    sala: {
      nazwa: sala.name,
      adres: sala.address,
      opis: sala.description,
      max_capacity: sala.max_capacity,
      area_m2: sala.area_m2 != null ? Number(sala.area_m2) : null,
      parking_spaces: sala.parking_spaces != null ? Number(sala.parking_spaces) : null,
      telefon: sala.contact_phone as string | null,
      email: sala.contact_email as string | null,
      opiekunObiektu: sala.caretaker_name as string | null,
    },
    regulamin: sala.rules_text,
    regulaminPlikUrl: (sala.rules_file_url as string | null)?.trim() || null,
    regulaminPlikNazwa: (sala.rules_file_name as string | null)?.trim() || null,
    regulaminPlacuZabaw: wies?.playground_rules_text?.trim() ? wies.playground_rules_text.trim() : null,
    kaucjaPln: sala.deposit != null ? Number(sala.deposit) : null,
    cenaMieszkaniec: sala.price_resident != null ? Number(sala.price_resident) : null,
    cenaObcy: sala.price_external != null ? Number(sala.price_external) : null,
    asortyment: operacyjny,
    asortymentPlanowany: planowany,
    plan: parsujPlanZJsonb(sala.layout_data),
    rzutParteru: parsujRzutParteruZJsonb(sala.floor_plan_data),
    dokumentacjaZniszczen,
  };
}

/** Dokument wynajmu powiązany z konkretną rezerwacją (asortyment zamówiony + protokół odbioru). */
export async function pobierzDaneDokumentuWynajmuRezerwacji(
  hallId: string,
  bookingId: string
): Promise<DaneDokumentuWynajmu | null> {
  const baza = await pobierzDaneDokumentuWynajmu(hallId);
  if (!baza) return null;

  const supabase = utworzKlientaSupabaseSerwer();
  const { data: rezerwacja, error } = await supabase
    .from("hall_bookings")
    .select(
      "id, hall_id, booked_by, start_at, end_at, event_type, event_title, expected_guests, requested_inventory, checkout_inspection, status"
    )
    .eq("id", bookingId)
    .eq("hall_id", hallId)
    .maybeSingle();

  if (error || !rezerwacja) return null;
  if (!["approved", "completed"].includes(rezerwacja.status)) return null;

  const requested = Array.isArray(rezerwacja.requested_inventory)
    ? (rezerwacja.requested_inventory as { inventoryId?: string; quantity?: number }[])
    : [];
  const ids = requested.map((x) => x.inventoryId).filter((v): v is string => typeof v === "string");

  let asortymentZamowiony: PozycjaAsortymentuDokumentu[] = [];
  if (ids.length > 0) {
    const { data: invRows } = await supabase
      .from("hall_inventory")
      .select("id, category, name, description, quantity, image_url, inventory_action")
      .in("id", ids);
    const mapa = new Map((invRows ?? []).map((r) => [r.id, r]));
    asortymentZamowiony = requested
      .map((req): PozycjaAsortymentuDokumentu | null => {
        const row = req.inventoryId ? mapa.get(req.inventoryId) : undefined;
        const qty = Number(req.quantity ?? 0);
        if (!row || qty <= 0) return null;
        return {
          kategoria: row.category,
          nazwa: row.name,
          ilosc: qty,
          opis: row.description,
          image_url: row.image_url as string | null,
          inventory_action: normalizujAkcjeInwentarza(row.inventory_action),
        };
      })
      .filter((x): x is PozycjaAsortymentuDokumentu => x != null);
  }

  let wynajmujacy: string | null = null;
  if (rezerwacja.booked_by) {
    const { data: u } = await supabase
      .from("users")
      .select("display_name")
      .eq("id", rezerwacja.booked_by)
      .maybeSingle();
    wynajmujacy = u?.display_name?.trim() || null;
  }

  const numerReferencyjny = `NW-REZ-${bookingId.slice(0, 8).toUpperCase()}`;

  return {
    ...baza,
    numerReferencyjny,
    rezerwacja: {
      id: rezerwacja.id,
      numerReferencyjny,
      start_at: rezerwacja.start_at,
      end_at: rezerwacja.end_at,
      event_type: rezerwacja.event_type,
      event_title: rezerwacja.event_title,
      expected_guests: rezerwacja.expected_guests,
      wynajmujacy,
      asortymentZamowiony,
      protokolOdbioru: parsujProtokolOdbioru(rezerwacja.checkout_inspection),
    },
  };
}
