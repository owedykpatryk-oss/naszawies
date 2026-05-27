"use client";

import { useEffect, useState } from "react";
import { LazyWidoczny } from "@/components/ui/lazy-widoczny";
import {
  WiesTransportWidget,
  type TransportOdjazdPubliczny,
} from "@/components/wies/wies-transport-widget";

type TransportDane = {
  status: {
    status_color: string;
    status_label: string;
    delayed_count: number;
    cancelled_count: number;
    fallback_mode: boolean;
    updated_at: string;
  } | null;
  odjazdy: TransportOdjazdPubliczny[];
};

function TransportTresc({ sciezkaWsi, villageId }: { sciezkaWsi: string; villageId: string }) {
  const [dane, setDane] = useState<TransportDane | null>(null);

  useEffect(() => {
    let anuluj = false;
    void (async () => {
      try {
        const res = await fetch(`/api/wies/${villageId}/transport`);
        if (!res.ok || anuluj) return;
        setDane((await res.json()) as TransportDane);
      } catch {
        /* brak transportu — widget zwróci null */
      }
    })();
    return () => {
      anuluj = true;
    };
  }, [villageId]);

  if (!dane) {
    return (
      <section id="sekcja-transport" className="sekcja-poza-foldem mt-10 h-32 animate-pulse rounded-2xl bg-stone-100" aria-hidden />
    );
  }

  return (
    <WiesTransportWidget sciezkaWsi={sciezkaWsi} status={dane.status} odjazdy={dane.odjazdy} />
  );
}

export function WiesTransportLazy({ sciezkaWsi, villageId }: { sciezkaWsi: string; villageId: string }) {
  return (
    <LazyWidoczny
      placeholder={
        <section id="sekcja-transport" className="sekcja-poza-foldem mt-10 h-36 animate-pulse rounded-2xl bg-stone-100" aria-hidden />
      }
    >
      <TransportTresc sciezkaWsi={sciezkaWsi} villageId={villageId} />
    </LazyWidoczny>
  );
}
