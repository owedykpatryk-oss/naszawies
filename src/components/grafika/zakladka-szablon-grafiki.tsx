"use client";

import { MiniaturaSzablonuGrafiki } from "@/components/grafika/podglad-szablonu-grafiki";
import { PrzyciskUlubionySzablon } from "@/components/grafika/przycisk-ulubiony-szablon";
import { SekcjaOstatnieSzablony } from "@/components/grafika/sekcja-ostatnie-szablony";
import { SekcjaPaczkiWowGrupy } from "@/components/grafika/sekcja-paczki-wow-grupy";
import { SekcjaPolecaneMiesiac } from "@/components/grafika/sekcja-polecane-miesiac";
import { SekcjaSzybkieTematy } from "@/components/grafika/sekcja-szybkie-tematy";
import { SekcjaSzablonySpolecznosci } from "@/components/grafika/sekcja-szablony-spolecznosci";
import { SekcjaUlubioneSzablony } from "@/components/grafika/sekcja-ulubione-szablony";
import { ETYKIETY_TEMATU, type FiltrTematuGrafiki } from "@/lib/grafika/filtr-tematu";
import { znajdzMotyw } from "@/lib/grafika/motywy";
import { domyslneWartosciPol, ETYKIETY_KATEGORII, znajdzSzablon } from "@/lib/grafika/szablony";
import { PACZKI_SEZONOWE } from "@/lib/grafika/szablony-sezonowe";
import type { KontekstGrafiki, SzablonGrafiki, SzablonSpolecznosciGrafiki } from "@/lib/grafika/typy";

type Props = {
  kontekst: KontekstGrafiki;
  szablonId: string;
  szablony: SzablonGrafiki[];
  kategoria: string;
  filtr: string;
  filtrTemat: FiltrTematuGrafiki;
  liczbaWszystkich: number;
  onKategoria: (k: string) => void;
  onFiltr: (f: string) => void;
  onFiltrTemat: (t: FiltrTematuGrafiki) => void;
  onWyborSzablon: (id: string) => void;
  onPodgladSzablon?: (id: string) => void;
  onWyborPaczkiWow: (w: {
    szablonId: string;
    motywId: string;
    wartosci: Record<string, string>;
    tytulProjektu: string;
    komunikat: string;
  }) => void;
  onUzyjSzablonSpolecznosci: (s: SzablonSpolecznosciGrafiki) => void;
  odswiezKluczSzablonow?: number;
  onDalej: () => void;
};

export function ZakladkaSzablonGrafiki({
  kontekst,
  szablonId,
  szablony,
  kategoria,
  filtr,
  filtrTemat,
  liczbaWszystkich,
  onKategoria,
  onFiltr,
  onFiltrTemat,
  onWyborSzablon,
  onPodgladSzablon,
  onWyborPaczkiWow,
  onUzyjSzablonSpolecznosci,
  odswiezKluczSzablonow,
  onDalej,
}: Props) {
  const kategorie = Array.from(new Set(szablony.map((s) => s.kategoria)));

  const uruchomSezonowa = (p: (typeof PACZKI_SEZONOWE)[number]) => {
    const sz = znajdzSzablon(p.szablonId);
    if (!sz) return;
    onWyborPaczkiWow({
      szablonId: p.szablonId,
      motywId: p.motywId ?? sz.domyslnyMotyw,
      wartosci: domyslneWartosciPol(sz, kontekst),
      tytulProjektu: p.tytulProjektu ?? sz.tytul,
      komunikat: `Szablon sezonowy „${p.nazwa}” gotowy — uzupełnij datę i szczegóły.`,
    });
  };

  return (
    <section className="space-y-4">
      <SekcjaSzybkieTematy kontekst={kontekst} onWybor={onWyborPaczkiWow} />
      <SekcjaPaczkiWowGrupy kontekst={kontekst} onWybor={onWyborPaczkiWow} />
      <SekcjaUlubioneSzablony kontekst={kontekst} onWybor={onWyborPaczkiWow} />
      <SekcjaPolecaneMiesiac kontekst={kontekst} onWybor={onWyborPaczkiWow} />
      <SekcjaOstatnieSzablony kontekst={kontekst} onWybor={onWyborPaczkiWow} />
      <SekcjaSzablonySpolecznosci onUzyj={onUzyjSzablonSpolecznosci} odswiezKlucz={odswiezKluczSzablonow} />

      <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/80 via-white to-orange-50/30 p-4 shadow-sm sm:p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-900">Kalendarz wiejski</p>
        <h2 className="font-serif text-lg text-amber-950">Skróty sezonowe — gotowe w 1 klik</h2>
        <p className="mt-1 text-sm text-stone-600">
          Mikołajki, dożynki, Wielkanoc — wypełniony szablon, motyw i treść. Jak paczki WOW, ale pod święta.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PACZKI_SEZONOWE.map((p) => {
            const sz = znajdzSzablon(p.szablonId);
            const motyw = znajdzMotyw(p.motywId ?? sz?.domyslnyMotyw ?? "zielony-wies");
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => uruchomSezonowa(p)}
                className="group relative overflow-hidden rounded-xl border border-amber-200/80 bg-white text-left shadow-sm transition hover:border-amber-500 hover:shadow-md active:scale-[0.99]"
              >
                {p.badge ? (
                  <span className="absolute right-2 top-2 z-10 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-amber-950">
                    {p.badge}
                  </span>
                ) : null}
                {sz ? (
                  <div className="border-b border-amber-100 p-1.5 bg-stone-50/80 group-hover:bg-amber-50/40">
                    <MiniaturaSzablonuGrafiki szablon={sz} motyw={motyw} />
                  </div>
                ) : null}
                <div className="p-2.5">
                  <span className="mr-1">{p.emoji}</span>
                  <span className="text-sm font-semibold text-stone-900">{p.nazwa}</span>
                  <p className="mt-0.5 text-xs text-stone-500">{p.opis}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="font-serif text-lg text-green-950">Wybierz szablon</h2>
        <p className="mt-1 text-sm text-stone-600">
          Pełna biblioteka szablonów. Najedź lub kliknij — podgląd po prawej aktualizuje się na żywo.
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onKategoria("wszystkie")}
            className={`rounded-full px-3 py-1 text-xs ${
              kategoria === "wszystkie" ? "bg-green-800 text-white" : "bg-stone-100 text-stone-700"
            }`}
          >
            Wszystkie
          </button>
          {kategorie.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => onKategoria(k)}
              className={`rounded-full px-3 py-1 text-xs ${
                kategoria === k ? "bg-green-800 text-white" : "bg-stone-100 text-stone-700"
              }`}
            >
              {ETYKIETY_KATEGORII[k] ?? k}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {(Object.keys(ETYKIETY_TEMATU) as FiltrTematuGrafiki[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onFiltrTemat(t)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                filtrTemat === t ? "bg-sky-800 text-white" : "bg-sky-50 text-sky-900 ring-1 ring-sky-200"
              }`}
            >
              {ETYKIETY_TEMATU[t]}
            </button>
          ))}
        </div>

        <input
          type="search"
          placeholder="Szukaj: wesele, KGW, UA, dyplom…"
          value={filtr}
          onChange={(e) => onFiltr(e.target.value)}
          className="mt-3 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />

        <p className="mt-2 text-xs text-stone-500">
          {filtr.trim() || filtrTemat !== "wszystkie" || kategoria !== "wszystkie" ? (
            <>
              Znaleziono <strong>{szablony.length}</strong> z {liczbaWszystkich} szablonów
              {szablony.length === 0 ? " — zmień filtr." : "."}
            </>
          ) : (
            <>Dostępnych szablonów: {liczbaWszystkich}.</>
          )}
        </p>

        <div className="mt-4 grid max-h-[420px] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
          {szablony.length === 0 ? (
            <p className="col-span-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              Brak szablonów — wyczyść wyszukiwanie lub wybierz „Wszystkie tematy”.
            </p>
          ) : null}
          {szablony.map((s) => {
            const m = znajdzMotyw(s.domyslnyMotyw);
            const aktywny = s.id === szablonId;
            return (
              <div
                key={s.id}
                className={`relative rounded-lg border p-1.5 transition ${
                  aktywny
                    ? "border-green-700 bg-green-50 ring-2 ring-green-700 ring-offset-1"
                    : "border-stone-200 hover:border-green-600 hover:shadow-sm"
                }`}
              >
                <div className="absolute right-1 top-1 z-10">
                  <PrzyciskUlubionySzablon szablonId={s.id} className="bg-white/90 shadow-sm" />
                </div>
                <button
                  type="button"
                  onClick={() => onWyborSzablon(s.id)}
                  onMouseEnter={() => onPodgladSzablon?.(s.id)}
                  onFocus={() => onPodgladSzablon?.(s.id)}
                  className="w-full text-left"
                >
                  <MiniaturaSzablonuGrafiki szablon={s} motyw={m} />
                  <p className="mt-1 line-clamp-2 text-[10px] font-medium leading-tight text-stone-800">{s.tytul}</p>
                </button>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onDalej}
          className="mt-4 w-full rounded-lg bg-green-800 py-2.5 text-sm font-medium text-white sm:w-auto sm:px-6"
        >
          Dalej — edytuj treść →
        </button>
      </div>
    </section>
  );
}
