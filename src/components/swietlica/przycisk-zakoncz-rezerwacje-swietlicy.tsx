"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { oznaczRezerwacjeJakoZakonczonaSwietlicy } from "@/app/(site)/panel/soltys/akcje";

type Props = {
  bookingId: string;
  status: string;
  endAtIso: string;
};

export function PrzyciskZakonczRezerwacjeSwietlicy({ bookingId, status, endAtIso }: Props) {
  const router = useRouter();
  const [blad, ustawBlad] = useState("");
  const [oczekuje, startTransition] = useTransition();

  if (status !== "approved") {
    return null;
  }

  const koniec = new Date(endAtIso);
  const mozna = !Number.isNaN(koniec.getTime()) && koniec.getTime() <= Date.now();

  if (!mozna) {
    return (
      <p className="mt-2 text-xs text-stone-500">
        Po zakończeniu terminu ({koniec.toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })}) pojawi się
        przycisk „Oznacz jako zakończoną”.
      </p>
    );
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        disabled={oczekuje}
        onClick={() => {
          ustawBlad("");
          startTransition(async () => {
            const w = await oznaczRezerwacjeJakoZakonczonaSwietlicy(bookingId);
            if ("blad" in w) {
              ustawBlad(w.blad);
              return;
            }
            router.refresh();
          });
        }}
        className="rounded-lg border border-green-900/40 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-950 hover:bg-green-100 disabled:opacity-50"
      >
        Oznacz rezerwację jako zakończoną
      </button>
      {blad ? (
        <p className="mt-1 text-xs text-red-800" role="alert">
          {blad}
        </p>
      ) : (
        <p className="mt-1 text-[11px] text-stone-500">
          Status „zakończona” zamyka okres wynajmu w systemie; dokumentacja zniszczeń nadal możliwa.
        </p>
      )}
    </div>
  );
}
