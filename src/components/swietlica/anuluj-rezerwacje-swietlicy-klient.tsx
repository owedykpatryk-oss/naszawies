"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { anulujRezerwacjeSwietlicy } from "@/app/(site)/panel/mieszkaniec/akcje";

type Props = {
  bookingId: string;
  status: string;
};

export function AnulujRezerwacjeSwietlicyKlient({ bookingId, status }: Props) {
  const router = useRouter();
  const [blad, ustawBlad] = useState("");
  const [oczekuje, startTransition] = useTransition();

  if (status !== "pending") {
    return null;
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        disabled={oczekuje}
        onClick={() => {
          if (!window.confirm("Anulować wniosek o rezerwację? Termin zostanie zwolniony w kalendarzu.")) return;
          ustawBlad("");
          startTransition(async () => {
            const w = await anulujRezerwacjeSwietlicy(bookingId);
            if ("blad" in w) {
              ustawBlad(w.blad);
              return;
            }
            router.refresh();
          });
        }}
        className="text-xs text-red-800 underline hover:text-red-950 disabled:opacity-50"
      >
        {oczekuje ? "Anulowanie…" : "Anuluj wniosek"}
      </button>
      {blad ? (
        <p className="mt-1 text-xs text-red-800" role="alert">
          {blad}
        </p>
      ) : null}
    </div>
  );
}
