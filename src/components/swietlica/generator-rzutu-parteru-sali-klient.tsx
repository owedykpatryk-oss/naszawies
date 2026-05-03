"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import {
  presetJednaDuzaSala,
  presetRzutuSwietlicaLStudzienki,
  presetSalaPlusZaplecze,
  type RzutParteruSaliJson,
} from "@/lib/swietlica/rzut-parteru-sali";
import { zapiszRzutParteruSali } from "@/app/(site)/panel/soltys/akcje";
import { RzutParteruSaliSvg } from "./rzut-parteru-sali-svg";

type SzablonId = "l_studzienki" | "jedna_sala" | "sala_zaplecze";

const SZABLONY: { id: SzablonId; label: string; krotko: string }[] = [
  {
    id: "l_studzienki",
    label: "Świetlica L (wzorzec Studzienki)",
    krotko: "Wiatrołap, WC, kuchnia, sala w kształcie L — gotowe metraże",
  },
  { id: "jedna_sala", label: "Jedna duża sala", krotko: "Prosty prostokąt — dopasuj opis i wymiary" },
  { id: "sala_zaplecze", label: "Sala + zaplecze", krotko: "Dwa prostokąty obok siebie" },
];

function zSzablonu(id: SzablonId): RzutParteruSaliJson {
  if (id === "l_studzienki") return presetRzutuSwietlicaLStudzienki();
  if (id === "sala_zaplecze") return presetSalaPlusZaplecze();
  return presetJednaDuzaSala();
}

function mapKluczDoWyboru(k: string): SzablonId {
  if (k === "swietlica_l_studzienki") return "l_studzienki";
  if (k === "sala_zaplecze") return "sala_zaplecze";
  if (k === "jedna_sala") return "jedna_sala";
  return "l_studzienki";
}

function clampWymiarM(n: number): number {
  if (!Number.isFinite(n)) return 10;
  return Math.min(200, Math.max(1, Math.round(n * 10) / 10));
}

export function GeneratorRzutuParteruSaliKlient({
  hallId,
  poczatkowyRzut,
}: {
  hallId: string;
  poczatkowyRzut: RzutParteruSaliJson | null;
}) {
  const ostatnioZSerwera = useRef<RzutParteruSaliJson | null>(poczatkowyRzut);
  const [jestWersjaDoPrzywrocenia, ustawJestWersjaDoPrzywrocenia] = useState(() => poczatkowyRzut != null);
  const [wybrany, ustawWybrany] = useState<SzablonId>(() =>
    poczatkowyRzut ? mapKluczDoWyboru(poczatkowyRzut.szablonKlucz) : "l_studzienki",
  );
  const [roboczy, ustawRoboczy] = useState<RzutParteruSaliJson>(() => poczatkowyRzut ?? zSzablonu("l_studzienki"));
  const [notatka, ustawNotatka] = useState(() => poczatkowyRzut?.notatka?.trim() ?? "");
  const [komunikat, ustawKomunikat] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const podglad = useMemo(
    () => ({
      ...roboczy,
      notatka: notatka.trim() || null,
    }),
    [roboczy, notatka],
  );

  const wczytajSzablon = useCallback(() => {
    const b = zSzablonu(wybrany);
    ustawRoboczy({ ...b, notatka: notatka.trim() || b.notatka || null });
    ustawKomunikat("Załadowano szablon — sprawdź podgląd i zapisz.");
  }, [wybrany, notatka]);

  const zapiszWersje = useCallback(
    (doZapisu: RzutParteruSaliJson) => {
      ustawKomunikat(null);
      startTransition(async () => {
        const w = await zapiszRzutParteruSali(hallId, doZapisu);
        if ("blad" in w) {
          ustawKomunikat(w.blad);
          return;
        }
        ostatnioZSerwera.current = doZapisu;
        ustawJestWersjaDoPrzywrocenia(true);
        ustawKomunikat("Zapisano rzut parteru — mieszkańcy zobaczą go na stronie sali i w dokumencie informacyjnym.");
      });
    },
    [hallId],
  );

  const zapisz = useCallback(() => {
    const doZapisu: RzutParteruSaliJson = { ...roboczy, notatka: notatka.trim() || null };
    zapiszWersje(doZapisu);
  }, [roboczy, notatka, zapiszWersje]);

  const zapiszWybranySzablonOdRazu = useCallback(() => {
    const b = zSzablonu(wybrany);
    const doZapisu: RzutParteruSaliJson = { ...b, notatka: notatka.trim() || b.notatka || null };
    ustawRoboczy(doZapisu);
    zapiszWersje(doZapisu);
  }, [wybrany, notatka, zapiszWersje]);

  const przywrocZSerwera = useCallback(() => {
    const snap = ostatnioZSerwera.current;
    if (!snap) {
      ustawKomunikat("Brak wersji z serwera do przywrócenia.");
      return;
    }
    ustawRoboczy(snap);
    ustawNotatka(snap.notatka?.trim() ?? "");
    ustawWybrany(mapKluczDoWyboru(snap.szablonKlucz));
    ustawKomunikat("Przywrócono ostatnio zapisaną wersję (lub pierwsze wczytanie strony).");
  }, []);

  return (
    <section
      id="rzut-parteru-sali"
      className="scroll-mt-24 mt-8 max-w-full rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 p-4 shadow-sm sm:p-6"
    >
      <h2 className="font-serif text-xl text-green-950 sm:text-2xl">Generator rzutu parteru (pomieszczenia)</h2>
      <p className="mt-2 max-w-prose text-sm text-stone-600">
        To <strong>nie zastępuje</strong> planu stołów poniżej — to szybki schemat bryły i pomieszczeń dla mieszkańców
        (orientacja, nie CAD). Wybierz szablon, ewentualnie dopisz tytuł i wymiary zewnętrzne, zapisz.
      </p>

      <p
        className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
          poczatkowyRzut
            ? "border-emerald-200 bg-emerald-50/90 text-emerald-950"
            : "border-amber-200 bg-amber-50/90 text-amber-950"
        }`}
        role="status"
      >
        {poczatkowyRzut
          ? "Masz zapisany rzut w serwisie — mieszkańcy i dokument wynajmu go pokażą. Możesz go zmienić i zapisać ponownie."
          : "Nie masz jeszcze zapisanego rzutu — mieszkańcy go nie zobaczą, dopóki nie klikniesz zapisu."}
      </p>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr),minmax(0,320px)]">
        <div className="space-y-4">
          <fieldset>
            <legend className="text-xs font-bold uppercase tracking-wider text-stone-500">Szablon</legend>
            <div className="mt-2 flex flex-col gap-2">
              {SZABLONY.map((s) => (
                <label
                  key={s.id}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-stone-200 bg-white/90 p-3 shadow-sm has-[:checked]:border-emerald-500 has-[:checked]:ring-1 has-[:checked]:ring-emerald-400/40"
                >
                  <input
                    type="radio"
                    name="szablon-rzutu"
                    value={s.id}
                    checked={wybrany === s.id}
                    onChange={() => ustawWybrany(s.id)}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-medium text-stone-900">{s.label}</span>
                    <span className="mt-0.5 block text-xs text-stone-600">{s.krotko}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={wczytajSzablon}
              className="rounded-xl border border-emerald-700/40 bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900"
            >
              Załaduj szablon do podglądu
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={zapiszWybranySzablonOdRazu}
              className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50 disabled:opacity-60"
              title="Jeden krok: wczytuje wybrany szablon i od razu zapisuje w bazie"
            >
              Zapisz wybrany szablon od razu
            </button>
            {jestWersjaDoPrzywrocenia ? (
              <button
                type="button"
                onClick={przywrocZSerwera}
                className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100"
              >
                Przywróć ostatnio zapisaną wersję
              </button>
            ) : null}
          </div>

          <div className="rounded-xl border border-stone-200 bg-white/90 p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Dopasowanie (bez rysowania ścian)</p>
            <label className="mt-3 block text-sm text-stone-700">
              <span className="font-medium text-stone-900">Tytuł na rzucie</span>
              <input
                type="text"
                value={roboczy.tytul}
                maxLength={160}
                onChange={(e) => ustawRoboczy((r) => ({ ...r, tytul: e.target.value.slice(0, 160) }))}
                className="mt-1.5 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none ring-green-800/15 focus:border-emerald-600 focus:ring-2"
              />
            </label>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm text-stone-700">
                <span className="font-medium text-stone-900">Szerokość bryły (m)</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={1}
                  max={200}
                  step={0.1}
                  value={roboczy.bryla_szer_m}
                  onChange={(e) => {
                    const v = clampWymiarM(Number(e.target.value));
                    ustawRoboczy((r) => ({ ...r, bryla_szer_m: v }));
                  }}
                  className="mt-1.5 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm tabular-nums outline-none focus:border-emerald-600 focus:ring-2"
                />
              </label>
              <label className="block text-sm text-stone-700">
                <span className="font-medium text-stone-900">Głębokość bryły (m)</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={1}
                  max={200}
                  step={0.1}
                  value={roboczy.bryla_gleb_m}
                  onChange={(e) => {
                    const v = clampWymiarM(Number(e.target.value));
                    ustawRoboczy((r) => ({ ...r, bryla_gleb_m: v }));
                  }}
                  className="mt-1.5 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm tabular-nums outline-none focus:border-emerald-600 focus:ring-2"
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-stone-500">
              Proporcje pomieszczeń biorą się z szablonu (procenty siatki). Zmiana metrów aktualizuje podpis w podglądzie
              i w dokumencie druku.
            </p>
          </div>

          <label className="block text-sm text-stone-700">
            <span className="font-medium text-stone-900">Notatka (opcjonalnie)</span>
            <textarea
              value={notatka}
              onChange={(e) => ustawNotatka(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Np. numery drzwi, uwagi do remontu, link do BIP…"
              className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm shadow-inner outline-none ring-green-800/15 focus:border-emerald-600 focus:ring-2"
            />
          </label>

          {komunikat ? (
            <p
              className={`rounded-lg px-3 py-2 text-sm ${
                komunikat.startsWith("Zapisano")
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-950"
                  : komunikat.startsWith("Przywrócono")
                    ? "border border-stone-200 bg-stone-50 text-stone-800"
                    : "border border-amber-200 bg-amber-50 text-amber-950"
              }`}
              role="status"
            >
              {komunikat}
            </p>
          ) : null}

          <button
            type="button"
            disabled={pending}
            onClick={zapisz}
            className="w-full rounded-xl border border-green-900/20 bg-green-900 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-green-950 disabled:opacity-60 sm:w-auto"
          >
            {pending ? "Zapisywanie…" : "Zapisz rzut parteru sali"}
          </button>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-3 shadow-inner">
          <p className="text-center text-[10px] font-bold uppercase tracking-wider text-stone-500">Podgląd</p>
          <p className="mt-1 text-center text-xs text-stone-600">
            Bryła ok. {podglad.bryla_szer_m} × {podglad.bryla_gleb_m} m
          </p>
          <div className="mt-3 aspect-[4/3] w-full">
            <RzutParteruSaliSvg plan={podglad} className="h-full w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
