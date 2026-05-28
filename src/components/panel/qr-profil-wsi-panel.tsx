"use client";

import { useEffect, useState } from "react";
import { generujQrDataUrl, domyslnyUrlQrWies } from "@/lib/grafika/qr-kod";

type Props = {
  nazwaWsi: string;
  sciezkaPubliczna: string;
};

export function QrProfilWsiPanel({ nazwaWsi, sciezkaPubliczna }: Props) {
  const [qrUrl, ustawQrUrl] = useState<string | null>(null);
  const [kopiuj, ustawKopiuj] = useState<"idle" | "ok" | "blad">("idle");
  const pelnyUrl =
    typeof window !== "undefined"
      ? domyslnyUrlQrWies(sciezkaPubliczna)
      : `${(process.env.NEXT_PUBLIC_SITE_URL ?? "https://naszawies.pl").replace(/[\r\n]+/g, "").trim()}${sciezkaPubliczna}`;

  useEffect(() => {
    void generujQrDataUrl(pelnyUrl, 200).then(ustawQrUrl);
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
    <section
      id="qr-profil-wsi"
      className="mt-6 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 to-white p-5 shadow-sm scroll-mt-24"
    >
      <h3 className="font-serif text-lg text-green-950">Link i kod QR dla mieszkańców</h3>
      <p className="mt-1 text-sm text-stone-600">
        Wydrukuj QR na tablicy ogłoszeń w {nazwaWsi} — po zeskanowaniu otworzy się publiczny profil wsi w serwisie.
      </p>
      <div className="mt-4 flex flex-wrap items-start gap-6">
        {qrUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrUrl}
            alt={`Kod QR — profil wsi ${nazwaWsi}`}
            width={200}
            height={200}
            className="rounded-lg border border-stone-200 bg-white p-2 shadow-sm"
          />
        ) : (
          <div className="flex h-[200px] w-[200px] items-center justify-center rounded-lg border border-dashed border-stone-300 bg-white text-xs text-stone-500">
            Generowanie QR…
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-3 text-sm">
          <p className="break-all font-mono text-xs text-stone-700">{pelnyUrl}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={kopiujLink}
              className="rounded-lg border border-green-800 bg-green-800 px-3 py-2 text-xs font-medium text-white hover:bg-green-900"
            >
              {kopiuj === "ok" ? "Skopiowano" : "Kopiuj link"}
            </button>
            <a
              href={sciezkaPubliczna}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-green-900 hover:bg-stone-50"
            >
              Otwórz profil
            </a>
            <a
              href="/panel/soltys/grafika"
              className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-800 hover:bg-stone-50"
            >
              Kreator plakatów z QR
            </a>
          </div>
          {kopiuj === "blad" ? (
            <p className="text-xs text-red-800">Nie udało się skopiować — zaznacz link ręcznie.</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
