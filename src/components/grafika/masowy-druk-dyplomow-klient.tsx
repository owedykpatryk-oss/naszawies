"use client";

import { useCallback, useMemo, useState } from "react";
import { PrzyciskPobierzPdf } from "@/components/dokumenty/przycisk-pobierz-pdf";
import { bezpiecznaNazwaPlikuPdf, pobierzPdfZElementuHtml } from "@/lib/dokumenty/pobierz-pdf-z-elementu";
import { PodgladSzablonuGrafiki } from "@/components/grafika/podglad-szablonu-grafiki";
import { MOTYWY_GRAFIKI, znajdzMotyw } from "@/lib/grafika/motywy";
import { domyslneWartosciPol, znajdzSzablon } from "@/lib/grafika/szablony";
import type { KontekstGrafiki, SzablonGrafiki } from "@/lib/grafika/typy";

type Props = {
  kontekst: KontekstGrafiki;
  szablonId?: string;
  motywId?: string;
  szablonyDyplomow?: SzablonGrafiki[];
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
  szablonId: poczatkowySzablonId = "dyplom-dziecko-konkurs",
  motywId: poczatkowyMotywId = "turkusowy-letni",
  szablonyDyplomow = [],
}: Props) {
  const listaDyplomow = szablonyDyplomow.length > 0 ? szablonyDyplomow : [];
  const [wybranySzablonId, ustawWybranySzablonId] = useState(poczatkowySzablonId);
  const [wybranyMotywId, ustawWybranyMotywId] = useState(poczatkowyMotywId);

  const szablon = znajdzSzablon(wybranySzablonId) ?? znajdzSzablon(poczatkowySzablonId);
  const motyw = znajdzMotyw(wybranyMotywId);
  const [csvTekst, ustawCsvTekst] = useState("Imię i nazwisko\nJan Kowalski\nAnna Nowak\n");
  const [uzasadnienie, ustawUzasadnienie] = useState(
    "Za udział w konkursie plastycznym „Moja wieś oczami dziecka”.",
  );

  const imiona = useMemo(() => parsujCsvImiona(csvTekst), [csvTekst]);
  const [ladujeMasowo, ustawLadujeMasowo] = useState(false);
  const [komunikatMasowy, ustawKomunikatMasowy] = useState<string | null>(null);

  const pobierzWszystkie = useCallback(async () => {
    if (imiona.length === 0) return;
    ustawLadujeMasowo(true);
    ustawKomunikatMasowy(null);
    let ok = 0;
    for (let i = 0; i < imiona.length; i++) {
      const el = document.getElementById(`dyplom-masowy-${i}`);
      if (!el) continue;
      const r = await pobierzPdfZElementuHtml(el as HTMLElement, {
        nazwaPliku: bezpiecznaNazwaPlikuPdf(`dyplom-${imiona[i]!.replace(/\s+/g, "-")}`),
      });
      if (r.ok) ok++;
      await new Promise((resolve) => window.setTimeout(resolve, 450));
    }
    ustawLadujeMasowo(false);
    ustawKomunikatMasowy(`Pobrano ${ok} z ${imiona.length} dyplomów.`);
  }, [imiona]);

  if (!szablon) {
    return <p className="text-sm text-red-700">Brak szablonu dyplomu.</p>;
  }

  const bazowe = domyslneWartosciPol(szablon, kontekst);

  return (
    <div className="space-y-6 rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/30 p-4 sm:p-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Tryb masowy</p>
        <h2 className="font-serif text-lg text-emerald-950">Wiele dyplomów naraz</h2>
        <p className="mt-1 text-sm text-stone-600">
          Wybierz szablon i motyw, wklej listę imion — każdy wiersz to osobny dyplom PDF z podglądem na żywo.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {listaDyplomow.length > 0 ? (
          <label className="block text-sm">
            <span className="font-medium">Szablon dyplomu</span>
            <select
              value={wybranySzablonId}
              onChange={(e) => {
                const id = e.target.value;
                ustawWybranySzablonId(id);
                const s = znajdzSzablon(id);
                if (s) ustawWybranyMotywId(s.domyslnyMotyw);
              }}
              className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
            >
              {listaDyplomow.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.tytul}
                </option>
              ))}
            </select>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(
                [
                  {
                    id: "dyplom-dziecko-konkurs",
                    label: "Konkurs",
                    uz: "Za udział w konkursie plastycznym „Moja wieś oczami dziecka”.",
                  },
                  {
                    id: "dyplom-super-dziecko",
                    label: "Super Dziecko",
                    uz: "Za aktywność w świetlicy i życzliwość wobec rówieśników.",
                  },
                  {
                    id: "dyplom-wolontariusz",
                    label: "Wolontariusz",
                    uz: "Za pomoc przy organizacji festynu i zaangażowanie na rzecz wsi.",
                  },
                  {
                    id: "dyplom-patriotyczny",
                    label: "11 listopada",
                    uz: "Za udział w uroczystościach z okazji Narodowego Święta Niepodległości.",
                  },
                ] as const
              )
                .filter((p) => znajdzSzablon(p.id))
                .map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      ustawWybranySzablonId(p.id);
                      const s = znajdzSzablon(p.id);
                      if (s) ustawWybranyMotywId(s.domyslnyMotyw);
                      ustawUzasadnienie(p.uz);
                    }}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                      wybranySzablonId === p.id
                        ? "bg-emerald-800 text-white"
                        : "bg-white text-stone-700 ring-1 ring-stone-200 hover:ring-emerald-400"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
            </div>
          </label>
        ) : null}
        <label className="block text-sm">
          <span className="font-medium">Motyw kolorystyczny</span>
          <select
            value={wybranyMotywId}
            onChange={(e) => ustawWybranyMotywId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
          >
            {MOTYWY_GRAFIKI.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nazwa}
              </option>
            ))}
          </select>
        </label>
      </div>

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
          {imiona.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void pobierzWszystkie()}
                disabled={ladujeMasowo}
                className="rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-60"
              >
                {ladujeMasowo ? "Pobieranie PDF…" : `Pobierz wszystkie (${imiona.length})`}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
              >
                Drukuj wszystkie
              </button>
            </div>
          ) : null}
          {komunikatMasowy ? <p className="text-sm text-green-800">{komunikatMasowy}</p> : null}
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
                <div key={id} className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm">
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
