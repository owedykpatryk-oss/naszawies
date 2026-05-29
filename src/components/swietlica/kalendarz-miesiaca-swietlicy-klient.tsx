"use client";

import { useMemo, useState } from "react";
import {
  DNI_TYGODNIA_PL,
  etykietaMiesiaca,
  kluczDniaLocal,
  obliczMapeStanowDni,
  siatkaMiesiaca,
  terminyNaDniu,
  type StanDniaKalendarza,
  type TerminKalendarza,
} from "@/lib/swietlica/stan-dni-kalendarza";

export type WpisSzczegolowyKalendarzaSoltys = TerminKalendarza & {
  id: string;
  event_title: string | null;
  wynajmujacy: string | null;
  telefon: string | null;
};

type Props = {
  terminy: TerminKalendarza[];
  /** Tylko sołtys — pokazuje kto wynajął w podpowiedzi dnia. */
  trybSoltys?: boolean;
  wpisySzczegolowe?: WpisSzczegolowyKalendarzaSoltys[];
};

function klasyKomorki(stan: StanDniaKalendarza, wMiesiacu: boolean, dzis: boolean): string {
  const baza = "relative flex h-9 w-full items-center justify-center rounded-md text-xs font-medium transition-colors sm:h-10";
  if (!wMiesiacu) return `${baza} text-stone-300`;
  if (dzis) {
    /* ring na dziś */
  }
  switch (stan) {
    case "zajety":
      return `${baza} bg-red-100 text-red-950 ring-1 ring-red-300/80 ${dzis ? "ring-2 ring-green-700" : ""}`;
    case "bufor":
      return `${baza} bg-orange-100 text-orange-950 ring-1 ring-orange-300/80 ${dzis ? "ring-2 ring-green-700" : ""}`;
    default:
      return `${baza} bg-white text-stone-700 ring-1 ring-stone-200/90 ${dzis ? "ring-2 ring-green-700" : ""}`;
  }
}

function formatZakres(a: string, b: string) {
  return `${new Date(a).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })} — ${new Date(b).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })}`;
}

export function KalendarzMiesiacaSwietlicyKlient({ terminy, trybSoltys = false, wpisySzczegolowe = [] }: Props) {
  const teraz = new Date();
  const [rok, ustawRok] = useState(teraz.getFullYear());
  const [miesiac, ustawMiesiac] = useState(teraz.getMonth());

  const mapa = useMemo(() => obliczMapeStanowDni(terminy, rok, miesiac), [terminy, rok, miesiac]);
  const komorki = useMemo(() => siatkaMiesiaca(rok, miesiac), [rok, miesiac]);
  const dzisKlucz = kluczDniaLocal(teraz);

  const [podpowiedzDnia, ustawPodpowiedzDnia] = useState<string | null>(null);

  function zmienMiesiac(delta: number) {
    const d = new Date(rok, miesiac + delta, 1);
    ustawRok(d.getFullYear());
    ustawMiesiac(d.getMonth());
    ustawPodpowiedzDnia(null);
  }

  const wpisyDnia = podpowiedzDnia
    ? wpisySzczegolowe.filter((w) => terminyNaDniu([w], podpowiedzDnia).length > 0)
    : [];

  const stanDnia = podpowiedzDnia ? mapa.get(podpowiedzDnia) ?? "wolny" : null;

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => zmienMiesiac(-1)}
          className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-sm text-stone-700 hover:bg-stone-100"
          aria-label="Poprzedni miesiąc"
        >
          ←
        </button>
        <p className="font-medium capitalize text-stone-900">{etykietaMiesiaca(rok, miesiac)}</p>
        <button
          type="button"
          onClick={() => zmienMiesiac(1)}
          className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-sm text-stone-700 hover:bg-stone-100"
          aria-label="Następny miesiąc"
        >
          →
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-stone-500">
        {DNI_TYGODNIA_PL.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {komorki.map(({ data, wBiezacymMiesiacu }) => {
          const klucz = kluczDniaLocal(data);
          const stan = mapa.get(klucz) ?? (wBiezacymMiesiacu ? "wolny" : "wolny");
          const stanWyswietlany: StanDniaKalendarza = wBiezacymMiesiacu ? stan : "wolny";
          const aktywny = podpowiedzDnia === klucz;
          return (
            <button
              key={klucz}
              type="button"
              disabled={!wBiezacymMiesiacu}
              onClick={() => ustawPodpowiedzDnia(aktywny ? null : klucz)}
              className={`${klasyKomorki(stanWyswietlany, wBiezacymMiesiacu, klucz === dzisKlucz)} ${aktywny ? "outline outline-2 outline-offset-1 outline-green-700" : ""}`}
              title={
                !wBiezacymMiesiacu
                  ? undefined
                  : stanWyswietlany === "zajety"
                    ? "Zajęte"
                    : stanWyswietlany === "bufor"
                      ? "Przygotowanie lub sprzątanie"
                      : "Wolne"
              }
            >
              {data.getDate()}
            </button>
          );
        })}
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-stone-600">
        <li className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded border border-stone-200 bg-white" aria-hidden />
          Wolne
        </li>
        <li className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-red-100 ring-1 ring-red-300/80" aria-hidden />
          Zajęte
        </li>
        <li className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-orange-100 ring-1 ring-orange-300/80" aria-hidden />
          Bufor (przygotowanie / sprzątanie)
        </li>
      </ul>

      {podpowiedzDnia && wBiezacymMiesiacuKomorka(podpowiedzDnia, komorki) ? (
        <div className="mt-3 rounded-lg border border-stone-200 bg-stone-50/80 px-3 py-2 text-xs text-stone-800">
          <p className="font-semibold text-stone-900">
            {new Date(podpowiedzDnia).toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" })}
            {" — "}
            {stanDnia === "zajety" ? "zajęte" : stanDnia === "bufor" ? "bufor (przygotowanie lub sprzątanie)" : "wolne"}
          </p>
          {trybSoltys && wpisyDnia.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {wpisyDnia.map((w) => (
                <li key={w.id} className="rounded-md border border-stone-200 bg-white px-2 py-1.5">
                  <p className="font-medium">{formatZakres(w.start_at, w.end_at)}</p>
                  {w.wynajmujacy ? <p>Wynajmujący: {w.wynajmujacy}</p> : null}
                  {w.event_title ? <p className="text-stone-600">{w.event_title}</p> : null}
                  {w.telefon ? <p>tel. {w.telefon}</p> : null}
                </li>
              ))}
            </ul>
          ) : stanDnia === "zajety" ? (
            <p className="mt-1 text-stone-600">Sala jest zarezerwowana w tym dniu (bez danych wynajmującego).</p>
          ) : stanDnia === "bufor" ? (
            <p className="mt-1 text-stone-600">
              Dzień na przygotowanie sali przed imprezą lub posprzątanie po zakończeniu — planując wydarzenie, uwzględnij
              ten czas.
            </p>
          ) : (
            <p className="mt-1 text-stone-600">Brak blokady w kalendarzu — termin wygląda na wolny.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function wBiezacymMiesiacuKomorka(
  klucz: string,
  komorki: { data: Date; wBiezacymMiesiacu: boolean }[],
): boolean {
  return komorki.some((k) => kluczDniaLocal(k.data) === klucz && k.wBiezacymMiesiacu);
}
