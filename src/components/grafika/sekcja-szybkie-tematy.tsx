"use client";

import { MiniaturaSzablonuGrafiki } from "@/components/grafika/podglad-szablonu-grafiki";
import { znajdzMotyw } from "@/lib/grafika/motywy";
import { domyslneWartosciPol, znajdzSzablon } from "@/lib/grafika/szablony";
import type { KontekstGrafiki } from "@/lib/grafika/typy";

const TEMATY = [
  {
    id: "dzieci",
    emoji: "🎈",
    tytul: "Dzień Dziecka i zajęcia",
    opis: "Kolorowe plakaty, dyplomy, konkursy plastyczne.",
    szablonId: "plakat-dzien-dziecka-kolorowy",
    motywId: "dzieci-radosny",
    tytulProjektu: "Dzień Dziecka",
  },
  {
    id: "swietlica",
    emoji: "🏠",
    tytul: "Świetlica wiejska",
    opis: "Regulamin, godziny otwarcia, rezerwacja sali.",
    szablonId: "karta-regulamin-swietlicy",
    motywId: "swietlica-ciepla",
    tytulProjektu: "Regulamin świetlicy",
  },
  {
    id: "zebranie",
    emoji: "📋",
    tytul: "Zebranie wiejskie",
    opis: "Ogłoszenie na tablicę — data i porządek obrad.",
    szablonId: "plakat-zebranie-tablica",
    motywId: "tablica-czerwony",
    tytulProjektu: "Zebranie sołectwa",
  },
  {
    id: "fundusz",
    emoji: "💰",
    tytul: "Fundusz sołecki",
    opis: "Plan zadań i kwot do publikacji.",
    szablonId: "plakat-fundusz-sołecki",
    motywId: "zielony-wies",
    tytulProjektu: "Fundusz sołecki",
  },
  {
    id: "festyn",
    emoji: "🌾",
    tytul: "Festyn / dożynki",
    opis: "Program imprezy + plakat wydarzenia.",
    szablonId: "karta-program-festynu",
    motywId: "fioletowy-festyn",
    tytulProjektu: "Program festynu",
  },
  {
    id: "11-listopada",
    emoji: "🇵🇱",
    tytul: "11 listopada",
    opis: "Uroczystość patriotyczna wsi.",
    szablonId: "plakat-11-listopada",
    motywId: "patriotyczny-granat",
    tytulProjektu: "Święto Niepodległości",
  },
] as const;

type Props = {
  kontekst: KontekstGrafiki;
  onWybor: (w: {
    szablonId: string;
    motywId: string;
    wartosci: Record<string, string>;
    tytulProjektu: string;
    komunikat: string;
  }) => void;
};

export function SekcjaSzybkieTematy({ kontekst, onWybor }: Props) {
  return (
    <section className="rounded-2xl border border-sky-200/90 bg-gradient-to-br from-sky-50/90 via-white to-indigo-50/40 p-4 shadow-sm sm:p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-sky-800">Szybki start</p>
      <h2 className="font-serif text-lg text-sky-950">Popularne tematy — 1 klik</h2>
      <p className="mt-1 text-sm text-stone-600">Najczęstsze potrzeby sołtysa — jeden klik i gotowy projekt.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TEMATY.map((t) => {
          const sz = znajdzSzablon(t.szablonId);
          const motyw = znajdzMotyw(t.motywId);
          if (!sz) return null;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() =>
                onWybor({
                  szablonId: t.szablonId,
                  motywId: t.motywId,
                  wartosci: domyslneWartosciPol(sz, kontekst),
                  tytulProjektu: t.tytulProjektu,
                  komunikat: `${t.emoji} ${t.tytul} — uzupełnij datę i pobierz PDF.`,
                })
              }
              className="group overflow-hidden rounded-xl border border-sky-200/80 bg-white text-left shadow-sm transition hover:border-sky-500 hover:shadow-md active:scale-[0.99]"
            >
              <div className="border-b border-sky-100 p-1.5">
                <MiniaturaSzablonuGrafiki szablon={sz} motyw={motyw} />
              </div>
              <div className="p-3">
                <span className="text-lg">{t.emoji}</span>
                <span className="ml-1 text-sm font-semibold text-stone-900">{t.tytul}</span>
                <p className="mt-0.5 text-xs text-stone-500">{t.opis}</p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
