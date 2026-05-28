import type { ReactNode } from "react";
import Link from "next/link";
import {
  etykietaJednostkiCeny,
  etykietaKategoriiOgloszenia,
  etykietaTypuOgloszenia,
} from "@/lib/marketplace/kategorie-ogloszen";
import type { RynekOfertaPubliczna } from "@/components/wies/marketplace-lista-klient";

export function OdznakaZweryfikowany({ duza = false }: { duza?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full bg-emerald-100 font-semibold text-emerald-900 ${
        duza ? "px-2.5 py-0.5 text-xs" : "px-1.5 py-0.5 text-[10px]"
      }`}
    >
      <span aria-hidden>✓</span> Zweryfikowany
    </span>
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
  rozmiar = "sredni",
  className = "",
}: {
  url?: string | null;
  rozmiar?: "maly" | "sredni" | "duzy";
  className?: string;
}) {
  const rozmiary = {
    maly: "h-16 w-16",
    sredni: "h-20 w-20 sm:h-24 sm:w-24",
    duzy: "h-40 w-full sm:h-48",
  };
  const klasa = `${rozmiary[rozmiar]} ${className}`;

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="" className={`shrink-0 rounded-xl object-cover ${klasa}`} />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl border border-dashed border-orange-200/80 bg-gradient-to-br from-orange-50 to-stone-50 text-center ${klasa}`}
      aria-hidden
    >
      <span className="px-1 text-[10px] font-medium leading-tight text-stone-400">Brak zdjęcia</span>
    </div>
  );
}

export function KartaOgloszeniaRynek({
  oferta,
  href,
  uklad = "lista",
}: {
  oferta: RynekOfertaPubliczna;
  href: string;
  uklad?: "lista" | "siatka";
}) {
  const kat = oferta.equipment_category ?? oferta.category;
  const mini = oferta.image_urls?.[0];
  const data = new Date(oferta.published_at ?? oferta.created_at).toLocaleDateString("pl-PL");

  if (uklad === "siatka") {
    return (
      <Link
        href={href}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-orange-200/70 bg-white shadow-sm transition hover:border-orange-400 hover:shadow-md"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
          {mini ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mini}
              alt=""
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50/50 text-xs text-stone-400">
              Brak zdjęcia
            </div>
          )}
          {oferta.seller_verified ? (
            <span className="absolute left-2 top-2">
              <OdznakaZweryfikowany />
            </span>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col p-3.5">
          <p className="line-clamp-2 font-medium leading-snug text-stone-900">{oferta.title}</p>
          <p className="mt-1.5 text-xs text-stone-600">
            {etykietaTypuOgloszenia(oferta.listing_type)}
            {kat ? ` · ${etykietaKategoriiOgloszenia(kat)}` : ""}
          </p>
          <p className="mt-auto pt-2 text-sm font-semibold text-green-900">
            <FormatujCeneOgloszenia kwota={oferta.price_amount} jednostka={oferta.price_unit} waluta={oferta.currency} />
          </p>
          <p className="mt-0.5 text-[11px] text-stone-500">
            {oferta.location_text ? `${oferta.location_text} · ` : ""}
            {data}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="group flex gap-3 rounded-2xl border border-stone-200/90 bg-white p-3 shadow-sm transition hover:border-orange-300 hover:shadow-md sm:gap-4 sm:p-4"
    >
      <MiniaturaOgloszenia url={mini} rozmiar="sredni" />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-stone-900 group-hover:text-green-950">
          {oferta.title}
          {oferta.seller_verified ? (
            <span className="ml-1.5 inline-block align-middle">
              <OdznakaZweryfikowany />
            </span>
          ) : null}
        </p>
        <p className="mt-1 text-xs text-stone-600">
          {etykietaTypuOgloszenia(oferta.listing_type)}
          {kat ? ` · ${etykietaKategoriiOgloszenia(kat)}` : ""}
          {oferta.with_operator ? " · z operatorem" : ""}
        </p>
        <p className="mt-1.5 text-sm font-semibold text-green-900">
          <FormatujCeneOgloszenia kwota={oferta.price_amount} jednostka={oferta.price_unit} waluta={oferta.currency} />
        </p>
        <p className="mt-0.5 text-xs text-stone-500">
          {oferta.location_text ? `${oferta.location_text} · ` : ""}
          {data}
        </p>
      </div>
    </Link>
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
    <nav aria-label="Nawigacja" className="mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-stone-600">
      <Link href={sciezkaWsi} className="text-green-800 underline hover:text-green-950">
        ← {nazwaWsi}
      </Link>
      <span aria-hidden className="text-stone-400">
        /
      </span>
      <Link href={`${sciezkaWsi}/rynek`} className={biezacy ? "text-green-800 underline hover:text-green-950" : "font-medium text-stone-800"}>
        Rynek lokalny
      </Link>
      {biezacy ? (
        <>
          <span aria-hidden className="text-stone-400">
            /
          </span>
          <span className="font-medium text-stone-800">{biezacy}</span>
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
}: {
  tytul: string;
  opis: string;
  liczbaOgloszen?: number;
  liczbaProfili?: number;
}) {
  return (
    <header className="rounded-2xl border border-orange-200/80 bg-gradient-to-br from-orange-50/90 via-amber-50/40 to-white p-5 shadow-sm sm:p-6">
      <p className="text-xs font-bold uppercase tracking-wider text-orange-900">Darmowy rynek lokalny</p>
      <h1 className="mt-1 font-serif text-2xl text-green-950 sm:text-3xl">{tytul}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-700">{opis}</p>
      {liczbaOgloszen != null || liczbaProfili != null ? (
        <dl className="mt-4 flex flex-wrap gap-4 text-sm">
          {liczbaOgloszen != null ? (
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone-500">Ogłoszenia</dt>
              <dd className="font-semibold text-stone-900">{liczbaOgloszen}</dd>
            </div>
          ) : null}
          {liczbaProfili != null && liczbaProfili > 0 ? (
            <div>
              <dt className="text-xs uppercase tracking-wide text-stone-500">Profile usług</dt>
              <dd className="font-semibold text-stone-900">{liczbaProfili}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
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
}: {
  sciezkaWsi: string;
  kotwicaZasadSwietlicy?: string;
  pokazLinkWszystkie: boolean;
  liczbaOgloszen: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-stone-200 bg-white p-2.5 text-sm">
      {pokazLinkWszystkie && liczbaOgloszen >= 8 ? (
        <Link
          href={`${sciezkaWsi}/rynek`}
          className="rounded-lg bg-green-800 px-3 py-2 font-medium text-white hover:bg-green-900"
        >
          Wszystkie ogłoszenia ({liczbaOgloszen})
        </Link>
      ) : null}
      <Link
        href="/panel/mieszkaniec/marketplace"
        className="rounded-lg border border-green-800 px-3 py-2 font-medium text-green-900 hover:bg-green-50"
      >
        Dodaj ogłoszenie
      </Link>
      <Link href="/panel/czat" className="rounded-lg border border-stone-300 px-3 py-2 text-stone-700 hover:bg-stone-50">
        Wiadomości
      </Link>
      {kotwicaZasadSwietlicy ? (
        <Link href={kotwicaZasadSwietlicy} className="rounded-lg px-2 py-2 text-xs text-stone-600 underline hover:text-stone-900">
          Zasady świetlicy
        </Link>
      ) : null}
    </div>
  );
}
