"use client";

import { useEffect, useState } from "react";
import { LazyWidoczny } from "@/components/ui/lazy-widoczny";
import { SwietliceWsiPubliczneSekcja } from "@/components/swietlica/swietlice-wsi-publiczne-sekcja";
import {
  KalendarzZajetosciWsiSekcja,
  type WierszKalendarzaPublicznego,
} from "@/components/swietlica/kalendarz-zajetosci-publiczny";
import type { SalaPublicznaWsi } from "@/lib/swietlica/pobierz-sale-publiczne-wsi";

type SwietliceDane = {
  sale: SalaPublicznaWsi[];
  kalendarz: WierszKalendarzaPublicznego[];
};

function SwietliceTresc({
  nazwaWsi,
  villageId,
  isActive,
  zalogowany,
}: {
  nazwaWsi: string;
  villageId: string;
  isActive: boolean;
  zalogowany: boolean;
}) {
  const [dane, setDane] = useState<SwietliceDane | null>(null);

  useEffect(() => {
    if (!isActive) return;
    let anuluj = false;
    void (async () => {
      try {
        const res = await fetch(`/api/wies/${villageId}/swietlice`);
        if (!res.ok || anuluj) return;
        setDane((await res.json()) as SwietliceDane);
      } catch {
        setDane({ sale: [], kalendarz: [] });
      }
    })();
    return () => {
      anuluj = true;
    };
  }, [isActive, villageId]);

  if (!isActive) return null;

  if (!dane) {
    return (
      <section className="sekcja-poza-foldem mt-10 h-40 animate-pulse rounded-2xl bg-stone-100" aria-hidden />
    );
  }

  return (
    <>
      <KalendarzZajetosciWsiSekcja wies={{ name: nazwaWsi }} wiersze={dane.kalendarz} />
      {dane.sale.length > 0 ? (
        <SwietliceWsiPubliczneSekcja nazwaWsi={nazwaWsi} sale={dane.sale} zalogowany={zalogowany} />
      ) : null}
    </>
  );
}

export function SwietliceWsiLazy({
  nazwaWsi,
  villageId,
  isActive,
  zalogowany = false,
}: {
  nazwaWsi: string;
  villageId: string;
  isActive: boolean;
  zalogowany?: boolean;
}) {
  if (!isActive) return null;

  return (
    <LazyWidoczny
      placeholder={
        <section className="sekcja-poza-foldem mt-10 h-40 animate-pulse rounded-2xl bg-stone-100" aria-hidden />
      }
    >
      <SwietliceTresc
        nazwaWsi={nazwaWsi}
        villageId={villageId}
        isActive={isActive}
        zalogowany={zalogowany}
      />
    </LazyWidoczny>
  );
}
