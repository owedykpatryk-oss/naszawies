"use client";

import Link from "next/link";
import { OslonaSekcjiWies } from "@/components/wies/oslona-sekcji-wies";
import { UjawnijPoPrzewinieciu } from "@/components/ui/ujawnij-po-przewinieciu";
import { LicznikAnimowany } from "@/components/ui/licznik-animowany";

export type PodgladHistoriiCentrum = {
  id: string;
  title: string;
  eraLabel: string | null;
  mediaUrl: string | null;
  href: string;
};

export type PodgladZdjeciaCentrum = {
  id: string;
  url: string;
  caption: string | null;
};

type Props = {
  sciezkaProfilu: string;
  nazwaWsi: string;
  liczbaHistorii: number;
  liczbaZdjec: number;
  liczbaSwiec: number;
  liczbaAlbumow?: number;
  podgladHistorii?: PodgladHistoriiCentrum[];
  podgladZdjec?: PodgladZdjeciaCentrum[];
  zalogowany?: boolean;
};

export function CentrumWspomnienWsi({
  sciezkaProfilu,
  nazwaWsi,
  liczbaHistorii,
  liczbaZdjec,
  liczbaSwiec,
  liczbaAlbumow = 0,
  podgladHistorii = [],
  podgladZdjec = [],
  zalogowany = false,
}: Props) {
  const maTresc = liczbaHistorii > 0 || liczbaZdjec > 0;
  if (!maTresc && !zalogowany) return null;

  const zdjeciaPasek = podgladZdjec.slice(0, 10);
  const wpisyKarty = podgladHistorii.slice(0, 3);

  return (
    <OslonaSekcjiWies id="centrum-wspomnien" className="!py-6">
      <UjawnijPoPrzewinieciu as="section">
        <div className="centrum-wspomnien-wow relative overflow-hidden rounded-2xl border border-amber-300/50 p-5 sm:p-6">
          <div className="relative z-[1] flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-900/80">
                <span className="zyla-kronika-badge inline-flex items-center rounded-full px-2 py-0.5 normal-case tracking-normal">
                  <span className="spolecznosc-puls" aria-hidden />
                  Pamięć miejsca
                </span>
              </p>
              <h2 className="mt-2 font-serif text-xl text-green-950 sm:text-2xl">
                Kronika i zdjęcia {nazwaWsi}
              </h2>
              <p className="mt-2 max-w-xl text-sm text-stone-600">
                Historia, archiwum zdjęć i wspomnienia mieszkańców — żywa wizytówka wsi na profilu publicznym.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {liczbaHistorii > 0 ? (
                <Link
                  href={`${sciezkaProfilu}/historia`}
                  className="inline-flex min-h-10 items-center rounded-full bg-amber-800 px-4 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-amber-900 hover:shadow-md"
                >
                  Kronika ({liczbaHistorii})
                </Link>
              ) : null}
              {liczbaZdjec > 0 ? (
                <a
                  href="#fotokronika-wsi"
                  className="inline-flex min-h-10 items-center rounded-full border border-amber-400/70 bg-white/90 px-4 text-sm font-medium text-amber-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-amber-50"
                >
                  Fotokronika ({liczbaZdjec})
                </a>
              ) : null}
            </div>
          </div>

          {zdjeciaPasek.length > 0 ? (
            <div className="centrum-wspomnien-filmstrip relative z-[1] mt-5 -mx-1 overflow-hidden rounded-xl">
              <ul className="centrum-wspomnien-filmstrip__track flex gap-2 overflow-x-auto pb-1 pt-0.5 [scrollbar-width:thin]">
                {zdjeciaPasek.map((z, i) => (
                  <li key={z.id} className="centrum-wspomnien-filmstrip__kadr shrink-0" style={{ animationDelay: `${i * 80}ms` }}>
                    <a href="#fotokronika-wsi" className="group block overflow-hidden rounded-lg ring-2 ring-white/80 shadow-md transition hover:-translate-y-1 hover:shadow-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={z.url}
                        alt={z.caption ?? "Zdjęcie z fotokroniki"}
                        className="h-24 w-32 object-cover transition duration-500 group-hover:scale-105 sm:h-28 sm:w-36"
                        loading="lazy"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <dl className="centrum-wspomnien-statystyki relative z-[1] mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-white/80 bg-white/75 px-3 py-3 text-center backdrop-blur-sm">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">Wpisy kroniki</dt>
              <dd className="mt-1 font-serif text-2xl text-amber-900">
                <LicznikAnimowany wartosc={liczbaHistorii} />
              </dd>
            </div>
            <div className="rounded-xl border border-white/80 bg-white/75 px-3 py-3 text-center backdrop-blur-sm">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">Zdjęcia</dt>
              <dd className="mt-1 font-serif text-2xl text-emerald-800">
                <LicznikAnimowany wartosc={liczbaZdjec} />
              </dd>
            </div>
            {liczbaAlbumow > 0 ? (
              <div className="rounded-xl border border-white/80 bg-white/75 px-3 py-3 text-center backdrop-blur-sm">
                <dt className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">Albumy</dt>
                <dd className="mt-1 font-serif text-2xl text-amber-950">
                  <LicznikAnimowany wartosc={liczbaAlbumow} />
                </dd>
              </div>
            ) : null}
            <div className="rounded-xl border border-white/80 bg-white/75 px-3 py-3 text-center backdrop-blur-sm">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">Świece</dt>
              <dd className="mt-1 font-serif text-2xl text-stone-700">
                <LicznikAnimowany wartosc={liczbaSwiec} />
              </dd>
            </div>
          </dl>

          {wpisyKarty.length > 0 ? (
            <ul className="relative z-[1] mt-5 grid gap-3 sm:grid-cols-3">
              {wpisyKarty.map((w, i) => (
                <UjawnijPoPrzewinieciu key={w.id} as="li" opoznienieMs={i * 90}>
                  <Link
                    href={w.href}
                    className="karta-wow group flex h-full flex-col overflow-hidden rounded-xl border border-amber-200/60 bg-white/90 shadow-sm"
                  >
                    {w.mediaUrl ? (
                      <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={w.mediaUrl}
                          alt=""
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition group-hover:opacity-100" />
                      </div>
                    ) : (
                      <div className="flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-amber-50 to-emerald-50 text-3xl">
                        📜
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-3">
                      {w.eraLabel ? (
                        <p className="text-[10px] font-bold uppercase tracking-wide text-amber-800">{w.eraLabel}</p>
                      ) : null}
                      <p className="mt-1 line-clamp-2 font-medium text-green-950 group-hover:text-green-900">{w.title}</p>
                      <p className="mt-auto pt-2 text-xs font-semibold text-amber-900 opacity-0 transition group-hover:opacity-100">
                        Czytaj wpis →
                      </p>
                    </div>
                  </Link>
                </UjawnijPoPrzewinieciu>
              ))}
            </ul>
          ) : null}

          {!maTresc && zalogowany ? (
            <p className="relative z-[1] mt-4 text-sm text-stone-600">
              Bądź pierwszą osobą, która{" "}
              <Link href="/panel/mieszkaniec/historia" className="font-medium text-green-800 underline">
                doda wspomnienie
              </Link>{" "}
              lub{" "}
              <Link href="/panel/mieszkaniec/fotokronika" className="font-medium text-green-800 underline">
                zdjęcie do albumu
              </Link>
              .
            </p>
          ) : null}
        </div>
      </UjawnijPoPrzewinieciu>
    </OslonaSekcjiWies>
  );
}
