"use client";

import { useState, useTransition } from "react";

export function RynekUdostepnijPrzycisk({ url, tytul, tekst }: { url: string; tytul: string; tekst?: string }) {
  const [komunikat, ustawKomunikat] = useState("");
  const [czek, startT] = useTransition();

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={czek}
        className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-800 hover:bg-stone-50 disabled:opacity-50"
        onClick={() => {
          ustawKomunikat("");
          startT(async () => {
            const pelny = typeof window !== "undefined" ? `${window.location.origin}${url}` : url;
            if (typeof navigator !== "undefined" && navigator.share) {
              try {
                await navigator.share({ title: tytul, text: tekst, url: pelny });
                return;
              } catch {
                /* fallback copy */
              }
            }
            try {
              await navigator.clipboard.writeText(tekst ? `${tekst}\n${pelny}` : pelny);
              ustawKomunikat("Link skopiowany");
            } catch {
              ustawKomunikat("Nie udało się skopiować");
            }
          });
        }}
      >
        Udostępnij link
      </button>
      {komunikat ? <span className="text-[10px] text-stone-500">{komunikat}</span> : null}
    </span>
  );
}
