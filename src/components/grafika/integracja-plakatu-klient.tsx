"use client";

import { useState, useTransition } from "react";
import {
  dodajDoKalendarzaZPlakatu,
  dodajOgloszenieZPlakatu,
  ustawPlakatNaTablicyCyfrowej,
} from "@/app/(site)/panel/grafika/akcje";

import Link from "next/link";

type Props = {
  projektId: string | null;
  maDate: boolean;
  trybSoltys: boolean;
  zapisDoBazy: boolean;
  onKomunikat: (tekst: string) => void;
  onBlad: (tekst: string) => void;
};

export function IntegracjaPlakatuKlient({
  projektId,
  maDate,
  trybSoltys,
  zapisDoBazy,
  onKomunikat,
  onBlad,
}: Props) {
  const [naTablicy, ustawNaTablicy] = useState(false);
  const [oczekuje, startTransition] = useTransition();

  if (!trybSoltys || !zapisDoBazy) return null;

  const wymagajZapisu = () => {
    if (!projektId) {
      onBlad("Najpierw zapisz projekt, potem dodaj ogłoszenie lub wydarzenie.");
      return false;
    }
    return true;
  };

  const ogloszenie = () => {
    if (!wymagajZapisu()) return;
    startTransition(async () => {
      const r = await dodajOgloszenieZPlakatu(projektId!);
      if ("blad" in r) {
        onBlad(r.blad);
        return;
      }
      onKomunikat("Ogłoszenie dodane na profil wsi (widoczne od razu).");
      onBlad("");
    });
  };

  const kalendarz = () => {
    if (!wymagajZapisu()) return;
    if (!maDate) {
      onBlad("Uzupełnij pole „Data” w kroku 2, aby dodać wydarzenie do kalendarza.");
      return;
    }
    startTransition(async () => {
      const r = await dodajDoKalendarzaZPlakatu(projektId!);
      if ("blad" in r) {
        onBlad(r.blad);
        return;
      }
      onKomunikat("Wydarzenie dodane do kalendarza społeczności wsi.");
      onBlad("");
    });
  };

  const tablica = () => {
    if (!wymagajZapisu()) return;
    startTransition(async () => {
      const r = await ustawPlakatNaTablicyCyfrowej(projektId!, !naTablicy);
      if ("blad" in r) {
        onBlad(r.blad);
        return;
      }
      ustawNaTablicy(!naTablicy);
      onKomunikat(
        !naTablicy
          ? "Plakat będzie rotował na tablicy cyfrowej świetlicy (po publikacji na profilu)."
          : "Plakat usunięty z rotacji tablicy cyfrowej.",
      );
      onBlad("");
    });
  };

  return (
    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
      <p className="text-sm font-semibold text-emerald-950">Powiązania z profilem wsi</p>
      <p className="mt-1 text-xs text-stone-600">
        Jeden klik — plakat staje się ogłoszeniem lub wpisem w kalendarzu wydarzeń.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={oczekuje}
          onClick={ogloszenie}
          className="rounded-lg border border-emerald-800 bg-white px-3 py-2 text-sm text-emerald-900 hover:bg-emerald-100 disabled:opacity-60"
        >
          Dodaj jako ogłoszenie
        </button>
        <button
          type="button"
          disabled={oczekuje}
          onClick={kalendarz}
          className="rounded-lg border border-emerald-800 bg-white px-3 py-2 text-sm text-emerald-900 hover:bg-emerald-100 disabled:opacity-60"
        >
          Dodaj do kalendarza
        </button>
        <button
          type="button"
          disabled={oczekuje}
          onClick={tablica}
          className={`rounded-lg border px-3 py-2 text-sm disabled:opacity-60 ${
            naTablicy
              ? "border-violet-800 bg-violet-100 text-violet-950"
              : "border-violet-700 bg-white text-violet-900 hover:bg-violet-50"
          }`}
        >
          {naTablicy ? "✓ Na tablicy cyfrowej" : "Pokaż na tablicy świetlicy"}
        </button>
      </div>
      <p className="mt-3 text-xs text-stone-600">
        Po imprezie dodaj zdjęcia do{" "}
        <Link href="/panel/soltys/fotokronika" className="text-green-800 underline">
          fotokroniki wsi
        </Link>
        . Kod QR „Fotokronika” w kroku 3 zachęci mieszkańców do wysyłania zdjęć.
      </p>
    </div>
  );
}
