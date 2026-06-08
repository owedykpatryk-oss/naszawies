"use client";

import { useEffect, useRef, useState, useTransition } from "react";
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
  wies: {
    name: string;
    commune?: string;
    county: string;
    voivodeship: string;
    regionGus?: string;
    gmina_population?: number | null;
    gmina_population_rok?: number | null;
  };
  psrGminy: {
    liczba_gospodarstw: number | null;
    powierzchnia_ha: number | null;
    rok: number;
  } | null;
  cenyGusAktualne: CenaGusAktualna[];
  cenyTargAktualne?: CenaGusAktualna[];
  historiaGusSkup: PunktHistoriiGus[];
  historiaGusTarg: PunktHistoriiGus[];
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

function WykresSkupVsTarg({
  skup,
  targ,
  jednostka,
}: {
  skup: PunktHistoriiGus[];
  targ: PunktHistoriiGus[];
  jednostka: string;
}) {
  if (skup.length < 2 && targ.length < 2) return null;

  const etykiety = skup.length >= targ.length ? skup : targ;
  const mapaSkup = new Map(skup.map((p) => [`${p.year}-${p.month}`, p.value]));
  const mapaTarg = new Map(targ.map((p) => [`${p.year}-${p.month}`, p.value]));
  const wartosci = [
    ...skup.map((p) => p.value),
    ...targ.map((p) => p.value),
  ];
  const max = Math.max(...wartosci);
  const min = Math.min(...wartosci);
  const zakres = max - min || 1;

  return (
    <div className="mt-4" role="img" aria-label={`Wykres skup vs targ w ${jednostka}`}>
      <div className="mb-2 flex flex-wrap gap-3 text-xs text-stone-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-600" aria-hidden /> Skup (P2967)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" aria-hidden /> Targowisko (P2968)
        </span>
      </div>
      <div className="flex h-32 items-end gap-1 overflow-x-auto pb-1">
        {etykiety.map((p) => {
          const klucz = `${p.year}-${p.month}`;
          const vSkup = mapaSkup.get(klucz);
          const vTarg = mapaTarg.get(klucz);
          return (
            <div key={klucz} className="flex min-w-[2.25rem] flex-1 flex-col items-center gap-1">
              <div className="flex h-24 w-full items-end justify-center gap-0.5">
                {vSkup != null ? (
                  <div
                    className="w-[42%] rounded-t bg-emerald-600"
                    style={{ height: `${((vSkup - min) / zakres) * 72 + 12}px` }}
                    title={`Skup ${p.label}: ${vSkup} ${jednostka}`}
                  />
                ) : (
                  <div className="w-[42%]" />
                )}
                {vTarg != null ? (
                  <div
                    className="w-[42%] rounded-t bg-amber-500"
                    style={{ height: `${((vTarg - min) / zakres) * 72 + 12}px` }}
                    title={`Targ ${p.label}: ${vTarg} ${jednostka}`}
                  />
                ) : (
                  <div className="w-[42%]" />
                )}
              </div>
              <span className="max-w-full truncate text-[8px] text-stone-500 sm:text-[9px]">{p.label}</span>
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
  sciezkaWsi,
  naPodstroniePelnej = false,
}: {
  villageId: string;
  zalogowany: boolean;
  sciezkaWsi?: string;
  naPodstroniePelnej?: boolean;
}) {
  const [stan, setStan] = useState<"laduje" | "ok" | "blad">("laduje");
  const [dane, setDane] = useState<DaneRolnictwa | null>(null);
  const [produktWykres, setProduktWykres] = useState("pszenica");
  const [ladujeWykres, setLadujeWykres] = useState(false);
  const [, startTransition] = useTransition();
  const pierwszeLadowanie = useRef(true);

  useEffect(() => {
    let anuluj = false;
    if (pierwszeLadowanie.current) {
      setStan("laduje");
    } else {
      setLadujeWykres(true);
    }
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
        pierwszeLadowanie.current = false;
      } catch {
        if (!anuluj) setStan("blad");
      } finally {
        if (!anuluj) setLadujeWykres(false);
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

  const naglowek = naPodstroniePelnej ? (
    <div className="mb-6">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-lime-800">Dane i ceny</p>
      <h2 className="mt-1 font-serif text-2xl text-lime-950">Ceny skupu i miejsca odbioru</h2>
      <p className="mt-1 text-sm text-stone-600">Statystyki GUS, trendy oraz zgłoszenia sąsiedzkie.</p>
    </div>
  ) : (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <TytulSekcjiWies tytul="Rolnictwo w okolicy" opis="Ceny orientacyjne i miejsca odbioru" />
      {sciezkaWsi ? (
        <Link
          href={`${sciezkaWsi}/rolnictwo`}
          className="shrink-0 rounded-full border border-lime-600/30 bg-lime-50 px-4 py-2 text-sm font-medium text-lime-950 transition hover:bg-lime-100"
        >
          Pełny profil rolniczy →
        </Link>
      ) : null}
    </div>
  );

  return (
    <OslonaSekcjiWies
      id="sekcja-rolnictwo"
      className={naPodstroniePelnej ? "scroll-mt-24" : "mt-10 scroll-mt-24"}
    >
      {naglowek}

      <p className="mb-4 rounded-xl border border-amber-200/90 bg-gradient-to-r from-amber-50 to-amber-50/50 px-4 py-3 text-sm text-amber-950">
        {dane.disclaimer}
      </p>

      {dane.psrGminy &&
      (dane.psrGminy.liczba_gospodarstw != null || dane.psrGminy.powierzchnia_ha != null) ? (
        <div className={`${KARTA_LISTY_WIES} mb-6 border-lime-100/80 p-4`}>
          <h3 className="mb-2 font-semibold text-lime-950">
            Rolnictwo w gminie {dane.wies.commune ?? dane.wies.county}
          </h3>
          <p className="mb-3 text-xs text-stone-500">
            PSR {dane.psrGminy.rok} (GUS BDL) — dane dla całej gminy, spis rolny.
          </p>
          <dl className="grid gap-3 sm:grid-cols-2">
            {dane.psrGminy.liczba_gospodarstw != null ? (
              <div className="rounded-xl border border-lime-100 bg-lime-50/50 px-3 py-2.5">
                <dt className="text-xs text-lime-800/70">Gospodarstwa rolne</dt>
                <dd className="font-serif text-2xl text-lime-950">
                  {dane.psrGminy.liczba_gospodarstw.toLocaleString("pl-PL")}
                </dd>
              </div>
            ) : null}
            {dane.psrGminy.powierzchnia_ha != null ? (
              <div className="rounded-xl border border-lime-100 bg-lime-50/50 px-3 py-2.5">
                <dt className="text-xs text-lime-800/70">Powierzchnia użytków rolnych</dt>
                <dd className="font-serif text-2xl text-lime-950">
                  {dane.psrGminy.powierzchnia_ha.toLocaleString("pl-PL")}{" "}
                  <span className="text-base font-sans text-stone-600">ha</span>
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      ) : null}

      {dane.cenyGusAktualne.length > 0 ? (
        <div className={`${KARTA_LISTY_WIES} mb-6 border-lime-100/80 p-4`}>
          <h3 className="mb-3 font-semibold text-lime-950">
            Średnie ceny skupu — region {regionNazwa}
          </h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {dane.cenyGusAktualne.map((c) => (
              <li key={c.product_key} className="rounded-lg bg-lime-50/40 px-2 py-1.5 text-sm text-stone-700">
                <span className="font-medium text-lime-950">{c.product_label}</span>
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
              Trend 12 miesięcy — skup vs targ
            </p>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {PRODUKTY_ROLNE.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => startTransition(() => setProduktWykres(p.key))}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    produktWykres === p.key
                      ? "bg-lime-800 text-white"
                      : "bg-lime-100 text-lime-900 hover:bg-lime-200"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className={`relative ${ladujeWykres ? "opacity-40" : ""}`} aria-busy={ladujeWykres}>
              <WykresSkupVsTarg
                skup={dane.historiaGusSkup ?? dane.historiaGus}
                targ={dane.historiaGusTarg ?? []}
                jednostka={jednostkaWykres}
              />
              {ladujeWykres ? (
                <p className="absolute inset-0 flex items-center justify-center text-xs text-stone-500">
                  Ładowanie wykresu…
                </p>
              ) : null}
            </div>
            {(dane.cenyTargAktualne?.length ?? 0) > 0 ? (
              <p className="mt-3 text-xs text-stone-500">
                Targ (P2968):{" "}
                {dane.cenyTargAktualne
                  ?.filter((c) => c.product_key === produktWykres)
                  .map((c) => `${c.value} ${c.unit}`)
                  .join(" · ") || "brak dla wybranego produktu"}
              </p>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="mb-4 text-sm text-stone-600">
          Brak świeżych danych GUS dla powiatu — pojawią się po miesięcznej synchronizacji.
        </p>
      )}

      {dane.poisRolne.length > 0 && (
        <div className={`${KARTA_LISTY_WIES} mb-6 border-lime-100/80 p-4`}>
          <h3 className="mb-1 font-semibold text-lime-950">Skupy i sklepy rolnicze</h3>
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

      <div className={`${KARTA_LISTY_WIES} border-lime-100/80 p-4`}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-lime-950">Ceny od sąsiadów</h3>
          <div className="flex flex-wrap gap-3">
            {zalogowany && (
              <>
                <Link
                  href="/panel/mieszkaniec/rolnictwo-ceny"
                  className="text-sm font-medium text-lime-800 underline-offset-2 hover:underline"
                >
                  Zgłoś lub potwierdź cenę
                </Link>
                <Link
                  href="/panel/mieszkaniec/marketplace"
                  className="text-sm font-medium text-lime-800 underline-offset-2 hover:underline"
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
  sciezkaWsi,
  naPodstroniePelnej = false,
}: {
  villageId: string;
  zalogowany: boolean;
  sciezkaWsi?: string;
  naPodstroniePelnej?: boolean;
}) {
  return (
    <LazyWidoczny rootMargin="300px 0px" className="min-h-[12rem]">
      <TrescRolnictwa
        villageId={villageId}
        zalogowany={zalogowany}
        sciezkaWsi={sciezkaWsi}
        naPodstroniePelnej={naPodstroniePelnej}
      />
    </LazyWidoczny>
  );
}
