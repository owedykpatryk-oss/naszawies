"use client";

import { useMemo, useState } from "react";
import { PrzyciskPobierzPdf } from "@/components/dokumenty/przycisk-pobierz-pdf";
import { PodgladSzablonuGrafiki } from "@/components/grafika/podglad-szablonu-grafiki";
import { znajdzMotyw } from "@/lib/grafika/motywy";
import { domyslneWartosciPol, znajdzSzablon } from "@/lib/grafika/szablony";
import type { KontekstGrafiki } from "@/lib/grafika/typy";

type Props = {
  kontekst: KontekstGrafiki;
  szablonId?: string;
  motywId?: string;
};

function parsujCsvImiona(tekst: string): string[] {
  const linie = tekst
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (linie.length === 0) return [];
  const pierwsza = linie[0]!.toLowerCase();
  const maNaglowek = pierwsza.includes("imi") || pierwsza.includes("nazw") || pierwsza === "name";
  const dane = maNaglowek ? linie.slice(1) : linie;
  return dane.map((l) => {
    const kol = l.split(/[,;]/)[0]?.trim();
    return kol || l;
  });
}

export function MasowyDrukDyplomowKlient({
  kontekst,
  szablonId = "dyplom-dziecko-konkurs",
  motywId = "turkusowy-letni",
}: Props) {
  const szablon = znajdzSzablon(szablonId);
  const motyw = znajdzMotyw(motywId);
  const [csvTekst, ustawCsvTekst] = useState("Imię i nazwisko\nJan Kowalski\nAnna Nowak\n");
  const [uzasadnienie, ustawUzasadnienie] = useState(
    "Za udział w konkursie plastycznym „Moja wieś oczami dziecka”.",
  );

  const imiona = useMemo(() => parsujCsvImiona(csvTekst), [csvTekst]);

  if (!szablon) {
    return <p className="text-sm text-red-700">Brak szablonu dyplomu.</p>;
  }

  const bazowe = domyslneWartosciPol(szablon, kontekst);

  return (
    <div className="space-y-6">
      <p className="text-sm text-stone-600">
        Wklej listę imion i nazwisk (CSV lub po jednym w linii). Każdy wiersz = osobny dyplom do pobrania jako PDF.
      </p>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <label className="block text-sm">
            <span className="font-medium">Lista uczestników (CSV / linie)</span>
            <textarea
              rows={10}
              value={csvTekst}
              onChange={(e) => ustawCsvTekst(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 font-mono text-sm"
              placeholder={"Imię i nazwisko\nJan Kowalski\nAnna Nowak"}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Wspólne uzasadnienie (za co)</span>
            <textarea
              rows={3}
              value={uzasadnienie}
              onChange={(e) => ustawUzasadnienie(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
          <p className="text-sm font-medium text-green-900">
            Przygotowano: {imiona.length} dyplom{imiona.length === 1 ? "" : imiona.length < 5 ? "y" : "ów"}
          </p>
        </div>
        <div className="max-h-[70vh] space-y-8 overflow-y-auto rounded-xl border border-stone-200 bg-stone-50 p-4">
          {imiona.length === 0 ? (
            <p className="text-sm text-stone-500">Dodaj co najmniej jedno imię i nazwisko.</p>
          ) : (
            imiona.map((imie, i) => {
              const id = `dyplom-masowy-${i}`;
              const wartosci = {
                ...bazowe,
                tytul: imie,
                opis: uzasadnienie,
              };
              const nazwaPliku = `dyplom-${imie.replace(/\s+/g, "-")}`;
              return (
                <div key={id} className="rounded-xl border border-stone-200 bg-white p-3">
                  <div className="no-print mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-stone-800">{imie}</span>
                    <PrzyciskPobierzPdf elementId={id} nazwaPliku={nazwaPliku} className="!w-auto" />
                  </div>
                  <div className="overflow-x-auto">
                    <PodgladSzablonuGrafiki
                      szablon={szablon}
                      motyw={motyw}
                      wartosci={wartosci}
                      elementId={id}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
