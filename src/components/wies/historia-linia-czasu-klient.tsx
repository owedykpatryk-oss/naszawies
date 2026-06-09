"use client";

import Link from "next/link";
import { KARTA_LISTY_WIES } from "@/components/wies/oslona-sekcji-wies";
import type { WpisHistoriiPubliczny } from "@/lib/historia/typy-historii";

type Props = {
  wpisy: WpisHistoriiPubliczny[];
  sciezkaProfilu: string;
  limit?: number;
};

function dataWydarzenia(w: WpisHistoriiPubliczny): string {
  if (w.event_date) return new Date(w.event_date).toLocaleDateString("pl-PL");
  return new Date(w.created_at).toLocaleDateString("pl-PL");
}

export function HistoriaLiniaCzasuKlient({ wpisy, sciezkaProfilu, limit }: Props) {
  const lista = limit != null ? wpisy.slice(0, limit) : wpisy;

  return (
    <ol className="historia-linia-czasu relative mt-4 space-y-0 pl-1">
      {lista.map((w, i) => (
        <li key={w.id} className="historia-linia-czasu-punkt relative pb-6 pl-8 last:pb-0">
          <span
            className="historia-punkt absolute left-0 top-2 flex h-5 w-5 items-center justify-center rounded-full border-2 border-amber-400 bg-white text-[10px] font-bold text-amber-900 shadow-sm"
            aria-hidden
          >
            {lista.length - i}
          </span>
          <Link
            href={`${sciezkaProfilu}/historia/${w.id}`}
            className={`historia-karta-timeline ${KARTA_LISTY_WIES} group flex gap-3 overflow-hidden transition duration-300 hover:-translate-y-0.5 hover:border-amber-300/80 hover:shadow-md`}
          >
            {w.media_urls[0] ? (
              <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg sm:h-24 sm:w-24">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={w.media_urls[0]}
                  alt=""
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                {w.media_urls.length > 1 ? (
                  <span className="absolute bottom-1 right-1 rounded bg-black/50 px-1.5 py-0.5 text-[9px] font-bold text-white">
                    +{w.media_urls.length - 1}
                  </span>
                ) : null}
              </span>
            ) : (
              <span
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 text-2xl sm:h-24 sm:w-24"
                aria-hidden
              >
                📜
              </span>
            )}
            <div className="min-w-0 flex-1 py-0.5">
              <div className="flex flex-wrap items-center gap-2">
                {w.era_label ? (
                  <span className="rounded-full bg-amber-100/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900">
                    {w.era_label}
                  </span>
                ) : null}
                {w.is_featured ? (
                  <span className="text-[10px] font-semibold text-amber-700">★ Wyróżnione</span>
                ) : null}
              </div>
              <p className="mt-1 font-serif text-base font-medium text-stone-900 group-hover:text-green-950">{w.title}</p>
              {w.short_description ? (
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-600">{w.short_description}</p>
              ) : null}
              <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-500">
                <time dateTime={w.event_date ?? w.created_at}>{dataWydarzenia(w)}</time>
                {w.location_label ? <span>· {w.location_label}</span> : null}
                {w.candle_count > 0 ? (
                  <span className="inline-flex items-center gap-0.5 text-amber-800/90">· 🕯 {w.candle_count}</span>
                ) : null}
              </p>
            </div>
            <span className="hidden shrink-0 self-center pr-2 text-stone-300 transition group-hover:text-amber-700 sm:inline" aria-hidden>
              →
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

