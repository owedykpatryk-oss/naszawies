"use client";

import { useEffect, useState } from "react";
import { formatujLiczbeWyswietlen } from "@/lib/marketplace/formatuj-liczbe-wyswietlen";

function kluczSesji(listingId: string) {
  return `rynek-view-${listingId}`;
}

export function RynekRejestrujWyswietlenie({
  listingId,
  poczatkowaLiczba = 0,
}: {
  listingId: string;
  poczatkowaLiczba?: number;
}) {
  const [liczba, ustawLiczbe] = useState(poczatkowaLiczba);

  useEffect(() => {
    ustawLiczbe(poczatkowaLiczba);
  }, [poczatkowaLiczba, listingId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const klucz = kluczSesji(listingId);
    if (sessionStorage.getItem(klucz)) return;

    void (async () => {
      try {
        const res = await fetch(`/api/rynek/${listingId}/wyswietlenie`, { method: "POST" });
        if (res.ok) {
          sessionStorage.setItem(klucz, "1");
          ustawLiczbe((n) => n + 1);
        }
      } catch {
        /* ignoruj */
      }
    })();
  }, [listingId]);

  const tekst = formatujLiczbeWyswietlen(liczba);
  if (!tekst) return null;

  return (
    <span className="inline-flex items-center gap-1 text-stone-500" title="Liczba odsłon ogłoszenia">
      <span aria-hidden>👁</span>
      {tekst}
    </span>
  );
}
