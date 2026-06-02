"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LazyWidoczny } from "@/components/ui/lazy-widoczny";
import { OslonaSekcjiWies, KARTA_LISTY_WIES } from "@/components/wies/oslona-sekcji-wies";
import { TytulSekcjiWies } from "@/components/wies/tytul-sekcji-wies";
import { formatujTrend, type StacjaPaliwWOkolicy } from "@/lib/paliwa/stacje-w-okolicy";

type Statystyki = {
  lastUpdated: string | null;
  pb95: number | null;
  on: number | null;
  lpg: number | null;
  trendPb95_7d: number | null;
  trendOn_7d: number | null;
  trendLpg_7d: number | null;
  totalStations: number | null;
  fetchedAt: string | null;
};

type CenaOpal = {
  id: string;
  product_label: string;
  price_value: number;
  price_unit: string;
  place_name: string;
  observed_at: string;
  notes: string | null;
  confirmation_count: number;
  zweryfikowane_spolecznie: boolean;
};

type DaneCenyOkolicy = {
  wies: { name: string; maWspolrzedne: boolean };
  statystyki: Statystyki | null;
  stacjeWKola: number;
  promienKm: number;
  najtansze: {
    pb95: StacjaPaliwWOkolicy[];
    on: StacjaPaliwWOkolicy[];
    lpg: StacjaPaliwWOkolicy[];
  };
  cenyOpal: CenaOpal[];
  minPotwierdzen: number;
  disclaimer: string;
  zrodloPaliw: string;
};

function formatCena(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return v.toFixed(2).replace(".", ",") + " zł/l";
}

function wierszStacji(s: StacjaPaliwWOkolicy, pole: "pb95" | "on" | "lpg") {
  const cena = s[pole];
  if (cena == null) return null;
  return (
    <li
      key={`${s.externalId}-${pole}`}
      className="flex flex-wrap items-baseline justify-between gap-2 border-b border-stone-100 py-2 text-sm last:border-0"
    >
      <div className="min-w-0">
        <span className="font-medium text-stone-900">{s.name}</span>
        {s.brand ? <span className="text-stone-500"> · {s.brand}</span> : null}
        {s.city ? <span className="block text-xs text-stone-500">{s.city}</span> : null}
      </div>
      <div className="text-right shrink-0">
        <span className="font-semibold text-emerald-900">{formatCena(cena)}</span>
        <span className="block text-xs text-stone-500">{s.odlegloscKm} km</span>
      </div>
    </li>
  );
}

function BlokNajtanszych({
  tytul,
  stacje,
  pole,
}: {
  tytul: string;
  stacje: StacjaPaliwWOkolicy[];
  pole: "pb95" | "on" | "lpg";
}) {
  if (stacje.length === 0) return null;
  return (
    <div className={`${KARTA_LISTY_WIES} p-4`}>
      <h3 className="font-semibold text-stone-900">{tytul}</h3>
      <ul className="mt-2">{stacje.map((s) => wierszStacji(s, pole))}</ul>
    </div>
  );
}

type Props = {
  villageId: string;
  zalogowany: boolean;
};

export function WiesCenyOkolicyLazy({ villageId, zalogowany }: Props) {
  const [stan, ustawStan] = useState<"laduje" | "ok" | "blad">("laduje");
  const [dane, ustawDane] = useState<DaneCenyOkolicy | null>(null);
  const wczytano = useRef(false);

  useEffect(() => {
    if (wczytano.current) return;
    wczytano.current = true;
    void fetch(`/api/wies/${villageId}/ceny-okolicy`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("fetch"))))
      .then((json: DaneCenyOkolicy) => {
        ustawDane(json);
        ustawStan("ok");
      })
      .catch(() => ustawStan("blad"));
  }, [villageId]);

  if (stan === "laduje") {
    return (
      <section
        id="sekcja-ceny-okolicy"
        className="mt-10 h-48 animate-pulse rounded-2xl bg-stone-100"
        aria-busy="true"
        aria-label="Ładowanie cen w okolicy"
      />
    );
  }

  if (stan === "blad" || !dane) return null;

  const maPaliwa =
    dane.najtansze.pb95.length > 0 ||
    dane.najtansze.on.length > 0 ||
    dane.najtansze.lpg.length > 0;
  const maOpal = dane.cenyOpal.length > 0;
  const maStatystyki = dane.statystyki?.pb95 != null || dane.statystyki?.on != null;

  if (!maPaliwa && !maOpal && !maStatystyki) return null;

  return (
    <LazyWidoczny>
      <OslonaSekcjiWies id="sekcja-ceny-okolicy" className="mt-10 scroll-mt-24">
        <TytulSekcjiWies
          tytul="Ceny w okolicy"
          opis="Paliwa na stacjach w pobliżu wsi oraz opał od mieszkańców"
        />

        <p className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
          {dane.disclaimer}
        </p>

        {maStatystyki && dane.statystyki ? (
          <div className={`${KARTA_LISTY_WIES} mb-6 p-4`}>
            <h3 className="font-semibold text-stone-900">Średnie ceny w Polsce</h3>
            <p className="mt-0.5 text-xs text-stone-500">
              Źródło: {dane.zrodloPaliw}
              {dane.statystyki.lastUpdated
                ? ` · aktualizacja ${new Date(dane.statystyki.lastUpdated).toLocaleDateString("pl-PL")}`
                : null}
            </p>
            <dl className="mt-3 grid gap-3 sm:grid-cols-3">
              {dane.statystyki.pb95 != null ? (
                <div className="rounded-xl bg-stone-50 px-3 py-2.5">
                  <dt className="text-xs text-stone-500">Benzyna 95</dt>
                  <dd className="font-serif text-2xl text-sky-950">{formatCena(dane.statystyki.pb95)}</dd>
                  {formatujTrend(dane.statystyki.trendPb95_7d) ? (
                    <dd className="text-[11px] text-stone-500">{formatujTrend(dane.statystyki.trendPb95_7d)}</dd>
                  ) : null}
                </div>
              ) : null}
              {dane.statystyki.on != null ? (
                <div className="rounded-xl bg-stone-50 px-3 py-2.5">
                  <dt className="text-xs text-stone-500">Diesel</dt>
                  <dd className="font-serif text-2xl text-sky-950">{formatCena(dane.statystyki.on)}</dd>
                  {formatujTrend(dane.statystyki.trendOn_7d) ? (
                    <dd className="text-[11px] text-stone-500">{formatujTrend(dane.statystyki.trendOn_7d)}</dd>
                  ) : null}
                </div>
              ) : null}
              {dane.statystyki.lpg != null ? (
                <div className="rounded-xl bg-stone-50 px-3 py-2.5">
                  <dt className="text-xs text-stone-500">LPG</dt>
                  <dd className="font-serif text-2xl text-sky-950">{formatCena(dane.statystyki.lpg)}</dd>
                  {formatujTrend(dane.statystyki.trendLpg_7d) ? (
                    <dd className="text-[11px] text-stone-500">{formatujTrend(dane.statystyki.trendLpg_7d)}</dd>
                  ) : null}
                </div>
              ) : null}
            </dl>
          </div>
        ) : null}

        {!dane.wies.maWspolrzedne ? (
          <p className="mb-4 text-sm text-stone-600">
            Brak współrzędnych wsi — nie można wyszukać najbliższych stacji. Sołtys może uzupełnić lokalizację w
            panelu.
          </p>
        ) : maPaliwa ? (
          <>
            <p className="mb-3 text-sm text-stone-600">
              W promieniu {dane.promienKm} km od wsi: {dane.stacjeWKola} stacji z cenami.
            </p>
            <div className="grid gap-4 lg:grid-cols-3">
              <BlokNajtanszych tytul="Najtańsza benzyna 95" stacje={dane.najtansze.pb95} pole="pb95" />
              <BlokNajtanszych tytul="Najtańszy diesel" stacje={dane.najtansze.on} pole="on" />
              <BlokNajtanszych tytul="Najtańszy LPG" stacje={dane.najtansze.lpg} pole="lpg" />
            </div>
          </>
        ) : (
          <p className="mb-4 text-sm text-stone-600">
            Brak danych o stacjach w okolicy — synchronizacja cen paliw trwa po wdrożeniu (cron co 4 h).
          </p>
        )}

        {maOpal ? (
          <div className={`${KARTA_LISTY_WIES} mt-6 p-4`}>
            <h3 className="font-semibold text-stone-900">Opał i pellet — zgłoszenia mieszkańców</h3>
            <ul className="mt-3 space-y-2">
              {dane.cenyOpal.map((c) => (
                <li key={c.id} className="text-sm text-stone-800">
                  <span className="font-medium">{c.product_label}</span>
                  {": "}
                  {c.price_value} {c.price_unit} @ {c.place_name}
                  <span className="text-stone-500">
                    {" "}
                    ({c.observed_at})
                    {c.zweryfikowane_spolecznie ? (
                      <span className="ml-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-900">
                        ✓ {c.confirmation_count} potwierdzeń
                      </span>
                    ) : (
                      <span className="ml-1 text-xs">({c.confirmation_count} potwierdzeń)</span>
                    )}
                  </span>
                  {c.notes ? <span className="block text-xs text-stone-500">{c.notes}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {zalogowany ? (
          <p className="mt-4 text-sm">
            <Link
              href="/panel/mieszkaniec/rolnictwo-ceny"
              className="font-medium text-green-800 underline hover:text-green-950"
            >
              Zgłoś cenę opału lub skupu →
            </Link>
          </p>
        ) : null}
      </OslonaSekcjiWies>
    </LazyWidoczny>
  );
}
