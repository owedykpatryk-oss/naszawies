"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { RejestracjaWyborWsi } from "@/app/(site)/rejestracja/rejestracja-wybor-wsi";
import type { WpisWsi } from "@/components/wies/wyszukiwarka-wsi";
import type { IntencjaOnboardingu } from "@/lib/auth/onboarding-uzytkownika";
import type { WiesPowiazana } from "@/lib/panel/pobierz-moje-powiazania";
import { zmienPowiazanieKonta } from "./akcje-powiazanie-wsi";

const OPCJE: { id: IntencjaOnboardingu; tytul: string }[] = [
  { id: "mieszkaniec", tytul: "Mieszkaniec / sąsiad" },
  { id: "soltys", tytul: "Sołtys" },
  { id: "przegladam", tytul: "Tylko obserwuję" },
];

export function ProfilPowiazanieWsiKlient({
  intencjaStart,
  etykietaWsiStart,
  powiazania,
}: {
  intencjaStart: IntencjaOnboardingu | null;
  etykietaWsiStart: string | null;
  powiazania: WiesPowiazana[];
}) {
  const [otwarte, ustawOtwarte] = useState(false);
  const [intencja, ustawIntencje] = useState<IntencjaOnboardingu>(intencjaStart ?? "mieszkaniec");
  const [wybranaWies, ustawWybranaWies] = useState<WpisWsi | null>(null);
  const [blad, ustawBlad] = useState("");
  const [ok, ustawOk] = useState("");
  const [czek, startT] = useTransition();

  const aktywneRole = powiazania.filter((p) => p.statusRoli === "approved");

  function zapisz() {
    ustawBlad("");
    ustawOk("");
    if ((intencja === "mieszkaniec" || intencja === "soltys") && !wybranaWies) {
      ustawBlad("Wybierz miejscowość z katalogu.");
      return;
    }
    startT(async () => {
      const w = await zmienPowiazanieKonta({
        intencja,
        villageId: wybranaWies?.id ?? null,
        villageName: wybranaWies?.nazwa ?? null,
        commune: wybranaWies?.gmina ?? null,
        county: wybranaWies?.powiat ?? null,
        voivodeship: wybranaWies?.wojewodztwo ?? null,
        terytId: wybranaWies?.terytId ?? null,
      });
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawOk(w.komunikat);
      ustawOtwarte(false);
    });
  }

  return (
    <section className="mt-10 rounded-2xl border border-stone-200 bg-stone-50/60 p-5 shadow-sm">
      <h2 className="font-serif text-lg text-green-950">Powiązanie z wsią</h2>
      <p className="mt-2 text-sm text-stone-600">
        {etykietaWsiStart ? (
          <>
            Główna wieś z rejestracji: <strong>{etykietaWsiStart}</strong>
            {intencjaStart ? ` · intencja: ${OPCJE.find((o) => o.id === intencjaStart)?.tytul ?? intencjaStart}` : null}
          </>
        ) : (
          <>Nie wybrano jeszcze głównej wsi — uzupełnij, aby panel i mapa były dopasowane do Ciebie.</>
        )}
      </p>

      {aktywneRole.length > 0 ? (
        <ul className="mt-3 space-y-1 text-sm text-stone-700">
          {aktywneRole.map((p) => (
            <li key={p.villageId}>
              <Link href={p.sciezkaProfilu} className="font-medium text-green-800 underline">
                {p.nazwa}
              </Link>
              {p.etykietaRoli ? ` — ${p.etykietaRoli}` : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-stone-500">Brak zatwierdzonych ról we wsi — wniosek może czekać u sołtysa.</p>
      )}

      <p className="mt-3 text-xs text-stone-500">
        Pełne zarządzanie obserwacjami i rolami:{" "}
        <Link href="/panel/moje/wies" className="text-green-800 underline">
          Moje wsi
        </Link>
        .
      </p>

      {ok ? (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">
          {ok}
        </p>
      ) : null}
      {blad ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}

      {!otwarte ? (
        <button
          type="button"
          onClick={() => ustawOtwarte(true)}
          className="mt-4 rounded-lg border border-green-700 bg-white px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-50"
        >
          Zmień główną wieś / intencję
        </button>
      ) : (
        <div className="mt-4 space-y-4 rounded-xl border border-stone-200 bg-white p-4">
          <fieldset>
            <legend className="text-sm font-medium text-stone-800">Co chcesz zrobić?</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {OPCJE.map((o) => (
                <label
                  key={o.id}
                  className={`cursor-pointer rounded-lg border px-3 py-2 text-sm ${
                    intencja === o.id
                      ? "border-green-700 bg-green-50 font-medium text-green-950"
                      : "border-stone-200 text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="intencja-profil"
                    className="sr-only"
                    checked={intencja === o.id}
                    onChange={() => ustawIntencje(o.id)}
                  />
                  {o.tytul}
                </label>
              ))}
            </div>
          </fieldset>

          {intencja === "przegladam" || intencja === "mieszkaniec" || intencja === "soltys" ? (
            <RejestracjaWyborWsi wybrana={wybranaWies} onZmiana={ustawWybranaWies} />
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={czek}
              onClick={zapisz}
              className="rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-60"
            >
              {czek ? "Zapisuję…" : "Zapisz"}
            </button>
            <button
              type="button"
              onClick={() => ustawOtwarte(false)}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
            >
              Anuluj
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
