import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { NawigacjaSali } from "@/components/swietlica/nawigacja-sali";
import { PlanSaliEdytor } from "@/components/swietlica/plan-sali-edytor";
import { RegulaminPlacuZabawKlient } from "@/components/swietlica/regulamin-placu-zabaw-klient";
import { RegulaminSaliKlient } from "@/components/swietlica/regulamin-sali-klient";
import { parsujPlanZJsonb } from "@/lib/swietlica/plan-sali";
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
      "id, name, description, address, max_capacity, village_id, layout_data, rules_text, deposit, price_resident, price_external, villages(id, name, playground_rules_text)"
    )
    .eq("id", hallId)
    .maybeSingle();

  if (salaErr || !sala) {
    notFound();
  }

  const wies = pojedynczaWies<{ id: string; name: string; playground_rules_text: string | null }>(sala.villages);
  const podpisWsi = wies?.name ?? "Wieś";

  const { data: inv, error: invErr } = await supabase
    .from("hall_inventory")
    .select("id, category, name, description, quantity, quantity_available, condition, image_url")
    .eq("hall_id", hallId)
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (invErr) {
    console.error("[soltys swietlica hall] inventory", invErr.message);
  }

  const pozycje = (inv ?? []) as PozycjaWyposazenia[];
  const plan = parsujPlanZJsonb(sala.layout_data);
  const dep = sala.deposit != null ? Number(sala.deposit) : null;
  const pr = sala.price_resident != null ? Number(sala.price_resident) : null;
  const pe = sala.price_external != null ? Number(sala.price_external) : null;

  return (
    <main>
      <p className="mb-4 text-sm text-stone-500">
        <Link href="/panel/soltys/swietlica" className="text-green-800 underline">
          ← Wszystkie sale
        </Link>
      </p>
      <NawigacjaSali hallId={hallId} rola="soltys" />
      <h1 className="font-serif text-3xl text-green-950">{sala.name}</h1>
      <p className="mt-1 text-sm text-stone-600">
        {podpisWsi}
        {sala.max_capacity ? ` · pojemność do ${sala.max_capacity} osób` : ""}
        {sala.address ? ` · ${sala.address}` : ""}
      </p>
      {sala.description ? (
        <p className="mt-3 text-sm leading-relaxed text-stone-700">{sala.description}</p>
      ) : null}

      <RegulaminSaliKlient
        hallId={hallId}
        rulesTextPoczatek={sala.rules_text}
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

      <PlanSaliEdytor hallId={hallId} poczatkowyPlan={plan} />

      <AsortymentSwietlicyKlient hallId={hallId} nazwaSali={sala.name} pozycje={pozycje} />
    </main>
  );
}
