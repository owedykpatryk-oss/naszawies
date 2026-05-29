"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { dodajSubskrypcjeKategoriiRynku } from "@/app/(site)/panel/mieszkaniec/marketplace/akcje-subskrypcje";
import { etykietaKategoriiOgloszenia } from "@/lib/marketplace/kategorie-ogloszen";

export function RynekSubskrypcjaKategorii({
  villageId,
  nazwaWsi,
  kategoria,
  zalogowany,
  juzSubskrybuje,
}: {
  villageId: string;
  nazwaWsi: string;
  kategoria: string;
  zalogowany: boolean;
  /** equipment_category lub null = wszystkie kategorie */
  juzSubskrybuje: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [czek, startT] = useTransition();
  const [ok, ustawOk] = useState(false);
  const [blad, ustawBlad] = useState("");

  const etykieta = etykietaKategoriiOgloszenia(kategoria) ?? kategoria;
  const nextUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  if (juzSubskrybuje || ok) {
    return (
      <p className="rounded-xl border border-green-200/80 bg-green-50/60 px-3 py-2 text-xs text-green-900">
        🔔 Powiadomimy Cię o nowych ogłoszeniach w kategorii „{etykieta}” we wsi {nazwaWsi}.
      </p>
    );
  }

  if (!zalogowany) {
    return (
      <p className="rounded-xl border border-orange-200/70 bg-orange-50/50 px-3 py-2 text-xs text-stone-700">
        Chcesz wiedzieć o nowym „{etykieta.toLowerCase()}” w {nazwaWsi}?{" "}
        <Link href={`/logowanie?next=${encodeURIComponent(nextUrl)}`} className="font-semibold text-green-800 underline">
          Zaloguj się
        </Link>{" "}
        i włącz powiadomienia.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-orange-200/70 bg-gradient-to-r from-orange-50/80 to-amber-50/40 px-3 py-2.5">
      <p className="text-xs text-stone-700">
        <span className="font-semibold text-orange-950">Nowy {etykieta.toLowerCase()} w {nazwaWsi}?</span> Włącz powiadomienie push i e-mail.
      </p>
      <button
        type="button"
        disabled={czek}
        onClick={() => {
          ustawBlad("");
          startT(async () => {
            const w = await dodajSubskrypcjeKategoriiRynku(villageId, kategoria);
            if ("blad" in w) {
              ustawBlad(w.blad);
              return;
            }
            ustawOk(true);
            router.refresh();
          });
        }}
        className="shrink-0 rounded-lg bg-green-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-900 disabled:opacity-50"
      >
        {czek ? "…" : "🔔 Powiadom mnie"}
      </button>
      {blad ? (
        <p className="w-full text-[11px] text-red-800" role="alert">
          {blad}
        </p>
      ) : null}
    </div>
  );
}
