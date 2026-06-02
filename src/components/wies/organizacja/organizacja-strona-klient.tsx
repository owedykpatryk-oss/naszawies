"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { MotywOrganizacji } from "@/lib/wies/motyw-organizacji-publicznej";
import type { HeroMapaOrganizacji } from "@/lib/wies/poi-organizacji-hero";
import { RynekUdostepnijPrzycisk } from "@/components/wies/rynek-udostepnij-przycisk";
import { OrganizacjaMiniMapaLeniwa } from "@/components/wies/organizacja/organizacja-mini-mapa-leniwa";
import "@/components/wies/organizacja/organizacja-strona.css";

const OrganizacjaMiniMapaRewiruKlient = dynamic(
  () =>
    import("@/components/wies/organizacja/organizacja-mini-mapa-rewiru-klient").then(
      (m) => m.OrganizacjaMiniMapaRewiruKlient,
    ),
  { ssr: false, loading: () => <div className="organizacja-hero-mapa-szkielet h-40 animate-pulse rounded-xl bg-stone-100" /> },
);

const OrganizacjaMiniMapaPunktKlient = dynamic(
  () =>
    import("@/components/wies/organizacja/organizacja-mini-mapa-punkt-klient").then(
      (m) => m.OrganizacjaMiniMapaPunktKlient,
    ),
  { ssr: false, loading: () => <div className="organizacja-hero-mapa-szkielet h-40 animate-pulse rounded-xl bg-stone-100" /> },
);

export type ZakladkaOrganizacji = "start" | "o-nas" | "kalendarz" | "kontakt" | "mieszkancy";

const ZAKLADKI_BAZOWE: { id: Exclude<ZakladkaOrganizacji, "mieszkancy">; label: string }[] = [
  { id: "start", label: "Start" },
  { id: "o-nas", label: "O nas" },
  { id: "kalendarz", label: "Kalendarz" },
  { id: "kontakt", label: "Kontakt" },
];

type Props = {
  motyw: MotywOrganizacji;
  nazwa: string;
  podtytul: string | null;
  opisKrotki: string | null;
  haslo?: string | null;
  okladkaUrl?: string | null;
  sciezkaWsi: string;
  nazwaWsi: string;
  urlStrony: string;
  statystyki: { etykieta: string; wartosc: string }[];
  telefon: string | null;
  email: string | null;
  pokazZakladkeMieszkancow?: boolean;
  rewirGeojson?: unknown;
  linkMapyLowiectwa?: string | null;
  heroMapaPunkt?: HeroMapaOrganizacji | null;
  zakladkaStart: React.ReactNode;
  zakladkaONas: React.ReactNode;
  zakladkaKalendarz: React.ReactNode;
  zakladkaKontakt: React.ReactNode;
  zakladkaMieszkancow?: React.ReactNode;
};

export function OrganizacjaStronaKlient({
  motyw,
  nazwa,
  podtytul,
  opisKrotki,
  haslo,
  okladkaUrl,
  sciezkaWsi,
  nazwaWsi,
  urlStrony,
  statystyki,
  telefon,
  email,
  pokazZakladkeMieszkancow = false,
  rewirGeojson,
  linkMapyLowiectwa = "/mapa?warstwa=lowiectwo",
  heroMapaPunkt = null,
  zakladkaStart,
  zakladkaONas,
  zakladkaKalendarz,
  zakladkaKontakt,
  zakladkaMieszkancow,
}: Props) {
  const zakladki = useMemo((): { id: ZakladkaOrganizacji; label: string }[] => {
    if (!pokazZakladkeMieszkancow) return [...ZAKLADKI_BAZOWE];
    return [
      ZAKLADKI_BAZOWE[0]!,
      ZAKLADKI_BAZOWE[1]!,
      ZAKLADKI_BAZOWE[2]!,
      { id: "mieszkancy", label: "Dla mieszkańców" },
      ZAKLADKI_BAZOWE[3]!,
    ];
  }, [pokazZakladkeMieszkancow]);

  const [aktywna, ustawAktywna] = useState<ZakladkaOrganizacji>("start");

  const syncHash = useCallback(() => {
    const h = window.location.hash.replace("#", "") as ZakladkaOrganizacji;
    if (zakladki.some((z) => z.id === h)) ustawAktywna(h);
  }, [zakladki]);

  useEffect(() => {
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [syncHash]);

  function wybierzZakladke(id: ZakladkaOrganizacji) {
    ustawAktywna(id);
    history.replaceState(null, "", `#${id}`);
  }

  const tresc =
    aktywna === "start"
      ? zakladkaStart
      : aktywna === "o-nas"
        ? zakladkaONas
        : aktywna === "kalendarz"
          ? zakladkaKalendarz
          : aktywna === "mieszkancy"
            ? zakladkaMieszkancow
            : zakladkaKontakt;

  const maHeroMape = Boolean(rewirGeojson || heroMapaPunkt);

  return (
    <div className={`organizacja-strona organizacja-strona--${motyw.segment} min-w-0`}>
      <nav className="organizacja-breadcrumb mb-4" aria-label="Nawigacja">
        <Link href={sciezkaWsi} className="organizacja-breadcrumb__link">
          {nazwaWsi}
        </Link>
        <span className="organizacja-breadcrumb__sep" aria-hidden>
          /
        </span>
        <span className="organizacja-breadcrumb__chip">{motyw.etykietaTypu}</span>
      </nav>

      <header
        className={`organizacja-hero relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 shadow-lg sm:p-8 ${motyw.heroGradient} ${motyw.heroBorder} ${okladkaUrl ? "organizacja-hero--okladka" : "organizacja-hero--gradient"}`}
      >
        <div className="organizacja-hero__ambient pointer-events-none absolute inset-0" aria-hidden />
        {okladkaUrl ? (
          <>
            <div
              className="organizacja-hero__okladka absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${okladkaUrl})` }}
              aria-hidden
            />
            <div className="organizacja-hero__overlay absolute inset-0" aria-hidden />
          </>
        ) : (
          <>
            <div className="organizacja-hero__shine pointer-events-none absolute inset-0" aria-hidden />
            <span className="organizacja-hero__watermark pointer-events-none absolute select-none" aria-hidden>
              {motyw.ikona}
            </span>
          </>
        )}
        <div className={`relative ${maHeroMape ? "lg:grid lg:grid-cols-[1fr,min(38%,17rem)] lg:items-start lg:gap-6" : ""}`}>
          <div className="min-w-0">
          <p className={`text-xs font-bold uppercase tracking-wider ${motyw.heroSubtext}`}>
            <span aria-hidden className="mr-1">
              {motyw.ikona}
            </span>
            {motyw.etykietaTypu}
          </p>
          <h1 className={`mt-2 font-serif text-3xl sm:text-4xl ${motyw.heroText}`}>{nazwa}</h1>
          {haslo ? <p className={`mt-2 text-base italic ${motyw.heroSubtext}`}>&ldquo;{haslo}&rdquo;</p> : null}
          {podtytul ? <p className={`mt-2 text-sm ${motyw.heroSubtext}`}>{podtytul}</p> : null}
          {opisKrotki ? (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-700">{opisKrotki}</p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            {telefon ? (
              <a
                href={`tel:${telefon.replace(/\s/g, "")}`}
                className={`rounded-lg px-4 py-2 text-sm font-semibold shadow-sm ${motyw.przyciskPrimary}`}
              >
                Zadzwoń
              </a>
            ) : null}
            {email ? (
              <a
                href={`mailto:${email}`}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold shadow-sm ${motyw.przyciskSecondary}`}
              >
                E-mail
              </a>
            ) : null}
            <RynekUdostepnijPrzycisk url={urlStrony} tytul={nazwa} tekst={`${motyw.etykietaTypu}: ${nazwa}`} />
          </div>

          {statystyki.length > 0 ? (
            <ul className="mt-5 flex flex-wrap gap-2">
              {statystyki.map((s) => (
                <li
                  key={s.etykieta}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm ${motyw.pill}`}
                >
                  <span className="opacity-75">{s.etykieta}:</span> {s.wartosc}
                </li>
              ))}
            </ul>
          ) : null}
          </div>

          {rewirGeojson ? (
            <div className="relative z-[1] mt-5 lg:mt-0">
              <OrganizacjaMiniMapaLeniwa etykieta="Ładowanie rewiru na mapie…">
                <OrganizacjaMiniMapaRewiruKlient
                  rewirGeojson={rewirGeojson}
                  linkPelnaMapa={linkMapyLowiectwa}
                />
              </OrganizacjaMiniMapaLeniwa>
            </div>
          ) : heroMapaPunkt ? (
            <div className="relative z-[1] mt-5 lg:mt-0">
              <OrganizacjaMiniMapaLeniwa etykieta="Ładowanie lokalizacji na mapie…">
                <OrganizacjaMiniMapaPunktKlient {...heroMapaPunkt} />
              </OrganizacjaMiniMapaLeniwa>
            </div>
          ) : null}
        </div>
      </header>

      <div className="organizacja-skroty mt-4">
        {zakladki.map((z) => (
          <button key={`skrot-${z.id}`} type="button" onClick={() => wybierzZakladke(z.id)}>
            {z.label}
          </button>
        ))}
      </div>

      <div className="organizacja-zakladki-sticky">
        <nav className="organizacja-zakladki" aria-label="Sekcje organizacji">
          {zakladki.map((z) => (
            <button
              key={z.id}
              type="button"
              onClick={() => wybierzZakladke(z.id)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                aktywna === z.id ? motyw.tabAktywna : motyw.tabNieaktywna
              }`}
              aria-current={aktywna === z.id ? "page" : undefined}
            >
              {z.label}
            </button>
          ))}
        </nav>
      </div>

      <div key={aktywna} className="organizacja-tresc mt-6 min-w-0">{tresc}</div>
    </div>
  );
}
