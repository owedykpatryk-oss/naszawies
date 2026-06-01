"use client";

import { useState, useTransition } from "react";
import { zapalSwieczkeHistorii } from "@/lib/historia/akcje-historia-reakcje";

type Props = {
  entryId: string;
  poczatkowaLiczba: number;
  poczatkowoZapalona?: boolean;
};

export function ZapalSwieczkeHistoriaKlient({
  entryId,
  poczatkowaLiczba,
  poczatkowoZapalona = false,
}: Props) {
  const [liczba, ustawLiczba] = useState(poczatkowaLiczba);
  const [zapalona, ustawZapalona] = useState(poczatkowoZapalona);
  const [blad, ustawBlad] = useState("");
  const [czek, startT] = useTransition();

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={czek}
        onClick={() => {
          ustawBlad("");
          startT(async () => {
            const w = await zapalSwieczkeHistorii(entryId);
            if (w.blad) {
              ustawBlad(w.blad);
              return;
            }
            if (w.candle_count != null) ustawLiczba(w.candle_count);
            if (w.zapalona != null) ustawZapalona(w.zapalona);
          });
        }}
        className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition disabled:opacity-60 ${
          zapalona
            ? "border-amber-400 bg-amber-100 text-amber-950"
            : "border-stone-300 bg-white text-stone-700 hover:border-amber-300 hover:bg-amber-50/80"
        }`}
        title={zapalona ? "Zgaś świeczkę pamięci" : "Zapal świeczkę pamięci"}
      >
        <span aria-hidden>{zapalona ? "🕯️" : "🕯"}</span>
        {zapalona ? "Świeczka zapalona" : "Zapal świeczkę"}
        {liczba > 0 ? <span className="text-xs text-stone-500">({liczba})</span> : null}
      </button>
      {blad ? <span className="text-[10px] text-red-700">{blad}</span> : null}
    </div>
  );
}
