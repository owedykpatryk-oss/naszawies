import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { czyUzytkownikJestSoltysemDlaSali } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { NawigacjaSali } from "@/components/swietlica/nawigacja-sali";
import { KartaBudynkuSwietlicy } from "@/components/swietlica/karta-budynku-swietlicy";
import { ProfilBudynkuSwietlicyKlient } from "@/components/swietlica/profil-budynku-swietlicy-klient";
import { EdytorRzutuParteruSaliKlient } from "@/components/swietlica/edytor-rzutu-parteru-sali-klient";
import { PlanSaliEdytor } from "@/components/swietlica/plan-sali-edytor";
import { StatystykiSwietlicyKlient } from "@/components/swietlica/statystyki-swietlicy-klient";
import { SoltysOnboardingSwietlicyKlient } from "@/components/swietlica/soltys-onboarding-swietlicy-klient";
import { RegulaminPlacuZabawKlient } from "@/components/swietlica/regulamin-placu-zabaw-klient";
import { RegulaminSaliKlient } from "@/components/swietlica/regulamin-sali-klient";
import { parsujPlanZJsonb, parsujPresetyPlanu } from "@/lib/swietlica/plan-sali";
import { parsujRzutParteruZJsonb } from "@/lib/swietlica/rzut-parteru-sali";
import { wyznaczObszarStolow, znacznikiNaPlanieStolow } from "@/lib/swietlica/mapowanie-rzutu-plan";
import { pojedynczaWies } from "@/lib/supabase/wies-z-zapytania";
import { AsortymentSwietlicyKlient, type PozycjaWyposazenia } from "./asortyment-klient";

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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/logowanie?next=/panel/soltys/swietlica/${hallId}`);
  }

  const { data: sala, error: salaErr } = await supabase
    .from("halls")
    .select(
      "id, name, description, address, area_m2, max_capacity, parking_spaces, village_id, layout_data, layout_presets, floor_plan_data, rules_text, rules_file_url, rules_file_name, deposit, price_resident, price_external, contact_phone, contact_email, contact_duty_hours, caretaker_name, villages(id, name, playground_rules_text)"
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

  const { data: rezerwacje } = await supabase
    .from("hall_bookings")
    .select("status, expected_guests, layout_data")
    .eq("hall_id", hallId);

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

  const rezerw = rezerwacje ?? [];
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

  const krokiOnboarding = [
    { id: "profil", label: "Uzupełnij profil budynku (adres, kontakt)", href: `#profil-budynku`, gotowe: Boolean(sala.address?.trim() && sala.contact_phone?.trim()) },
    { id: "rzut", label: "Zapisz rzut parteru z wejściami/oknami", href: "#rzut-parteru-sali", gotowe: rzutParteru != null },
    { id: "plan", label: "Ustaw plan stołów", href: "#plan-sali-edytor", gotowe: plan.elementy.length > 0 },
    { id: "regulamin", label: "Opublikuj regulamin i ceny", href: "#regulamin-sali", gotowe: Boolean(sala.rules_text?.trim() || sala.rules_file_url) },
    { id: "asortyment", label: "Dodaj asortyment sali", href: "#asortyment-sali", gotowe: pozycje.length > 0 },
  ];

  return (
    <main>
      <p className="mb-4 text-sm text-stone-500">
        <Link href="/panel/soltys/swietlica" className="text-green-800 underline">
          ← Wszystkie sale
        </Link>
      </p>
      <NawigacjaSali hallId={hallId} rola="soltys" />
      <h1 className="tytul-sekcji-panelu">{sala.name}</h1>
      <p className="mt-1 text-sm text-stone-600">{podpisWsi}</p>

      <SoltysOnboardingSwietlicyKlient kroki={krokiOnboarding} />

      <StatystykiSwietlicyKlient
        rezerwacjeOczekujace={oczek}
        rezerwacjeZatwierdzone={zatw}
        rezerwacjeOdrzucone={odrz}
        sredniaGosci={sredniaGosci}
        popularnyPreset={popularnyPreset}
      />

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
      </div>

      <EdytorRzutuParteruSaliKlient hallId={hallId} poczatkowyRzut={rzutParteru} />

      <div id="plan-sali-edytor">
        <PlanSaliEdytor
          hallId={hallId}
          poczatkowyPlan={plan}
          pojemnoscSali={sala.max_capacity}
          wymiaryZRzutu={wymiaryZRzutu}
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
    </main>
  );
}
