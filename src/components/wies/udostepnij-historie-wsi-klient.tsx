"use client";

import { useState } from "react";

type Props = {
  sciezkaProfilu: string;
  nazwaWsi: string;
};

export function UdostepnijHistorieWsiKlient({ sciezkaProfilu, nazwaWsi }: Props) {
  const [kopiuj, ustawKopiuj] = useState<"idle" | "ok" | "blad">("idle");
  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}${sciezkaProfilu}#sekcja-historia`
      : `${sciezkaProfilu}#sekcja-historia`;

  async function kopiujLink() {
    try {
      await navigator.clipboard.writeText(link);
      ustawKopiuj("ok");
      setTimeout(() => ustawKopiuj("idle"), 2000);
    } catch {
      ustawKopiuj("blad");
    }
  }

  async function udostepnij() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Historia — ${nazwaWsi}`,
          text: "Kronika miejscowości na naszawies.pl",
          url: link,
        });
        return;
      } catch {
        /* anulowano */
      }
    }
    void kopiujLink();
  }

  const przycisk =
    "inline-flex min-h-[44px] items-center justify-center rounded-lg border px-3 py-2.5 text-sm font-medium transition sm:min-h-0 sm:py-2";

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => void udostepnij()}
        className={`${przycisk} border-amber-400 bg-amber-800 text-white shadow-sm hover:bg-amber-900`}
      >
        Udostępnij kronikę
      </button>
      <button
        type="button"
        onClick={() => void kopiujLink()}
        className={`${przycisk} border-stone-300 bg-white text-stone-800 hover:bg-stone-50`}
      >
        {kopiuj === "ok" ? "Skopiowano" : "Kopiuj link"}
      </button>
      {kopiuj === "blad" ? <span className="text-xs text-red-700">Skopiuj ręcznie z paska adresu.</span> : null}
    </div>
  );
}
