"use client";

import { FormEvent, useState } from "react";
import { PolaZgodyRejestracji, czyZaznaczoneZgodyRejestracji } from "@/components/rodo/pola-zgody-rejestracji";
import { zaakceptujDokumentyPrawne } from "./akcje-akceptacja";

type Props = {
  nastepnaSciezka: string;
};

export function AkceptacjaRegulaminuKlient({ nastepnaSciezka }: Props) {
  const [blad, ustawBlad] = useState("");
  const [laduje, ustawLaduje] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    ustawBlad("");
    ustawLaduje(true);
    try {
      const wynik = await zaakceptujDokumentyPrawne(czyZaznaczoneZgodyRejestracji(fd), nastepnaSciezka);
      if ("blad" in wynik) {
        ustawBlad(wynik.blad);
        return;
      }
      window.location.href = wynik.next;
    } finally {
      ustawLaduje(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mx-auto max-w-lg space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-stone-700">
        Przed korzystaniem z panelu i mapy zaakceptuj aktualny regulamin i politykę prywatności. Dotyczy to także kont
        utworzonych przez Google — zgody zbieramy przed pierwszym użyciem serwisu.
      </p>
      <PolaZgodyRejestracji idPrefix="akceptacja" />
      {blad ? (
        <p className="text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={laduje}
        className="w-full rounded-xl bg-green-800 px-4 py-2.5 font-medium text-white hover:bg-green-900 disabled:opacity-60"
      >
        {laduje ? "Zapisuję…" : "Akceptuję i przechodzę dalej"}
      </button>
    </form>
  );
}
