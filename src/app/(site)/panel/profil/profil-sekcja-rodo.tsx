"use client";

import { type FormEvent, useState } from "react";
import { pobierzJsonEksportuRodo, usunKontoNaZawsze } from "./akcje-rodo";

export function ProfilSekcjaRodo() {
  const [bladEksportu, ustawBladEksportu] = useState("");
  const [ladujeEksport, ustawLadujeEksport] = useState(false);
  const [bladUsuniecia, ustawBladUsuniecia] = useState("");
  const [ladujeUsuniecie, ustawLadujeUsuniecie] = useState(false);
  const [potwierdzenie, ustawPotwierdzenie] = useState("");

  async function onEksport() {
    ustawBladEksportu("");
    ustawLadujeEksport(true);
    try {
      const wynik = await pobierzJsonEksportuRodo();
      if ("blad" in wynik) {
        ustawBladEksportu(wynik.blad);
        return;
      }
      const blob = new Blob([wynik.json], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = wynik.nazwaPliku;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      ustawLadujeEksport(false);
    }
  }

  async function onUsunKonto(e: FormEvent) {
    e.preventDefault();
    ustawBladUsuniecia("");
    ustawLadujeUsuniecie(true);
    try {
      const wynik = await usunKontoNaZawsze(potwierdzenie);
      if ("blad" in wynik) {
        ustawBladUsuniecia(wynik.blad);
        return;
      }
      window.location.href = wynik.nastepnyUrl;
    } finally {
      ustawLadujeUsuniecie(false);
    }
  }

  return (
    <div className="mt-14 max-w-xl space-y-10 border-t border-stone-200 pt-10">
      <section aria-labelledby="rodo-eksport-naglowek">
        <h2 id="rodo-eksport-naglowek" className="mb-2 font-serif text-xl text-green-950">
          Twoje dane (RODO)
        </h2>
        <p className="mb-4 text-sm text-stone-600">
          Pobierz plik JSON z danymi powiązanymi z kontem w serwisie (w tym rola we wsi, treści, powiadomienia,
          subskrypcje Web Push i inne rekordy przechowywane w naszej bazie). Plik może być duży — przechowuj go
          bezpiecznie.
        </p>
        {bladEksportu ? (
          <p className="mb-3 text-sm text-red-800" role="alert">
            {bladEksportu}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => void onEksport()}
          disabled={ladujeEksport}
          className="rounded-lg border border-green-900/30 bg-white px-4 py-2.5 text-sm font-medium text-green-950 shadow-sm hover:bg-stone-50 disabled:opacity-60"
        >
          {ladujeEksport ? "Przygotowuję plik…" : "Pobierz eksport danych (JSON)"}
        </button>
      </section>

      <section aria-labelledby="rodo-usun-naglowek" className="rounded-xl border border-red-200/80 bg-red-50/40 p-5">
        <h2 id="rodo-usun-naglowek" className="mb-2 font-serif text-xl text-red-950">
          Usuń konto na zawsze
        </h2>
        <p className="mb-4 text-sm text-stone-700">
          Ta operacja jest <strong>nieodwracalna</strong>: konto logowania zostanie usunięte, a powiązane dane
          osobowe usunięte lub odłączone od konta (m.in. wpisy, w których byłeś autorem, mogą pozostać przy
          zanonimizowanym autorze). Jeśli jesteś jedynym sołtysem wsi, po usunięciu konta wieś może wymagać
          ponownego przypisania sołtysa przez administrację serwisu.
        </p>
        <form onSubmit={(e) => void onUsunKonto(e)} className="space-y-3">
          <div>
            <label htmlFor="potwierdzenie_usun_konto" className="mb-1 block text-sm font-medium text-stone-800">
              Wpisz dokładnie: <code className="rounded bg-white px-1 text-red-900">USUN KONTO</code>
            </label>
            <input
              id="potwierdzenie_usun_konto"
              name="potwierdzenie_usun_konto"
              type="text"
              autoComplete="off"
              value={potwierdzenie}
              onChange={(ev) => ustawPotwierdzenie(ev.target.value)}
              className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-stone-900 outline-none ring-red-800/30 focus:ring-2"
            />
          </div>
          {bladUsuniecia ? (
            <p className="text-sm text-red-900" role="alert">
              {bladUsuniecia}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={ladujeUsuniecie}
            className="rounded-lg bg-red-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-900 disabled:opacity-60"
          >
            {ladujeUsuniecie ? "Usuwam…" : "Trwale usuń moje konto"}
          </button>
        </form>
      </section>
    </div>
  );
}
