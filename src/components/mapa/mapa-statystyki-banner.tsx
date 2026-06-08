"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type StatystykiMapy = {
  lacznie: number;
  bezObrysu: number;
  bezTransportu: number;
  zMalymPoi: number;
  zPrzystankiem: number;
  zeStacja: number;
};

const KLUCZ_ZWINIETY = "naszawies-mapa-statystyki-zwiniete";

function KafelekStatystyki({
  emoji,
  wartosc,
  etykieta,
  kolor = "stone",
}: {
  emoji: string;
  wartosc: number;
  etykieta: string;
  kolor?: "stone" | "amber" | "sky" | "green";
}) {
  const kolory = {
    stone: "border-stone-200/80 bg-white/90 text-stone-800",
    amber: "border-amber-200/80 bg-amber-50/90 text-amber-950",
    sky: "border-sky-200/80 bg-sky-50/90 text-sky-950",
    green: "border-green-200/80 bg-green-50/90 text-green-950",
  };

  return (
    <div className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 shadow-sm ${kolory[kolor]}`}>
      <span className="text-base" aria-hidden>
        {emoji}
      </span>
      <div>
        <p className="text-sm font-bold tabular-nums leading-none">{wartosc}</p>
        <p className="text-[10px] font-medium leading-tight opacity-80">{etykieta}</p>
      </div>
    </div>
  );
}

export function MapaStatystykiBanner({ statystyki }: { statystyki: StatystykiMapy }) {
  const [zwiniety, ustawZwiniety] = useState(false);

  useEffect(() => {
    try {
      ustawZwiniety(window.sessionStorage.getItem(KLUCZ_ZWINIETY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  if (statystyki.lacznie === 0) return null;

  const maOstrzezenia =
    statystyki.bezObrysu > 0 || statystyki.bezTransportu > 0 || statystyki.zMalymPoi > 0;

  return (
    <div className="animate-mapa-reveal border-b border-green-900/10 bg-gradient-to-r from-emerald-50/90 via-white to-amber-50/40 px-3 py-2 sm:px-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg px-1 py-0.5 text-left text-xs font-semibold text-green-950 hover:bg-white/60"
          aria-expanded={!zwiniety}
          onClick={() => {
            ustawZwiniety((v) => {
              const next = !v;
              try {
                window.sessionStorage.setItem(KLUCZ_ZWINIETY, next ? "1" : "0");
              } catch {
                /* ignore */
              }
              return next;
            });
          }}
        >
          <span aria-hidden>{zwiniety ? "▸" : "▾"}</span>
          Pokrycie mapy
          {maOstrzezenia ? (
            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
              do uzupełnienia
            </span>
          ) : null}
        </button>
        {zwiniety ? (
          <span className="text-[11px] text-stone-600">
            {statystyki.lacznie} wsi
            {statystyki.zPrzystankiem > 0 ? ` · ${statystyki.zPrzystankiem} z przystankiem` : ""}
          </span>
        ) : (
          <>
            <KafelekStatystyki emoji="🏘️" wartosc={statystyki.lacznie} etykieta="wsi na mapie" kolor="green" />
            {statystyki.zPrzystankiem > 0 ? (
              <KafelekStatystyki emoji="🚌" wartosc={statystyki.zPrzystankiem} etykieta="z przystankiem" kolor="sky" />
            ) : null}
            {statystyki.zeStacja > 0 ? (
              <KafelekStatystyki emoji="🚆" wartosc={statystyki.zeStacja} etykieta="ze stacją" kolor="sky" />
            ) : null}
            {statystyki.bezObrysu > 0 ? (
              <KafelekStatystyki emoji="📍" wartosc={statystyki.bezObrysu} etykieta="bez obrysu PRG" kolor="amber" />
            ) : null}
            {statystyki.bezTransportu > 0 ? (
              <KafelekStatystyki emoji="🛣️" wartosc={statystyki.bezTransportu} etykieta="bez transportu" kolor="amber" />
            ) : null}
            {statystyki.zMalymPoi > 0 ? (
              <KafelekStatystyki emoji="📌" wartosc={statystyki.zMalymPoi} etykieta="mało POI (OSM)" kolor="amber" />
            ) : null}
            <Link
              href="/panel/soltys/moja-wies"
              className="ml-auto rounded-xl border border-green-800/25 bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-green-900 shadow-sm transition hover:border-green-700 hover:bg-green-50"
            >
              Uzupełnij jako sołtys →
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
