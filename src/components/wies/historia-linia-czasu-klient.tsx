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
            className="absolute left-0 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-amber-400 bg-white text-[10px] font-bold text-amber-900 shadow-sm"
            aria-hidden
          >
            {lista.length - i}
          </span>
          <Link href={`${sciezkaProfilu}/historia/${w.id}`} className={`${KARTA_LISTY_WIES} flex gap-3`}>
            {w.media_urls[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={w.media_urls[0]}
                alt=""
                className="h-16 w-16 shrink-0 rounded-lg object-cover"
                loading="lazy"
              />
            ) : (
              <span
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-amber-100/90 text-lg"
                aria-hidden
              >
                📜
              </span>
            )}
            <div className="min-w-0 flex-1">
              {w.era_label ? <p className="text-xs font-medium text-amber-800">{w.era_label}</p> : null}
              <p className="font-medium text-stone-900">{w.title}</p>
              {w.short_description ? (
                <p className="mt-1 line-clamp-2 text-xs text-stone-600">{w.short_description}</p>
              ) : null}
              <p className="mt-2 text-xs text-stone-500">
                {dataWydarzenia(w)}
                {w.location_label ? ` · ${w.location_label}` : ""}
                {w.candle_count > 0 ? ` · 🕯 ${w.candle_count}` : ""}
                {w.is_featured ? " · ★" : ""}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ol>
  );
}
