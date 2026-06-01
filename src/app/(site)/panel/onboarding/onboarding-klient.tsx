"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { zakonczOnboarding } from "@/app/(site)/panel/onboarding/akcje-onboarding";
import { RejestracjaWyborWsi } from "@/app/(site)/rejestracja/rejestracja-wybor-wsi";
import type { WpisWsi } from "@/components/wies/wyszukiwarka-wsi";
import type { IntencjaOnboardingu } from "@/lib/auth/onboarding-uzytkownika";
import { czyPelneImieINazwisko } from "@/lib/rejestracja/validate-imie-soltysa";

type Props = {
  nastepnaSciezka: string;
  domyslnaNazwa: string;
  email: string;
  domyslnaIntencja?: IntencjaOnboardingu;
  domyslnaWies?: WpisWsi | null;
};

const OPCJE: { id: IntencjaOnboardingu; tytul: string; opis: string }[] = [
  {
    id: "mieszkaniec",
    tytul: "Mieszkaniec / sąsiad",
    opis: "Chcę dołączyć do swojej wsi — wniosek trafi do sołtysa.",
  },
  {
    id: "soltys",
    tytul: "Sołtys (lub zastępca)",
    opis: "Prowadzę sołectwo — złożę wniosek o panel sołtysa (weryfikacja przez zespół serwisu).",
  },
  {
    id: "przegladam",
    tytul: "Tylko przeglądam",
    opis: "Interesuje mnie inna wieś albo katalog — bez roli mieszkańca (możesz dodać obserwację).",
  },
];

export function OnboardingKlient({
  nastepnaSciezka,
  domyslnaNazwa,
  email,
  domyslnaIntencja,
  domyslnaWies = null,
}: Props) {
  const router = useRouter();
  const [intencja, ustawIntencje] = useState<IntencjaOnboardingu>(domyslnaIntencja ?? "mieszkaniec");
  const [wybranaWies, ustawWybranaWies] = useState<WpisWsi | null>(domyslnaWies);
  const [nazwa, ustawNazwe] = useState(domyslnaNazwa);
  const [blad, ustawBlad] = useState("");
  const [czek, startT] = useTransition();

  function kontynuuj() {
    ustawBlad("");
    if (nazwa.trim().length < 2) {
      ustawBlad("Podaj nazwę wyświetlaną (min. 2 znaki).");
      return;
    }
    if (intencja === "soltys" && !czyPelneImieINazwisko(nazwa.trim())) {
      ustawBlad("Jako sołtys podaj pełne imię i nazwisko (np. Jan Kowalski).");
      return;
    }
    if ((intencja === "mieszkaniec" || intencja === "soltys") && !wybranaWies) {
      ustawBlad("Wybierz miejscowość z katalogu.");
      return;
    }

    startT(async () => {
      const w = await zakonczOnboarding({
        intencja,
        villageId: wybranaWies?.id ?? null,
        villageName: wybranaWies?.nazwa ?? null,
        commune: wybranaWies?.gmina ?? null,
        county: wybranaWies?.powiat ?? null,
        voivodeship: wybranaWies?.wojewodztwo ?? null,
        terytId: wybranaWies?.terytId ?? null,
        displayName: nazwa.trim(),
        next: nastepnaSciezka,
      });
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      router.push(w.next);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/60 to-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Pierwsze logowanie</p>
        <h1 className="mt-1 font-serif text-2xl text-green-950">Kim jesteś i która Cię interesuje?</h1>
        <p className="mt-2 text-sm text-stone-700">
          Konto <strong>{email}</strong> to tylko logowanie. Każdy użytkownik wybiera <strong>swoją</strong> miejscowość
          i rolę — to nie jest automatycznie Studzienki ani żadna inna wieś.
        </p>
      </header>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-stone-900">1. Kim jesteś?</p>
        <ul className="mt-3 space-y-2">
          {OPCJE.map((o) => (
            <li key={o.id}>
              <label
                className={`flex cursor-pointer gap-3 rounded-xl border px-3 py-3 text-sm transition ${
                  intencja === o.id
                    ? "border-green-700 bg-green-50/80 ring-1 ring-green-700/20"
                    : "border-stone-200 hover:border-stone-300"
                }`}
              >
                <input
                  type="radio"
                  name="intencja"
                  className="mt-1"
                  checked={intencja === o.id}
                  onChange={() => {
                    ustawIntencje(o.id);
                    if (o.id === "przegladam") ustawWybranaWies(null);
                  }}
                />
                <span>
                  <span className="font-medium text-stone-900">{o.tytul}</span>
                  <span className="mt-0.5 block text-xs text-stone-600">{o.opis}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-stone-900">
          2. {intencja === "przegladam" ? "Która miejscowość? (opcjonalnie)" : "Która miejscowość?"}
        </p>
        {intencja === "przegladam" ? (
          <p className="mt-1 text-xs text-stone-600">
            Możesz pominąć wybór — wtedy przejdziesz od razu do panelu. Albo wskaż wieś do obserwacji.
          </p>
        ) : null}
        <div className="mt-3">
          <RejestracjaWyborWsi wybrana={wybranaWies} onZmiana={ustawWybranaWies} />
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <label className="block text-sm font-medium text-stone-900" htmlFor="onb-nazwa">
          3. Jak mamy Cię pokazywać?
        </label>
        <input
          id="onb-nazwa"
          value={nazwa}
          onChange={(e) => ustawNazwe(e.target.value)}
          maxLength={80}
          placeholder={intencja === "soltys" ? "Jan Kowalski" : "np. Jan K. lub pseudonim"}
          className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />
      </section>

      {blad ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}

      <button
        type="button"
        disabled={czek}
        onClick={kontynuuj}
        className="w-full rounded-xl bg-green-800 px-4 py-3 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-60"
      >
        {czek ? "Zapisuję…" : "Dalej — przejdź do panelu"}
      </button>
    </div>
  );
}
