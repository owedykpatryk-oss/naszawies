import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PanelStronaSoltysa } from "@/components/panel/panel-strona-soltysa";
import { czyUzytkownikJestSoltysemDlaSali } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzUzytkownikaPanelu } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { NawigacjaSali } from "@/components/swietlica/nawigacja-sali";
import { KartaBudynkuSwietlicy } from "@/components/swietlica/karta-budynku-swietlicy";
import { ProfilBudynkuSwietlicyKlient } from "@/components/swietlica/profil-budynku-swietlicy-klient";
import { GaleriaProfiluSwietlicyEdytorKlient } from "@/components/swietlica/galeria-profilu-swietlicy-edytor-klient";
import { parsujZdjeciaProfiluSali } from "@/lib/swietlica/zdjecia-profilu-sali";
import { PlanSaliEdytor } from "@/components/swietlica/plan-sali-edytor";
import { StatystykiSwietlicyKlient } from "@/components/swietlica/statystyki-swietlicy-klient";
import { SoltysOnboardingSwietlicyKlient } from "@/components/swietlica/soltys-onboarding-swietlicy-klient";
import { RegulaminPlacuZabawKlient } from "@/components/swietlica/regulamin-placu-zabaw-klient";
import { RegulaminSaliKlient } from "@/components/swietlica/regulamin-sali-klient";
import { parsujPlanZJsonb, parsujPresetyPlanu } from "@/lib/swietlica/plan-sali";
import { parsujRzutParteruZJsonb } from "@/lib/swietlica/rzut-parteru-sali";
import { wyznaczObszarStolow, znacznikiNaPlanieStolow } from "@/lib/swietlica/mapowanie-rzutu-plan";
import { pojedynczaWies } from "@/lib/supabase/wies-z-zapytania";
import { KalendarzZajetosciSoltysKlient } from "@/components/swietlica/kalendarz-zajetosci-soltys-klient";
import { AsortymentSwietlicyKlient, type PozycjaWyposazenia } from "./asortyment-klient";
import { EdytorPolRezerwacjiKlient } from "@/components/swietlica/edytor-pol-rezerwacji-klient";
import { parsujPolaRezerwacjiSali } from "@/lib/swietlica/pola-rezerwacji";

type Props = { params: { hallId: string } };

export const metadata: Metadata = {
  title: "Zarządzanie salą",
};

export default async function SoltysSwietlicaHallPage({ params }: Props) {
  const hallId = params.hallId;
  const uuidOk = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(hallId);
  if (!uuidOk) {
    notFound();
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const user = await pobierzUzytkownikaPanelu();

  const { data: sala, error: salaErr } = await supabase
    .from("halls")
    .select(
      "id, name, description, address, area_m2, max_capacity, parking_spaces, village_id, layout_data, layout_presets, floor_plan_data, rules_text, rules_file_url, rules_file_name, deposit, price_resident, price_external, contact_phone, contact_email, contact_duty_hours, caretaker_name, booking_form_fields, profile_photos, villages(id, name, playground_rules_text)"
    )
    .eq("id", hallId)
    .maybeSingle();

  if (salaErr || !sala) {
    notFound();
  }

  const wolno = await czyUzytkownikJestSoltysemDlaSali(supabase, user.id, hallId);
  if (!wolno) {
    notFound();
  }

  const wies = pojedynczaWies<{ id: string; name: string; playground_rules_text: string | null }>(sala.villages);
  const podpisWsi = wies?.name ?? "Wieś";

  const { data: inv, error: invErr } = await supabase
    .from("hall_inventory")
    .select(
      "id, category, name, description, quantity, quantity_available, condition, image_url, inventory_action, width_cm, length_cm, height_cm, notes"
    )
    .eq("hall_id", hallId)
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (invErr) {
    console.error("[soltys swietlica hall] inventory", invErr.message);
  }

  const [{ data: rezerwacje }, { data: rezerwacjeStats }] = await Promise.all([
    supabase
      .from("hall_bookings")
      .select("id, start_at, end_at, event_title, event_type, booked_by, contact_phone")
      .eq("hall_id", hallId)
      .eq("status", "approved")
      .order("start_at", { ascending: true }),
    supabase.from("hall_bookings").select("status, expected_guests, layout_data").eq("hall_id", hallId),
  ]);

  const userIds = Array.from(
    new Set((rezerwacje ?? []).map((r) => r.booked_by).filter(Boolean) as string[]),
  );
  const mapaUzytkownikow: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: users } = await supabase.from("users").select("id, display_name").in("id", userIds);
    for (const u of users ?? []) {
      mapaUzytkownikow[u.id] = u.display_name;
    }
  }

  const wpisyKalendarza = (rezerwacje ?? []).map((r) => ({
    id: r.id,
    start_at: r.start_at,
    end_at: r.end_at,
    event_title: r.event_title ?? null,
    event_type: r.event_type ?? "zajete",
    wynajmujacy: r.booked_by ? mapaUzytkownikow[r.booked_by] ?? r.booked_by.slice(0, 8) : null,
    telefon: r.contact_phone ?? null,
  }));

  const pozycje = (inv ?? []) as PozycjaWyposazenia[];
  const plan = parsujPlanZJsonb(sala.layout_data);
  const layoutPresety = parsujPresetyPlanu(sala.layout_presets);
  const rzutParteru = parsujRzutParteruZJsonb(sala.floor_plan_data);
  const znacznikiRzutu = znacznikiNaPlanieStolow(rzutParteru);
  const obszarStolow = wyznaczObszarStolow(rzutParteru);

  const dep = sala.deposit != null ? Number(sala.deposit) : null;
  const pr = sala.price_resident != null ? Number(sala.price_resident) : null;
  const pe = sala.price_external != null ? Number(sala.price_external) : null;
  const areaM2 = sala.area_m2 != null ? Number(sala.area_m2) : null;
  const parkingSpaces = sala.parking_spaces != null ? Number(sala.parking_spaces) : null;

  const wymiaryZRzutu =
    rzutParteru && rzutParteru.bryla_szer_m > 0 && rzutParteru.bryla_gleb_m > 0
      ? { bryla_szer_m: rzutParteru.bryla_szer_m, bryla_gleb_m: rzutParteru.bryla_gleb_m }
      : null;

  const rezerw = rezerwacjeStats ?? [];
  const oczek = rezerw.filter((r) => r.status === "pending").length;
  const zatw = rezerw.filter((r) => r.status === "approved").length;
  const odrz = rezerw.filter((r) => r.status === "rejected").length;
  const goscie = rezerw.map((r) => r.expected_guests).filter((g): g is number => typeof g === "number" && g > 0);
  const sredniaGosci = goscie.length ? Math.round(goscie.reduce((a, b) => a + b, 0) / goscie.length) : null;
  const presetCounts: Record<string, number> = {};
  for (const r of rezerw) {
    const preset =
      r.layout_data && typeof r.layout_data === "object" && r.layout_data !== null
        ? (r.layout_data as { preset?: string }).preset
        : null;
    if (preset) presetCounts[preset] = (presetCounts[preset] ?? 0) + 1;
  }
  const popularnyPreset =
    Object.entries(presetCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const polaRezerwacji = parsujPolaRezerwacjiSali(
    (sala as { booking_form_fields?: unknown }).booking_form_fields,
  );
  const zdjeciaProfilu = parsujZdjeciaProfiluSali((sala as { profile_photos?: unknown }).profile_photos);

  const krokiOnboarding = [
    { id: "profil", label: "Uzupełnij profil budynku (adres, kontakt)", href: `#profil-budynku`, gotowe: Boolean(sala.address?.trim() && sala.contact_phone?.trim()) },
    { id: "zdjecia", label: "Dodaj zdjęcia budynku (sala, kuchnia, plac zabaw…)", href: "#galeria-profilu-swietlicy", gotowe: zdjeciaProfilu.length > 0 },
    { id: "rzut", label: "Zapisz rzut parteru z wejściami/oknami", href: "#rzut-parteru-sali", gotowe: rzutParteru != null },
    { id: "plan", label: "Ustaw plan stołów", href: "#plan-sali-edytor", gotowe: plan.elementy.length > 0 },
    { id: "regulamin", label: "Opublikuj regulamin i ceny", href: "#regulamin-sali", gotowe: Boolean(sala.rules_text?.trim() || sala.rules_file_url) },
    { id: "kalendarz", label: "Uzupełnij kalendarz zajętości", href: "#kalendarz-zajetosci-sali", gotowe: wpisyKalendarza.length > 0 },
    { id: "asortyment", label: "Dodaj asortyment sali", href: "#asortyment-sali", gotowe: pozycje.length > 0 },
  ];

  return (
    <PanelStronaSoltysa
      tytul={sala.name}
      opis={podpisWsi}
      powrotHref="/panel/soltys/swietlica"
      powrotEtykieta="← Wszystkie sale"
      szeroki
      dzieci={
        <>
          <NawigacjaSali hallId={hallId} rola="soltys" />

          <SoltysOnboardingSwietlicyKlient kroki={krokiOnboarding} />

      <StatystykiSwietlicyKlient
        rezerwacjeOczekujace={oczek}
        rezerwacjeZatwierdzone={zatw}
        rezerwacjeOdrzucone={odrz}
        sredniaGosci={sredniaGosci}
        popularnyPreset={popularnyPreset}
      />

      <KalendarzZajetosciSoltysKlient hallId={hallId} wpisy={wpisyKalendarza} />

      <div className="mt-6" id="profil-budynku">
        <KartaBudynkuSwietlicy
          nazwa={sala.name}
          adres={sala.address}
          areaM2={areaM2}
          maxCapacity={sala.max_capacity}
          parkingSpaces={parkingSpaces}
          opis={sala.description}
        />
        <ProfilBudynkuSwietlicyKlient
          hallId={hallId}
          poczatek={{
            address: sala.address,
            area_m2: areaM2,
            max_capacity: sala.max_capacity,
            parking_spaces: parkingSpaces,
            description: sala.description,
            contact_phone: sala.contact_phone,
            contact_email: sala.contact_email,
            contact_duty_hours: sala.contact_duty_hours as string | null,
            caretaker_name: sala.caretaker_name,
          }}
        />
        <GaleriaProfiluSwietlicyEdytorKlient hallId={hallId} poczatkowe={zdjeciaProfilu} />
      </div>

      <div id="plan-sali-edytor">
        <PlanSaliEdytor
          hallId={hallId}
          poczatkowyPlan={plan}
          pojemnoscSali={sala.max_capacity}
          wymiaryZRzutu={wymiaryZRzutu}
          rzutParteru={rzutParteru}
          znacznikiRzutu={znacznikiRzutu}
          obszarStolow={obszarStolow}
          layoutPresety={layoutPresety}
        />
      </div>

      <div id="regulamin-sali">
        <RegulaminSaliKlient
          hallId={hallId}
          rulesTextPoczatek={sala.rules_text}
          rulesFileUrlPoczatek={sala.rules_file_url as string | null}
          rulesFileNamePoczatek={sala.rules_file_name as string | null}
          depositPoczatek={dep}
          priceResidentPoczatek={pr}
          priceExternalPoczatek={pe}
        />
        <EdytorPolRezerwacjiKlient hallId={hallId} poczatkowe={polaRezerwacji} />
      </div>

      {wies?.id ? (
        <RegulaminPlacuZabawKlient
          villageId={wies.id}
          nazwaWsi={podpisWsi}
          regulaminPoczatek={wies.playground_rules_text}
        />
      ) : null}

      <div id="asortyment-sali">
        <AsortymentSwietlicyKlient hallId={hallId} nazwaSali={sala.name} nazwaWsi={podpisWsi} pozycje={pozycje} />
      </div>
        </>
      }
    />
  );
}
