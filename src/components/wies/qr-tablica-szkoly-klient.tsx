"use client";

import { useEffect, useState } from "react";
import { generujQrDataUrl, domyslnyUrlQrWies } from "@/lib/grafika/qr-kod";

type Props = {
  nazwaWsi: string;
  sciezkaProfilu: string;
};

/** QR prowadzący do sekcji tablicy szkoły na profilu wsi. */
export function QrTablicaSzkolyKlient({ nazwaWsi, sciezkaProfilu }: Props) {
  const [qrUrl, ustawQrUrl] = useState<string | null>(null);
  const [kopiuj, ustawKopiuj] = useState<"idle" | "ok" | "blad">("idle");
  const pelnyUrl =
    typeof window !== "undefined"
      ? `${domyslnyUrlQrWies(sciezkaProfilu)}#sekcja-szkola`
      : `${(process.env.NEXT_PUBLIC_SITE_URL ?? "https://naszawies.pl").replace(/\/$/, "")}${sciezkaProfilu}#sekcja-szkola`;

  useEffect(() => {
    void generujQrDataUrl(pelnyUrl, 180).then(ustawQrUrl);
  }, [pelnyUrl]);

  async function kopiujLink() {
    try {
      await navigator.clipboard.writeText(pelnyUrl);
      ustawKopiuj("ok");
      setTimeout(() => ustawKopiuj("idle"), 2000);
    } catch {
      ustawKopiuj("blad");
    }
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-sky-200/80 bg-gradient-to-br from-sky-50/90 via-white to-sky-50/40 p-4 shadow-sm ring-1 ring-sky-100/60">
      <p className="text-sm font-medium text-sky-950">QR tablicy szkoły</p>
      <p className="mt-1 text-xs text-stone-600">
        Wydrukuj przy wejściu do szkoły lub na tablicy dla rodziców — skan otwiera tablicę ogłoszeń wsi {nazwaWsi}.
      </p>
      <div className="mt-3 flex flex-col items-stretch gap-4 sm:flex-row sm:items-start">
        {qrUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrUrl} alt={`QR tablica szkoły ${nazwaWsi}`} width={180} height={180} className="rounded-lg border border-white bg-white p-2 shadow-sm" />
        ) : (
          <div className="flex h-[180px] w-[180px] items-center justify-center rounded-lg border border-dashed border-stone-300 bg-white text-xs text-stone-500">
            Generowanie…
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-2 text-xs">
          <p className="break-all font-mono text-stone-700">{pelnyUrl}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void kopiujLink()} className="rounded-lg bg-sky-800 px-3 py-1.5 font-medium text-white hover:bg-sky-900">
              {kopiuj === "ok" ? "Skopiowano" : "Kopiuj link"}
            </button>
            <a href={pelnyUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 font-medium text-sky-900 hover:bg-stone-50">
              Otwórz tablicę
            </a>
          </div>
          {kopiuj === "blad" ? <p className="text-red-700">Skopiuj link ręcznie.</p> : null}
        </div>
      </div>
    </div>
  );
}
