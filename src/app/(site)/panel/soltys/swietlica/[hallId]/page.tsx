import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { czyUzytkownikJestSoltysemDlaSali } from "@/lib/panel/rola-panelu-soltysa";
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
      "id, name, description, address, max_capacity, village_id, layout_data, rules_text, deposit, price_resident, price_external, contact_phone, contact_email, caretaker_name, villages(id, name, playground_rules_text)"
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
      <h1 className="tytul-sekcji-panelu">{sala.name}</h1>
      <p className="mt-1 text-sm text-stone-600">
        {podpisWsi}
        {sala.max_capacity ? ` · pojemność do ${sala.max_capacity} osób` : ""}
        {sala.address ? ` · ${sala.address}` : ""}
      </p>
      {sala.description ? (
        <p className="mt-3 text-sm leading-relaxed text-stone-700">{sala.description}</p>
      ) : null}

      {sala.contact_phone || sala.contact_email || sala.caretaker_name ? (
        <div className="mt-5 rounded-xl border border-stone-200 bg-stone-50/80 p-4 text-sm text-stone-800 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500">Kontakt do sali (dla wynajmujących)</h2>
          <ul className="mt-2 space-y-1.5">
            {sala.caretaker_name ? <li>Opiekun / opiekunka: {sala.caretaker_name}</li> : null}
            {sala.contact_phone ? (
              <li>
                Telefon:{" "}
                <a href={`tel:${sala.contact_phone.replace(/\s/g, "")}`} className="text-green-800 underline">
                  {sala.contact_phone}
                </a>
              </li>
            ) : null}
            {sala.contact_email ? (
              <li>
                E-mail:{" "}
                <a href={`mailto:${sala.contact_email}`} className="text-green-800 underline">
                  {sala.contact_email}
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      <PlanSaliEdytor hallId={hallId} poczatkowyPlan={plan} pojemnoscSali={sala.max_capacity} />

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

      <AsortymentSwietlicyKlient hallId={hallId} nazwaSali={sala.name} pozycje={pozycje} />
    </main>
  );
}
