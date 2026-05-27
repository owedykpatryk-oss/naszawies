"use client";

import type { PozycjaWyposazenia } from "@/components/swietlica/asortyment-swietlicy-klient";
import { PrzyciskPobierzPdf } from "@/components/dokumenty/przycisk-pobierz-pdf";
import { normalizujAkcjeInwentarza } from "@/lib/swietlica/inwentarz-status";

type Props = {
  nazwaSali: string;
  nazwaWsi?: string;
  pozycje: PozycjaWyposazenia[];
};

export function EksportPlanWowSwietlicy({ nazwaSali, nazwaWsi, pozycje }: Props) {
  const planWow = pozycje.filter((p) => normalizujAkcjeInwentarza(p.inventory_action) === "wishlist_wow");
  const doNaprawy = pozycje.filter((p) => normalizujAkcjeInwentarza(p.inventory_action) === "to_repair");
  const doUsuniecia = pozycje.filter((p) => normalizujAkcjeInwentarza(p.inventory_action) === "to_remove");

  if (planWow.length === 0 && doNaprawy.length === 0 && doUsuniecia.length === 0) {
    return null;
  }

  const id = "eksport-plan-wow-swietlicy";

  return (
    <section className="no-print mt-6 rounded-xl border border-violet-200 bg-violet-50/50 p-4">
      <h3 className="font-serif text-lg text-violet-950">Eksport dla rady / zebrania</h3>
      <p className="mt-1 text-xs text-stone-600">
        PDF z planem WOW, pozycjami do naprawy i do usunięcia — do druku na zebraniu wiejskim.
      </p>
      <div className="mt-3">
        <PrzyciskPobierzPdf elementId={id} nazwaPliku={`plan-swietlicy-${nazwaSali.replace(/\s+/g, "-")}`} />
      </div>

      <div
        id={id}
        className="pointer-events-none fixed -left-[9999px] top-0 w-[210mm] bg-white p-8 text-stone-900"
        aria-hidden
      >
        <h1 className="font-serif text-2xl text-green-950">Plan wyposażenia świetlicy</h1>
        <p className="mt-2 text-sm">
          {nazwaSali}
          {nazwaWsi ? ` · ${nazwaWsi}` : ""} · wygenerowano{" "}
          {new Date().toLocaleDateString("pl-PL", { dateStyle: "long" })}
        </p>

        {planWow.length > 0 ? (
          <section className="mt-6">
            <h2 className="text-lg font-semibold text-violet-900">Propozycje WOW ✨ ({planWow.length})</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {planWow.map((p) => (
                <li key={p.id} className="border-b border-stone-200 pb-2">
                  <strong>{p.name}</strong> — {p.category}
                  {p.description ? <p className="text-stone-600">{p.description}</p> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {doNaprawy.length > 0 ? (
          <section className="mt-6">
            <h2 className="text-lg font-semibold text-amber-900">Do naprawy ({doNaprawy.length})</h2>
            <ul className="mt-2 list-disc pl-5 text-sm">
              {doNaprawy.map((p) => (
                <li key={p.id}>
                  {p.name} ({p.quantity} szt.)
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {doUsuniecia.length > 0 ? (
          <section className="mt-6">
            <h2 className="text-lg font-semibold text-red-900">Do usunięcia ({doUsuniecia.length})</h2>
            <ul className="mt-2 list-disc pl-5 text-sm">
              {doUsuniecia.map((p) => (
                <li key={p.id}>
                  {p.name} ({p.quantity} szt.)
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="mt-8 text-xs text-stone-500">Dokument z panelu naszawies.pl — do dyskusji na zebraniu sołectwa.</p>
      </div>
    </section>
  );
}
