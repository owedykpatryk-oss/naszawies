"use client";

import Link from "next/link";

/** Informacja prawna przy ogłoszeniach nieruchomości / działek. */
export function InformacjaPrawnaNieruchomosci() {
  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50/80 p-4 text-sm text-sky-950">
      <p className="font-semibold">Działki i nieruchomości — ważne</p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-sky-900/90">
        <li>
          Granica działki z Geoportalu (ULDK GUGiK) ma charakter <strong>pomocniczy</strong> — przed transakcją
          weryfikuj w urzędzie / u notariusza.
        </li>
        <li>
          NaszaWies <strong>nie jest portalem pośrednictwa</strong> i <strong>nie przyjmuje płatności</strong> —
          ogłoszenie nie zastępuje umowy ani operatu szacunkowego; rozliczenie między stronami.
        </li>
        <li>
          Sprzedawca odpowiada za prawdziwość opisu, numer działki i status prawny gruntu (MPZP, służebności, hipoteka).
        </li>
        <li>
          Zdjęcia (max 5) przechowujemy taniej w{" "}
          <Link href="https://www.cloudflare.com/pl-pl/developer-platform/r2/" className="underline" target="_blank" rel="noreferrer">
            Cloudflare R2
          </Link>{" "}
          — gdy skonfigurowane; w przeciwnym razie w Supabase Storage.
        </li>
      </ul>
    </div>
  );
}
