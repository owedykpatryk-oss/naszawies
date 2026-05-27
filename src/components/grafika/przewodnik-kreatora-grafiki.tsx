"use client";

import { useEffect, useState } from "react";
import type { ZakladkaKreatora } from "@/lib/grafika/kreator-zakladki";
import { ZAKLADKI_KREATORA } from "@/lib/grafika/kreator-zakladki";

const KLUCZ_UKRYJ = "naszawies-grafika-przewodnik-ukryty";

type Props = {
  trybSoltys?: boolean;
  zapisDoBazy?: boolean;
  aktywnaZakladka?: ZakladkaKreatora;
  tryb: "zaproszenie" | "dyplomy" | "edytor";
};

export function PrzewodnikKreatoraGrafiki({
  trybSoltys = false,
  zapisDoBazy = false,
  aktywnaZakladka = "szablon",
  tryb,
}: Props) {
  const [otwarty, ustawOtwarty] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem(KLUCZ_UKRYJ) === "1") ustawOtwarty(false);
    } catch {
      /* ignore */
    }
  }, []);

  const ukryj = () => {
    ustawOtwarty(false);
    try {
      localStorage.setItem(KLUCZ_UKRYJ, "1");
    } catch {
      /* ignore */
    }
  };

  const pokazPonownie = () => {
    ustawOtwarty(true);
    try {
      localStorage.removeItem(KLUCZ_UKRYJ);
    } catch {
      /* ignore */
    }
  };

  if (!otwarty) {
    return (
      <button
        type="button"
        onClick={pokazPonownie}
        className="no-print rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-900 hover:bg-sky-100"
      >
        Pokaż przewodnik — 3 zakładki: szablon → treść → pobierz
      </button>
    );
  }

  const kroki =
    tryb === "dyplomy"
      ? [
          { id: "1", tytul: "Lista imion", opis: "Wklej imiona — jedna osoba w linii albo plik CSV." },
          { id: "2", tytul: "Uzasadnienie", opis: "Jedna wspólna treść „za co” dla wszystkich dyplomów." },
          { id: "3", tytul: "Pobierz PDF", opis: "Przy każdej osobie kliknij „Pobierz PDF”." },
        ]
      : tryb === "edytor"
        ? [
            { id: "1", tytul: "Edytor zaawansowany", opis: "Przeciągaj tekst i obrazki — opcja dla wymagających." },
            { id: "2", tytul: "Prostsza droga", opis: "Większości wystarczy tryb „Zaproszenie lub plakat”." },
          ]
        : ZAKLADKI_KREATORA.map((z, i) => ({
            id: z.id,
            tytul: `${i + 1}. ${z.tytul}`,
            opis: z.opis,
          }));

  return (
    <section className="no-print rounded-2xl border border-sky-200/90 bg-gradient-to-br from-sky-50/90 to-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg font-semibold text-sky-950">Jak to działa?</h2>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-stone-700">
            {tryb === "zaproszenie"
              ? "Trzy zakładki u góry kreatora — bez przełączania między osobnymi krokami treści i wyglądu."
              : "Wybierz tryb pracy u góry — każdy ma własny, prosty schemat."}
          </p>
        </div>
        <button type="button" onClick={ukryj} className="shrink-0 text-xs text-stone-500 underline hover:text-stone-800">
          Ukryj przewodnik
        </button>
      </div>

      <ol className={`mt-4 grid gap-3 ${tryb === "zaproszenie" ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
        {kroki.map((k) => {
          const aktywny = tryb === "zaproszenie" && "id" in k && k.id === aktywnaZakladka;
          const nr = tryb === "zaproszenie" ? ZAKLADKI_KREATORA.findIndex((z) => z.id === k.id) + 1 : Number(k.id);
          return (
            <li
              key={k.id}
              className={`rounded-xl border px-3 py-3 text-sm ${
                aktywny ? "border-green-700 bg-green-50/80 ring-1 ring-green-700/20" : "border-stone-200/80 bg-white/80"
              }`}
            >
              <span
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  aktywny ? "bg-green-800 text-white" : "bg-stone-200 text-stone-700"
                }`}
              >
                {nr || k.id}
              </span>
              <p className="mt-2 font-semibold text-stone-900">{k.tytul}</p>
              <p className="mt-1 text-xs leading-relaxed text-stone-600">{k.opis}</p>
            </li>
          );
        })}
      </ol>

      <details className="mt-4 rounded-lg border border-stone-200/80 bg-white/60 px-3 py-2 text-sm">
        <summary className="cursor-pointer font-medium text-stone-800">Co wybrać? — szybka ściągawka</summary>
        <ul className="mt-3 space-y-2 text-xs leading-relaxed text-stone-700">
          <li>
            <strong>Impreza, festyn, zebranie</strong> → zakładka „Szablon”: kategoria „Zaproszenia” lub „Plakaty”.
          </li>
          <li>
            <strong>Wesele / urodziny w świetlicy</strong> → po zalogowaniu: „Wygeneruj zaproszenie” przy rezerwacji sali.
          </li>
          <li>
            <strong>KGW / OSP</strong> → motyw różowy lub czerwony; skróty WOW w zakładce „Szablon”.
          </li>
          <li>
            <strong>Myśliwi / koło łowieckie</strong> → scenariusze WOW: Hubertus, akcja na dziki. Motyw „Łowiecki leśny”.
          </li>
          <li>
            <strong>Parafia, seniorzy, LZS, zespół, DDK, sponsorzy</strong> → gotowe paczki WOW w zakładce „Szablon”.
          </li>
          <li>
            <strong>Goście z Ukrainy</strong> → szukaj „PL + UA” lub „dwujęzyczny”.
          </li>
          <li>
            <strong>Social media</strong> → zakładka „Pobierz”: post 1080×1080 lub story.
          </li>
          <li>
            <strong>Ankieta po imprezie</strong> → zakładka „Treść i wygląd”: preset QR „Ankieta”.
          </li>
          <li>
            <strong>Wiele dyplomów</strong> → tryb „Wiele dyplomów naraz”.
          </li>
          <li>
            <strong>Logo, tło, QR</strong> → zakładka „Treść i wygląd”, sekcja „Opcje dodatkowe”.
          </li>
          {trybSoltys && zapisDoBazy ? (
            <>
              <li>
                <strong>Plakat na stronie wsi</strong> → „Zapisz projekt”, potem „Opublikuj na profilu wsi”.
              </li>
              <li>
                <strong>Tablica w świetlicy</strong> → po publikacji: pełny ekran w menu sali.
              </li>
            </>
          ) : null}
        </ul>
      </details>
    </section>
  );
}
