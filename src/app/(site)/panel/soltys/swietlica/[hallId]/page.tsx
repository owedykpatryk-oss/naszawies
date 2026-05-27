import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { czyUzytkownikJestSoltysemDlaSali } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { NawigacjaSali } from "@/components/swietlica/nawigacja-sali";
import { KartaBudynkuSwietlicy } from "@/components/swietlica/karta-budynku-swietlicy";
import { ProfilBudynkuSwietlicyKlient } from "@/components/swietlica/profil-budynku-swietlicy-klient";
import { GeneratorRzutuParteruSaliKlient } from "@/components/swietlica/generator-rzutu-parteru-sali-klient";
import { PlanSaliEdytor } from "@/components/swietlica/plan-sali-edytor";
import { RegulaminPlacuZabawKlient } from "@/components/swietlica/regulamin-placu-zabaw-klient";
import { RegulaminSaliKlient } from "@/components/swietlica/regulamin-sali-klient";
import { parsujPlanZJsonb } from "@/lib/swietlica/plan-sali";
import { parsujRzutParteruZJsonb } from "@/lib/swietlica/rzut-parteru-sali";
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
      "id, name, description, address, area_m2, max_capacity, parking_spaces, village_id, layout_data, floor_plan_data, rules_text, rules_file_url, rules_file_name, deposit, price_resident, price_external, contact_phone, contact_email, caretaker_name, villages(id, name, playground_rules_text)"
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

  const pozycje = (inv ?? []) as PozycjaWyposazenia[];
  const plan = parsujPlanZJsonb(sala.layout_data);
  const rzutParteru = parsujRzutParteruZJsonb(sala.floor_plan_data);
  const dep = sala.deposit != null ? Number(sala.deposit) : null;
  const pr = sala.price_resident != null ? Number(sala.price_resident) : null;
  const pe = sala.price_external != null ? Number(sala.price_external) : null;
  const areaM2 = sala.area_m2 != null ? Number(sala.area_m2) : null;
  const parkingSpaces = sala.parking_spaces != null ? Number(sala.parking_spaces) : null;

  const wymiaryZRzutu =
    rzutParteru && rzutParteru.bryla_szer_m > 0 && rzutParteru.bryla_gleb_m > 0
      ? { bryla_szer_m: rzutParteru.bryla_szer_m, bryla_gleb_m: rzutParteru.bryla_gleb_m }
      : null;

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

      <div className="mt-6">
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
            caretaker_name: sala.caretaker_name,
          }}
        />
      </div>

      <GeneratorRzutuParteruSaliKlient hallId={hallId} poczatkowyRzut={rzutParteru} />

      <PlanSaliEdytor
        hallId={hallId}
        poczatkowyPlan={plan}
        pojemnoscSali={sala.max_capacity}
        wymiaryZRzutu={wymiaryZRzutu}
      />

      <RegulaminSaliKlient
        hallId={hallId}
        rulesTextPoczatek={sala.rules_text}
        rulesFileUrlPoczatek={sala.rules_file_url as string | null}
        rulesFileNamePoczatek={sala.rules_file_name as string | null}
        depositPoczatek={dep}
        priceResidentPoczatek={pr}
        priceExternalPoczatek={pe}
      />

      {wies?.id ? (
        <RegulaminPlacuZabawKlient
          villageId={wies.id}
          nazwaWsi={podpisWsi}
          regulaminPoczatek={wies.playground_rules_text}
        />
      ) : null}

      <AsortymentSwietlicyKlient hallId={hallId} nazwaSali={sala.name} nazwaWsi={podpisWsi} pozycje={pozycje} />
    </main>
  );
}
