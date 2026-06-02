import type { ReactNode } from "react";
import Link from "next/link";
import { ObrazR2 } from "@/components/media/obraz-r2";
import { RynekPrzewagiPasek } from "@/components/wies/rynek-przewagi-pasek";
import {
  etykietaJednostkiCeny,
  etykietaKategoriiOgloszenia,
  etykietaTypuOgloszenia,
} from "@/lib/marketplace/kategorie-ogloszen";
import {
  czyKategoriaNieruchomosci,
  formatujAreDzialki,
  formatujPowierzchnieDzialki,
} from "@/lib/marketplace/nieruchomosci";
import { ikonaKategoriiRynek } from "@/lib/marketplace/ikony-kategorii-rynku";
import {
  czyOgloszenieNowe,
  czyOgloszenieOddam,
  czyOgloszeniePopularne,
} from "@/lib/marketplace/odznaki-ogloszenia";
import { obliczJakoscZOfertyPublicznej } from "@/lib/marketplace/jakosc-ogloszenia";
import { formatujLiczbeWyswietlen } from "@/lib/marketplace/formatuj-liczbe-wyswietlen";
import type { RynekOfertaPubliczna } from "@/components/wies/marketplace-lista-klient";
import type { ZaufanieSprzedawcy } from "@/lib/marketplace/zaufanie-sprzedawcy";

export function OdznakaJakosciKarty({ procent }: { procent: number }) {
  if (procent < 70) return null;
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-amber-100 to-yellow-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-950 shadow-sm">
      <span aria-hidden>✨</span>
      {procent >= 85 ? "Kompletne" : "Polecane"}
    </span>
  );
}

export function OdznakaZweryfikowany({ duza = false }: { duza?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full bg-emerald-100 font-semibold text-emerald-900 ${
        duza ? "px-2.5 py-0.5 text-xs" : "px-1.5 py-0.5 text-[10px]"
      }`}
      title="Ogłoszenie zatwierdzone przez sołtysa"
    >
      <span aria-hidden>✓</span> Sołtys poleca
    </span>
  );
}

export function OdznakaZnanyWWsi({ duza = false }: { duza?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full bg-sky-100 font-semibold text-sky-900 ${
        duza ? "px-2.5 py-0.5 text-xs" : "px-1.5 py-0.5 text-[10px]"
      }`}
      title="Sprzedawca ma co najmniej 3 zatwierdzone ogłoszenia we wsi"
    >
      <span aria-hidden>🏡</span> Znany w wsi
    </span>
  );
}

export function OdznakaAktywnySprzedawca() {
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-900"
      title="Sprzedawca ma 5 lub więcej ogłoszeń na rynku wsi"
    >
      <span aria-hidden>⭐</span> Aktywny
    </span>
  );
}

export function OdznakaNowosci({ duza = false }: { duza?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500 font-bold text-white shadow-sm ${
        duza ? "px-2 py-0.5 text-[10px] uppercase tracking-wide" : "px-1.5 py-0.5 text-[10px]"
      }`}
    >
      <span aria-hidden>✨</span> Nowe
    </span>
  );
}

export function OdznakaPopularne() {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
      <span aria-hidden>🔥</span> Popularne
    </span>
  );
}

export function OdznakaOddam() {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-lime-500 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
      <span aria-hidden>🎁</span> Oddam
    </span>
  );
}

export function PasekOdznakSprzedawcy({
  sellerVerified,
  znanyWWsi,
  aktywnySprzedawca,
  liczbaOgloszen,
  kompakt = false,
}: {
  sellerVerified?: boolean;
  znanyWWsi?: boolean;
  aktywnySprzedawca?: boolean;
  liczbaOgloszen?: number;
  /** Na siatce kart — max 2 odznaki widoczne. */
  kompakt?: boolean;
}) {
  if (!sellerVerified && !znanyWWsi && !aktywnySprzedawca && !(liczbaOgloszen && liczbaOgloszen >= 2)) {
    return null;
  }

  const odznaki: ReactNode[] = [];
  if (sellerVerified) odznaki.push(<OdznakaZweryfikowany key="v" />);
  if (znanyWWsi) odznaki.push(<OdznakaZnanyWWsi key="z" />);
  if (aktywnySprzedawca) odznaki.push(<OdznakaAktywnySprzedawca key="a" />);
  if (liczbaOgloszen != null && liczbaOgloszen >= 2 && !aktywnySprzedawca) {
    odznaki.push(
      <span key="n" className="rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-700">
        {liczbaOgloszen} ogłoszeń
      </span>,
    );
  }

  const widoczne = kompakt ? odznaki.slice(0, 2) : odznaki;
  const ukryte = kompakt ? Math.max(0, odznaki.length - 2) : 0;

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {widoczne}
      {ukryte > 0 ? (
        <span
          className="rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-stone-600"
          title="Więcej odznak zaufania sprzedawcy"
        >
          +{ukryte}
        </span>
      ) : null}
    </span>
  );
}

export function RynekBannerSezonowy({ tekst }: { tekst: string }) {
  return (
    <div
      className="mb-6 flex gap-3 rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-100/90 via-yellow-50 to-orange-50 px-4 py-3.5 shadow-sm"
      role="status"
    >
      <span className="text-xl leading-none" aria-hidden>
        🌾
      </span>
      <p className="text-sm font-medium leading-snug text-amber-950">{tekst}</p>
    </div>
  );
}

export function FormatujCeneOgloszenia({
  kwota,
  jednostka,
  waluta = "PLN",
  className = "",
}: {
  kwota: number | null;
  jednostka?: string | null;
  waluta?: string | null;
  className?: string;
}) {
  if (kwota == null) {
    return <span className={className}>Cena do ustalenia</span>;
  }
  return (
    <span className={className}>
      {kwota} {waluta ?? "PLN"}
      {jednostka ? ` ${etykietaJednostkiCeny(jednostka)}` : ""}
    </span>
  );
}

export function MiniaturaOgloszenia({
  url,
  kategoria,
  rozmiar = "sredni",
  className = "",
}: {
  url?: string | null;
  kategoria?: string | null;
  rozmiar?: "maly" | "sredni" | "duzy";
  className?: string;
}) {
  const rozmiary = {
    maly: "h-16 w-16",
    sredni: "h-20 w-20 sm:h-24 sm:w-24",
    duzy: "h-40 w-full sm:h-48",
  };
  const klasa = `${rozmiary[rozmiar]} ${className}`;
  const ikona = ikonaKategoriiRynek(kategoria);

  if (url) {
    return (
      <ObrazR2
        src={url}
        preset={rozmiar === "maly" ? "miniatura" : rozmiar === "duzy" ? "pelny" : "karta"}
        alt=""
        className={`shrink-0 rounded-xl object-cover ${klasa}`}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 flex-col items-center justify-center rounded-xl border border-orange-200/60 bg-gradient-to-br text-center ${ikona.gradient} ${klasa}`}
      aria-hidden
    >
      <span className={`${rozmiar === "maly" ? "text-xl" : rozmiar === "duzy" ? "text-4xl" : "text-2xl"}`}>
        {ikona.emoji}
      </span>
    </div>
  );
}

export function KartaOgloszeniaRynek({
  oferta,
  href,
  uklad = "lista",
  hrefMapy,
}: {
  oferta: RynekOfertaPubliczna & ZaufanieSprzedawcy;
  href: string;
  uklad?: "lista" | "siatka";
  /** Kotwica na mapę rynku wsi (np. #rynek-mapa) — tylko przy działce z Geoportalem. */
  hrefMapy?: string;
}) {
  const kat = oferta.equipment_category ?? oferta.category;
  const mini = oferta.image_urls?.[0];
  const data = new Date(oferta.published_at ?? oferta.created_at).toLocaleDateString("pl-PL");
  const nieruchomosc = czyKategoriaNieruchomosci(kat);
  const powierzchnia = formatujPowierzchnieDzialki(oferta.parcel_area_m2);
  const are = formatujAreDzialki(oferta.parcel_area_m2);
  const maMape = Boolean(oferta.geoportal_parcel_id);
  const jakosc = obliczJakoscZOfertyPublicznej(oferta);
  const liczbaZdjec = oferta.image_urls?.length ?? 0;
  const katEtykieta = kat ? etykietaKategoriiOgloszenia(kat) : null;
  const ikonaKat = ikonaKategoriiRynek(kat);
  const nowe = czyOgloszenieNowe(oferta.published_at, oferta.created_at);
  const popularne = czyOgloszeniePopularne(oferta.view_count);
  const oddam = czyOgloszenieOddam(oferta.listing_type, oferta.price_amount);
  const linkMapy =
    maMape && hrefMapy ? (
      <a
        href={hrefMapy}
        className="block border-t border-amber-100/80 bg-amber-50/50 px-3 py-2 text-center text-[11px] font-semibold text-amber-950 transition hover:bg-amber-100/80"
      >
        📐 Zobacz działkę na mapie wsi
      </a>
    ) : null;

  if (uklad === "siatka") {
    return (
      <div className="rynek-karta-wow flex h-full flex-col overflow-hidden">
        <Link href={href} className="group flex flex-1 flex-col">
        <div className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-br ${ikonaKat.gradient}`}>
          {mini ? (
            <ObrazR2
              src={mini}
              preset="karta"
              alt=""
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2">
              <span className="text-5xl drop-shadow-sm transition duration-500 group-hover:scale-110" aria-hidden>
                {ikonaKat.emoji}
              </span>
              {katEtykieta ? (
                <span className="rounded-full bg-white/70 px-2.5 py-0.5 text-[11px] font-semibold text-stone-700 backdrop-blur-sm">
                  {katEtykieta}
                </span>
              ) : null}
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
          <p className="absolute bottom-2.5 left-2.5 rounded-xl bg-white/95 px-2.5 py-1 text-sm font-bold text-green-900 shadow-md backdrop-blur-sm">
            <FormatujCeneOgloszenia kwota={oferta.price_amount} jednostka={oferta.price_unit} waluta={oferta.currency} />
          </p>
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {oddam ? <OdznakaOddam /> : null}
            {!oddam && oferta.seller_verified ? <OdznakaZweryfikowany /> : null}
            {!oddam && !oferta.seller_verified && jakosc >= 70 ? <OdznakaJakosciKarty procent={jakosc} /> : null}
          </div>
          <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
            {nowe ? <OdznakaNowosci /> : null}
            {popularne ? <OdznakaPopularne /> : null}
            {nieruchomosc ? (
              <span className="rounded-full bg-amber-400/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950 shadow-sm">
                {maMape ? "Działka · mapa" : "Nieruchomość"}
              </span>
            ) : null}
          </div>
          {liczbaZdjec > 1 ? (
            <span className="absolute right-2 bottom-10 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
              📷 {liczbaZdjec}
            </span>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col p-3.5 sm:p-4">
          <p className="line-clamp-2 font-semibold leading-snug text-stone-900 group-hover:text-green-950">{oferta.title}</p>
          <p className="mt-1">
            <PasekOdznakSprzedawcy
              sellerVerified={oferta.seller_verified ?? false}
              znanyWWsi={oferta.znanyWWsi}
              aktywnySprzedawca={oferta.aktywnySprzedawca}
              liczbaOgloszen={oferta.liczbaOgloszenSprzedawcy}
              kompakt
            />
          </p>
          <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-stone-600">
            <span className="rounded-md bg-stone-100 px-1.5 py-0.5 font-medium text-stone-700">
              {etykietaTypuOgloszenia(oferta.listing_type)}
            </span>
            {katEtykieta ? (
              <span className="line-clamp-1 rounded-md bg-orange-50 px-1.5 py-0.5 font-medium text-orange-900">
                {katEtykieta}
              </span>
            ) : null}
            {oferta.with_operator ? (
              <span className="rounded-md bg-sky-50 px-1.5 py-0.5 font-medium text-sky-900">z operatorem</span>
            ) : null}
          </p>
          {powierzchnia ? (
            <p className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-amber-900">
              <span aria-hidden>📐</span>
              {powierzchnia}
              {are ? ` (${are})` : ""}
            </p>
          ) : null}
          <p className="mt-auto pt-2.5 text-[11px] text-stone-500">
            {oferta.location_text ? `${oferta.location_text} · ` : ""}
            {data}
            {formatujLiczbeWyswietlen(oferta.view_count ?? 0) ? (
              <> · 👁 {formatujLiczbeWyswietlen(oferta.view_count ?? 0)}</>
            ) : null}
          </p>
        </div>
        </Link>
        {linkMapy}
      </div>
    );
  }

  return (
    <div className="karta-wow overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-sm">
      <Link href={href} className="group flex gap-3 p-3 sm:gap-4 sm:p-4">
      <MiniaturaOgloszenia url={mini} kategoria={kat} rozmiar="sredni" />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-stone-900 group-hover:text-green-950">
          {oferta.title}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-1">
          {oddam ? <OdznakaOddam /> : null}
          {nowe ? <OdznakaNowosci /> : null}
          {popularne ? <OdznakaPopularne /> : null}
          <PasekOdznakSprzedawcy
            sellerVerified={oferta.seller_verified ?? false}
            znanyWWsi={oferta.znanyWWsi}
            aktywnySprzedawca={oferta.aktywnySprzedawca}
            liczbaOgloszen={oferta.liczbaOgloszenSprzedawcy}
          />
        </p>
        <p className="mt-1 flex flex-wrap gap-1 text-xs">
          <span className="rounded bg-stone-100 px-1.5 py-0.5 text-stone-700">
            {etykietaTypuOgloszenia(oferta.listing_type)}
          </span>
          {katEtykieta ? (
            <span className="rounded bg-orange-50 px-1.5 py-0.5 text-orange-900">{katEtykieta}</span>
          ) : null}
          {oferta.with_operator ? (
            <span className="rounded bg-sky-50 px-1.5 py-0.5 text-sky-900">z operatorem</span>
          ) : null}
          {!oferta.seller_verified && jakosc >= 70 ? (
            <span className="inline-block align-middle">
              <OdznakaJakosciKarty procent={jakosc} />
            </span>
          ) : null}
          {liczbaZdjec > 0 ? (
            <span className="rounded bg-sky-50 px-1.5 py-0.5 text-sky-900">📷 {liczbaZdjec}</span>
          ) : null}
        </p>
        {powierzchnia ? (
          <p className="mt-1 text-xs font-medium text-amber-900">
            {powierzchnia}
            {oferta.parcel_number ? ` · dz. ${oferta.parcel_number}` : ""}
          </p>
        ) : null}
        <p className="mt-1.5 text-sm font-semibold text-green-900">
          <FormatujCeneOgloszenia kwota={oferta.price_amount} jednostka={oferta.price_unit} waluta={oferta.currency} />
        </p>
        <p className="mt-0.5 text-xs text-stone-500">
          {oferta.location_text ? `${oferta.location_text} · ` : ""}
          {data}
          {formatujLiczbeWyswietlen(oferta.view_count ?? 0) ? (
            <> · 👁 {formatujLiczbeWyswietlen(oferta.view_count ?? 0)}</>
          ) : null}
        </p>
      </div>
      </Link>
      {linkMapy}
    </div>
  );
}

export function OkruszkiRynku({
  sciezkaWsi,
  nazwaWsi,
  biezacy,
}: {
  sciezkaWsi: string;
  nazwaWsi: string;
  biezacy?: string;
}) {
  return (
    <nav aria-label="Nawigacja" className="mb-5 flex flex-wrap items-center gap-1.5 text-sm">
      <Link
        href={sciezkaWsi}
        className="rounded-full border border-stone-200/90 bg-white/80 px-2.5 py-1 text-stone-600 shadow-sm transition hover:border-green-300 hover:text-green-900"
      >
        ← {nazwaWsi}
      </Link>
      <span aria-hidden className="text-stone-300">
        /
      </span>
      <Link
        href={`${sciezkaWsi}/rynek`}
        className={`rounded-full px-2.5 py-1 transition ${
          biezacy
            ? "border border-stone-200/90 bg-white/80 text-green-800 shadow-sm hover:border-green-300"
            : "bg-orange-100/80 font-semibold text-orange-950"
        }`}
      >
        Rynek lokalny
      </Link>
      {biezacy ? (
        <>
          <span aria-hidden className="text-stone-300">
            /
          </span>
          <span className="max-w-[min(100%,280px)] truncate rounded-full bg-stone-100 px-2.5 py-1 font-medium text-stone-800">
            {biezacy}
          </span>
        </>
      ) : null}
    </nav>
  );
}

export function NaglowekStronyRynku({
  tytul,
  opis,
  liczbaOgloszen,
  liczbaProfili,
  etykietaProfili = "Firmy i sklepy",
}: {
  tytul: string;
  opis: string;
  liczbaOgloszen?: number;
  liczbaProfili?: number;
  /** Etykieta drugiej statystyki — na hubie „Wsi z rynkiem”, na stronie wsi „Firmy i sklepy”. */
  etykietaProfili?: string;
}) {
  return (
    <header className="rynek-hero-wow relative">
      <div className="relative z-[1]">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-orange-200/60 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-orange-950">
          <span aria-hidden>🏷️</span>
          Darmowy rynek lokalny
        </p>
        <h1 className="mt-2 font-serif text-2xl text-green-950 sm:text-3xl lg:text-[2rem]">{tytul}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-700 sm:text-[15px]">{opis}</p>
        {liczbaOgloszen != null || liczbaProfili != null ? (
          <dl className="mt-5 flex flex-wrap gap-3">
            {liczbaOgloszen != null ? (
              <div className="rounded-xl border border-white/80 bg-white/70 px-4 py-2.5 shadow-sm backdrop-blur-sm">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Ogłoszenia</dt>
                <dd className="mt-0.5 text-xl font-bold tabular-nums text-green-950">{liczbaOgloszen}</dd>
              </div>
            ) : null}
            {liczbaProfili != null && liczbaProfili > 0 ? (
              <div className="rounded-xl border border-white/80 bg-white/70 px-4 py-2.5 shadow-sm backdrop-blur-sm">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-stone-500">{etykietaProfili}</dt>
                <dd className="mt-0.5 text-xl font-bold tabular-nums text-green-950">{liczbaProfili}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}
        <RynekPrzewagiPasek kompakt />
      </div>
    </header>
  );
}

export function BlokInfoRynku({
  tytul,
  ikona,
  children,
}: {
  tytul: string;
  ikona?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-orange-100 bg-orange-50/30 p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-orange-950">
        {ikona ? <span aria-hidden>{ikona}</span> : null}
        {tytul}
      </h3>
      <div className="mt-2 text-sm leading-relaxed text-stone-700">{children}</div>
    </div>
  );
}

export function PasekAkcjiRynku({
  sciezkaWsi,
  kotwicaZasadSwietlicy,
  pokazLinkWszystkie,
  liczbaOgloszen,
  villageId,
  kotwicaMapyRynek,
}: {
  sciezkaWsi: string;
  kotwicaZasadSwietlicy?: string;
  pokazLinkWszystkie: boolean;
  liczbaOgloszen: number;
  villageId?: string;
  kotwicaMapyRynek?: string;
}) {
  const linkMapa = villageId ? `/mapa?wies=${encodeURIComponent(villageId)}` : null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-stone-200/80 bg-gradient-to-r from-white via-orange-50/20 to-white p-2.5 text-sm shadow-sm">
      {kotwicaMapyRynek ? (
        <a
          href={kotwicaMapyRynek}
          className="rounded-xl border border-amber-300/70 bg-amber-50/90 px-3.5 py-2 font-semibold text-amber-950 shadow-sm transition hover:border-amber-400 hover:bg-amber-100"
        >
          📐 Mapa działek
        </a>
      ) : null}
      {linkMapa ? (
        <Link
          href={linkMapa}
          className="rounded-xl border border-sky-300/60 bg-sky-50/80 px-3.5 py-2 font-semibold text-sky-950 shadow-sm transition hover:border-sky-400 hover:bg-sky-100"
        >
          🗺️ Pokaż na mapie
        </Link>
      ) : null}
      {pokazLinkWszystkie && liczbaOgloszen >= 8 ? (
        <Link
          href={`${sciezkaWsi}/rynek`}
          className="rounded-xl bg-gradient-to-br from-green-800 to-green-900 px-3.5 py-2 font-semibold text-white shadow-sm transition hover:from-green-900 hover:to-green-950"
        >
          Wszystkie ogłoszenia ({liczbaOgloszen})
        </Link>
      ) : null}
      <Link
        href="/panel/mieszkaniec/marketplace"
        className="rounded-xl border border-green-800/40 bg-white px-3.5 py-2 font-semibold text-green-900 shadow-sm transition hover:border-green-700 hover:bg-green-50"
      >
        + Dodaj ogłoszenie
      </Link>
      <Link
        href="/panel/czat"
        className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-stone-700 shadow-sm transition hover:bg-stone-50"
      >
        Wiadomości
      </Link>
      {kotwicaZasadSwietlicy ? (
        <Link href={kotwicaZasadSwietlicy} className="rounded-lg px-2 py-2 text-xs text-stone-500 underline hover:text-stone-800">
          Zasady świetlicy
        </Link>
      ) : null}
    </div>
  );
}
