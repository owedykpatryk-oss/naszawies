"use client";

import Link from "next/link";
import { powiazaneSzablony } from "@/lib/grafika/powiazane-szablony";
import { linkDoPresetuDokumentu, powiazaneDokumenty } from "@/lib/grafika/powiazane-dokumenty";
import { znajdzSzablon } from "@/lib/grafika/szablony";

type Props = {
  szablonId: string;
  onWybor: (id: string) => void;
};

export function BannerPowiazaneSzablony({ szablonId, onWybor }: Props) {
  const powiazane = powiazaneSzablony(szablonId);
  const dokumenty = powiazaneDokumenty(szablonId);
  if (powiazane.length === 0 && dokumenty.length === 0) return null;

  return (
    <div className="rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50/90 to-white p-3">
      <p className="text-xs font-semibold text-violet-900">Komplet materiałów — co jeszcze przyda się do tego wydarzenia?</p>

      {powiazane.length > 0 ? (
        <div className="mt-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-violet-700/80">Grafika</p>
          <ul className="mt-1 flex flex-wrap gap-2">
            {powiazane.map((p) => {
              if (!znajdzSzablon(p.id)) return null;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => onWybor(p.id)}
                    className="rounded-full border border-violet-300 bg-white px-3 py-1.5 text-xs font-medium text-violet-900 transition hover:bg-violet-100"
                  >
                    {p.etykieta} →
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {dokumenty.length > 0 ? (
        <div className="mt-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-700/80">Dokumenty tekstowe</p>
          <ul className="mt-1 flex flex-wrap gap-2">
            {dokumenty.map((d) => (
              <li key={d.presetId}>
                <Link
                  href={linkDoPresetuDokumentu(d.presetId)}
                  className="inline-block rounded-full border border-emerald-300 bg-white px-3 py-1.5 text-xs font-medium text-emerald-900 transition hover:bg-emerald-50"
                >
                  {d.etykieta} ↗
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
