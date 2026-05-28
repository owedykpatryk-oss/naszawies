"use client";

import Link from "next/link";

export type StatystykiMapy = {
  lacznie: number;
  bezObrysu: number;
  bezTransportu: number;
  zPrzystankiem: number;
  zeStacja: number;
};

export function MapaStatystykiBanner({ statystyki }: { statystyki: StatystykiMapy }) {
  if (statystyki.lacznie === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-stone-100 bg-stone-50/90 px-4 py-2 text-[11px] text-stone-600 md:px-5">
      <span>
        <strong>{statystyki.lacznie}</strong> wsi
      </span>
      {statystyki.bezObrysu > 0 ? (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-950">
          {statystyki.bezObrysu} bez obrysu PRG
        </span>
      ) : null}
      {statystyki.bezTransportu > 0 ? (
        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-950">
          {statystyki.bezTransportu} bez przystanku/stacji
        </span>
      ) : null}
      {statystyki.zPrzystankiem > 0 ? (
        <span>🚌 {statystyki.zPrzystankiem} z przystankiem</span>
      ) : null}
      {statystyki.zeStacja > 0 ? (
        <span>🚆 {statystyki.zeStacja} ze stacją</span>
      ) : null}
      <Link
        href="/panel/soltys/moja-wies"
        className="ml-auto font-medium text-green-900 underline decoration-green-800/40"
      >
        Uzupełnij jako sołtys →
      </Link>
    </div>
  );
}
