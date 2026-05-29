"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { LazyWidoczny } from "@/components/ui/lazy-widoczny";
import { OslonaSekcjiWies, KARTA_LISTY_WIES } from "@/components/wies/oslona-sekcji-wies";
import { TytulSekcjiWies } from "@/components/wies/tytul-sekcji-wies";
import { etykietaKategoriiPoi } from "@/lib/mapa/kategorie-poi";
import { PRODUKTY_ROLNE, etykietaProduktuRolnego } from "@/lib/rolnictwo/produkty-rolne";
import type { CenaGusAktualna, PunktHistoriiGus } from "@/lib/rolnictwo/grupuj-ceny-gus";

type PoiRolny = {
  id: string;
  name: string;
  category: string;
  latitude: number | string | null;
  longitude: number | string | null;
  village_id?: string;
};

type CenaLokalna = {
  id: string;
  product_key: string;
  price_value: number;
  price_unit: string;
  place_name: string;
  observed_at: string;
  notes: string | null;
  confirmation_count: number;
  zweryfikowane_spolecznie: boolean;
};

type DaneRolnictwa = {
  wies: { name: string; county: string; voivodeship: string; regionGus?: string };
  cenyGusAktualne: CenaGusAktualna[];
  historiaGus: PunktHistoriiGus[];
  produktWykres: string;
  poisRolne: PoiRolny[];
  poisZPowiatu: boolean;
  cenyLokalne: CenaLokalna[];
  minPotwierdzen: number;
  disclaimer: string;
};

const MIESIACE = [
  "styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec",
  "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień",
];

function WykresCenGus({ punkty, jednostka }: { punkty: PunktHistoriiGus[]; jednostka: string }) {
  if (punkty.length < 2) return null;
  const wartosci = punkty.map((p) => p.value);
  const max = Math.max(...wartosci);
  const min = Math.min(...wartosci);
  const zakres = max - min || 1;

  return (
    <div className="mt-4" role="img" aria-label={`Wykres cen GUS w ${jednostka}`}>
      <div className="flex h-28 items-end gap-0.5 sm:gap-1">
        {punkty.map((p) => {
          const wysokosc = ((p.value - min) / zakres) * 72 + 16;
          return (
            <div
              key={`${p.year}-${p.month}`}
              className="group flex min-w-0 flex-1 flex-col items-center gap-1"
            >
              <span className="hidden text-[10px] font-medium text-emerald-800 group-hover:block sm:block">
                {p.value}
              </span>
              <div
                className="w-full rounded-t bg-emerald-600 transition-colors group-hover:bg-emerald-700"
                style={{ height: `${wysokosc}px` }}
                title={`${p.label}: ${p.value} ${jednostka}`}
              />
              <span className="max-w-full truncate text-[8px] text-stone-500 sm:text-[9px]">
                {p.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TrescRolnictwa({
  villageId,
  zalogowany,
}: {
  villageId: string;
  zalogowany: boolean;
}) {
  const [stan, setStan] = useState<"laduje" | "ok" | "blad">("laduje");
  const [dane, setDane] = useState<DaneRolnictwa | null>(null);
  const [produktWykres, setProduktWykres] = useState("pszenica");
  const [, startTransition] = useTransition();

  useEffect(() => {
    let anuluj = false;
    async function pobierz() {
      try {
        const res = await fetch(`/api/wies/${villageId}/rolnictwo?produkt=${produktWykres}`);
        if (anuluj) return;
        if (!res.ok) {
          setStan("blad");
          return;
        }
        setDane((await res.json()) as DaneRolnictwa);
        setStan("ok");
      } catch {
        if (!anuluj) setStan("blad");
      }
    }
    void pobierz();
    return () => {
      anuluj = true;
    };
  }, [villageId, produktWykres]);

  if (stan === "laduje") {
    return (
      <section
        id="sekcja-rolnictwo"
        className="mt-10 h-40 animate-pulse rounded-2xl bg-stone-100"
        aria-busy="true"
        aria-label="Ładowanie rolnictwa"
      />
    );
  }

  if (stan === "blad" || !dane) return null;

  const jednostkaWykres =
    PRODUKTY_ROLNE.find((p) => p.key === produktWykres)?.jednostka ?? "zł";
  const regionNazwa = dane.wies.regionGus ?? dane.wies.county;

  return (
    <OslonaSekcjiWies id="sekcja-rolnictwo" className="mt-10 scroll-mt-24">
      <TytulSekcjiWies tytul="Rolnictwo w okolicy" opis="Ceny orientacyjne i miejsca odbioru" />

      <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        {dane.disclaimer}
      </p>

      {dane.cenyGusAktualne.length > 0 ? (
        <div className={`${KARTA_LISTY_WIES} mb-6 p-4`}>
          <h3 className="mb-3 font-semibold text-stone-900">
            Średnie ceny skupu — region {regionNazwa}
          </h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {dane.cenyGusAktualne.map((c) => (
              <li key={c.product_key} className="text-sm text-stone-700">
                <span className="font-medium text-stone-900">{c.product_label}</span>
                {": "}
                {c.value} {c.unit}
                <span className="text-stone-500">
                  {" "}
                  ({MIESIACE[c.month - 1]} {c.year}, GUS)
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-5 border-t border-stone-100 pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">
              Trend 12 miesięcy
            </p>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {PRODUKTY_ROLNE.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => startTransition(() => setProduktWykres(p.key))}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    produktWykres === p.key
                      ? "bg-emerald-700 text-white"
                      : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <WykresCenGus punkty={dane.historiaGus} jednostka={jednostkaWykres} />
          </div>
        </div>
      ) : (
        <p className="mb-4 text-sm text-stone-600">
          Brak świeżych danych GUS dla powiatu — pojawią się po miesięcznej synchronizacji.
        </p>
      )}

      {dane.poisRolne.length > 0 && (
        <div className={`${KARTA_LISTY_WIES} mb-6 p-4`}>
          <h3 className="mb-1 font-semibold text-stone-900">Skupy i sklepy rolnicze</h3>
          {dane.poisZPowiatu && (
            <p className="mb-3 text-xs text-stone-500">
              Punkty z całego powiatu {dane.wies.county} — najpierw w tej wsi.
            </p>
          )}
          <ul className="space-y-2">
            {dane.poisRolne.map((p) => (
              <li key={p.id} className="text-sm text-stone-700">
                <span className="font-medium text-stone-900">{p.name}</span>
                <span className="text-stone-500"> — {etykietaKategoriiPoi(p.category)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className={`${KARTA_LISTY_WIES} p-4`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-stone-900">Ceny od sąsiadów</h3>
          <div className="flex flex-wrap gap-3">
            {zalogowany && (
              <>
                <Link
                  href="/panel/mieszkaniec/rolnictwo-ceny"
                  className="text-sm font-medium text-emerald-800 underline-offset-2 hover:underline"
                >
                  Zgłoś lub potwierdź cenę
                </Link>
                <Link
                  href="/panel/mieszkaniec/marketplace"
                  className="text-sm font-medium text-emerald-800 underline-offset-2 hover:underline"
                >
                  Rynek lokalny
                </Link>
              </>
            )}
          </div>
        </div>
        {dane.cenyLokalne.length === 0 ? (
          <p className="text-sm text-stone-600">
            Nikt jeszcze nie zgłosił ceny w tej wsi.{" "}
            {zalogowany ? "Bądź pierwszy — inni mogą to potwierdzić." : "Zaloguj się, aby dodać zgłoszenie."}
          </p>
        ) : (
          <ul className="space-y-3">
            {dane.cenyLokalne.map((c) => (
              <li key={c.id} className="border-b border-stone-100 pb-3 last:border-0 last:pb-0">
                <p className="text-sm font-medium text-stone-900">
                  {etykietaProduktuRolnego(c.product_key)} — {c.price_value} {c.price_unit}
                  <span className="font-normal text-stone-500"> @ {c.place_name}</span>
                </p>
                <p className="text-xs text-stone-500">
                  {c.observed_at}
                  {" · "}
                  {c.confirmation_count} {c.confirmation_count === 1 ? "osoba" : "osób"} potwierdza
                  {c.zweryfikowane_spolecznie ? " · zweryfikowane społecznie" : ""}
                </p>
                {c.notes && <p className="mt-1 text-xs text-stone-600">{c.notes}</p>}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-stone-500">
          Wiarygodność rośnie, gdy kolejni mieszkańcy potwierdzą tę samą cenę w tym samym miejscu (min.{" "}
          {dane.minPotwierdzen} osoby). Sołtys nie akceptuje tych zgłoszeń — to głos społeczności.
        </p>
      </div>
    </OslonaSekcjiWies>
  );
}

export function WiesRolnictwoLazy({
  villageId,
  zalogowany,
}: {
  villageId: string;
  zalogowany: boolean;
}) {
  return (
    <LazyWidoczny rootMargin="300px 0px" className="min-h-[12rem]">
      <TrescRolnictwa villageId={villageId} zalogowany={zalogowany} />
    </LazyWidoczny>
  );
}
