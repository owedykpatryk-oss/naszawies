"use client";

import { useState } from "react";
import { urlRssTablicySzkoly } from "@/lib/szkola/rss-szkoly";

type Props = {
  villageId: string;
  sciezkaProfilu: string;
  nazwaWsi: string;
};

export function UdostepnijTabliceSzkolyKlient({ villageId, sciezkaProfilu, nazwaWsi }: Props) {
  const [kopiuj, ustawKopiuj] = useState<"idle" | "ok" | "blad">("idle");
  const link =
    typeof window !== "undefined"
      ? `${window.location.origin}${sciezkaProfilu}#sekcja-szkola`
      : `${sciezkaProfilu}#sekcja-szkola`;
  const rssUrl = urlRssTablicySzkoly(villageId);

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
          title: `Tablica szkoły — ${nazwaWsi}`,
          text: "Ogłoszenia szkolne na naszawies.pl",
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
    <div className="tablica-szkoly-akcje mt-5">
      <p className="w-full text-xs font-semibold uppercase tracking-wide text-sky-900/80 sm:w-auto sm:flex-1">
        Udostępnij tablicę rodzicom
      </p>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={() => void udostepnij()}
          className={`${przycisk} border-sky-400 bg-sky-800 text-white shadow-sm hover:bg-sky-900`}
        >
          Udostępnij
        </button>
        <button
          type="button"
          onClick={() => void kopiujLink()}
          className={`${przycisk} border-stone-300 bg-white text-stone-800 hover:bg-stone-50`}
        >
          {kopiuj === "ok" ? "Skopiowano link" : "Kopiuj link"}
        </button>
        <a
          href={rssUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${przycisk} border-stone-300 bg-white text-stone-700 hover:bg-stone-50`}
        >
          RSS ogłoszeń
        </a>
      </div>
      {kopiuj === "blad" ? <span className="w-full text-xs text-red-700">Nie udało się skopiować.</span> : null}
    </div>
  );
}
