"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ustawObserwacjeCenyOgloszenia } from "@/app/(site)/panel/moje/akcje";

export function RynekObserwujCene({
  zapisaneId,
  poczatkowoWlaczone = true,
}: {
  zapisaneId: string;
  poczatkowoWlaczone?: boolean;
}) {
  const router = useRouter();
  const [wlaczone, ustawWlaczone] = useState(poczatkowoWlaczone);
  const [czek, startT] = useTransition();
  const [blad, ustawBlad] = useState("");

  return (
    <span className="inline-flex flex-col items-start gap-0.5">
      <button
        type="button"
        disabled={czek}
        onClick={() => {
          ustawBlad("");
          const nowe = !wlaczone;
          startT(async () => {
            const w = await ustawObserwacjeCenyOgloszenia(zapisaneId, nowe);
            if ("blad" in w) {
              ustawBlad(w.blad);
              return;
            }
            ustawWlaczone(nowe);
            router.refresh();
          });
        }}
        className={`text-xs font-medium underline disabled:opacity-50 ${
          wlaczone ? "text-green-800" : "text-stone-500 hover:text-green-800"
        }`}
        title={wlaczone ? "Wyłącz powiadomienia o zmianie ceny" : "Powiadom, gdy sprzedawca zmieni cenę"}
      >
        {wlaczone ? "🔔 Obserwujesz cenę" : "🔕 Obserwuj cenę"}
      </button>
      {blad ? <span className="text-[10px] text-red-700">{blad}</span> : null}
    </span>
  );
}
