import { pojedynczaWies } from "@/lib/supabase/wies-z-zapytania";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { parsujPlanZJsonb, type PlanSaliJson } from "./plan-sali";
import { parsujRzutParteruZJsonb, type RzutParteruSaliJson } from "./rzut-parteru-sali";

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
    telefon: string | null;
    email: string | null;
    opiekunObiektu: string | null;
  };
  regulamin: string | null;
  /** Regulamin placu zabaw — z profilu sołectwa (`villages.playground_rules_text`). */
  regulaminPlacuZabaw: string | null;
  kaucjaPln: number | null;
  cenaMieszkaniec: number | null;
  cenaObcy: number | null;
  asortyment: { kategoria: string; nazwa: string; ilosc: number; opis: string | null; image_url: string | null }[];
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
};

export async function pobierzDaneDokumentuWynajmu(hallId: string): Promise<DaneDokumentuWynajmu | null> {
  const supabase = utworzKlientaSupabaseSerwer();

  const { data: sala, error } = await supabase
    .from("halls")
    .select(
      "name, description, address, max_capacity, area_m2, contact_phone, contact_email, caretaker_name, rules_text, deposit, price_resident, price_external, layout_data, floor_plan_data, villages(name, commune, county, voivodeship, playground_rules_text, soltys_user_id)"
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
    .select("category, name, description, quantity, image_url")
    .eq("hall_id", hallId)
    .order("category")
    .order("name");

  const asortyment = (inv ?? []).map((r) => ({
    kategoria: r.category,
    nazwa: r.name,
    ilosc: r.quantity,
    opis: r.description,
    image_url: r.image_url as string | null,
  }));

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
      telefon: sala.contact_phone as string | null,
      email: sala.contact_email as string | null,
      opiekunObiektu: sala.caretaker_name as string | null,
    },
    regulamin: sala.rules_text,
    regulaminPlacuZabaw: wies?.playground_rules_text?.trim() ? wies.playground_rules_text.trim() : null,
    kaucjaPln: sala.deposit != null ? Number(sala.deposit) : null,
    cenaMieszkaniec: sala.price_resident != null ? Number(sala.price_resident) : null,
    cenaObcy: sala.price_external != null ? Number(sala.price_external) : null,
    asortyment,
    plan: parsujPlanZJsonb(sala.layout_data),
    rzutParteru: parsujRzutParteruZJsonb(sala.floor_plan_data),
    dokumentacjaZniszczen,
  };
}
