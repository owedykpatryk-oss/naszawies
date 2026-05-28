"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { WpisWsi } from "@/components/wies/wyszukiwarka-wsi";
import { WyszukiwarkaWsi } from "@/components/wies/wyszukiwarka-wsi";
import { cofnijWniosekSoltysa, zlozWniosekSoltysa } from "@/lib/soltys/wniosek-soltysa";

export type WniosekSoltysaWiersz = {
  id: string;
  status: string;
  village_name: string;
  commune: string;
  county: string;
  voivodeship: string;
  created_at: string;
  admin_note: string | null;
  reviewed_at: string | null;
};

type Props = {
  wnioski: WniosekSoltysaWiersz[];
  maRoleSoltysa: boolean;
};

function etykietaStatusu(s: string): string {
  if (s === "pending") return "Oczekuje na decyzję";
  if (s === "approved") return "Zatwierdzony";
  if (s === "rejected") return "Odrzucony";
  if (s === "withdrawn") return "Wycofany";
  return s;
}

export function WniosekSoltysaKlient({ wnioski, maRoleSoltysa }: Props) {
  const router = useRouter();
  const [blad, ustawBlad] = useState("");
  const [komunikat, ustawKomunikat] = useState("");
  const [notatka, ustawNotatka] = useState("");
  const [czeka, startT] = useTransition();

  const oczekujacy = wnioski.find((w) => w.status === "pending");

  async function zloz(w: WpisWsi) {
    ustawBlad("");
    ustawKomunikat("");
    startT(async () => {
      const wynik = await zlozWniosekSoltysa({
        villageId: w.id,
        terytId: w.terytId ?? w.id,
        villageName: w.nazwa,
        commune: w.gmina,
        county: w.powiat,
        voivodeship: w.wojewodztwo,
        note: notatka.trim() || null,
      });
      if ("blad" in wynik) {
        ustawBlad(wynik.blad);
        return;
      }
      ustawKomunikat(wynik.komunikat ?? "Wniosek wysłany.");
      router.refresh();
    });
  }

  function cofnij(id: string) {
    ustawBlad("");
    startT(async () => {
      const wynik = await cofnijWniosekSoltysa(id);
      if ("blad" in wynik) {
        ustawBlad(wynik.blad);
        return;
      }
      ustawKomunikat(wynik.komunikat ?? "Wycofano.");
      router.refresh();
    });
  }

  if (maRoleSoltysa) {
    return (
      <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
        Masz już aktywną rolę sołtysa lub współadministratora — przejdź do{" "}
        <a href="/panel/soltys" className="font-medium underline">
          panelu sołtysa
        </a>
        .
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {komunikat ? (
        <p className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-950">{komunikat}</p>
      ) : null}
      {blad ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900" role="alert">
          {blad}
        </p>
      ) : null}

      {oczekujacy ? (
        <section className="panel-karta">
          <h2 className="font-serif text-lg text-green-950">Twój wniosek w toku</h2>
          <p className="mt-2 text-sm text-stone-700">
            <strong>{oczekujacy.village_name}</strong> · {oczekujacy.commune}, {oczekujacy.county},{" "}
            {oczekujacy.voivodeship}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Złożono: {new Date(oczekujacy.created_at).toLocaleString("pl-PL")} · {etykietaStatusu(oczekujacy.status)}
          </p>
          <p className="mt-3 text-sm text-stone-600">
            Administrator platformy zweryfikuje tożsamość i kod TERYT. Po zatwierdzeniu profil wsi zostanie aktywowany, a
            Ty zobaczysz panel sołtysa.
          </p>
          <button
            type="button"
            disabled={czeka}
            onClick={() => cofnij(oczekujacy.id)}
            className="mt-4 rounded-lg border border-stone-300 px-3 py-2 text-sm hover:bg-stone-50"
          >
            Wycofaj wniosek
          </button>
        </section>
      ) : (
        <section className="panel-karta">
          <h2 className="font-serif text-lg text-green-950">Złóż wniosek o rolę sołtysa</h2>
          <p className="mt-2 text-sm text-stone-600">
            Wybierz miejscowość z katalogu (ten sam kod co przy rejestracji). Jeden aktywny sołtys na sołectwo — po
            zatwierdzeniu uruchomimy profil wsi i panel zarządzania.
          </p>
          <label className="mt-4 block text-xs font-medium text-stone-600">
            Krótka informacja dla administratora (opcjonalnie)
            <textarea
              value={notatka}
              onChange={(e) => ustawNotatka(e.target.value)}
              rows={3}
              maxLength={2000}
              className="form-control form-control--textarea mt-1"
              placeholder="np. numer uchwały, kontakt do poprzedniego sołtysa…"
            />
          </label>
          <div className="mt-4">
            <WyszukiwarkaWsi
              etykietaAkcji="Miejscowość, w której jesteś (lub będziesz) sołtysem"
              tekstPrzycisku="Wyślij wniosek"
              onAkcja={zloz}
            />
          </div>
        </section>
      )}

      {wnioski.length > 1 || (wnioski.length === 1 && !oczekujacy) ? (
        <section className="rounded-xl border border-stone-200 bg-white p-4 text-sm">
          <h3 className="font-medium text-stone-800">Historia wniosków</h3>
          <ul className="mt-2 divide-y divide-stone-100">
            {wnioski.map((w) => (
              <li key={w.id} className="py-2">
                {w.village_name} — {etykietaStatusu(w.status)}
                {w.admin_note ? (
                  <span className="mt-1 block text-xs text-stone-500">Uwaga admina: {w.admin_note}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
