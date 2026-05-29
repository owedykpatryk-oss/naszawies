"use client";

import { useEffect, useState } from "react";
import { LazyWidoczny } from "@/components/ui/lazy-widoczny";
import {
  WiesTransportWidget,
  type TransportDaneWsi,
} from "@/components/wies/wies-transport-widget";

type StanLadowania = "laduje" | "ok" | "blad";

function TransportTresc({ villageId, zalogowany }: { villageId: string; zalogowany: boolean }) {
  const [stan, setStan] = useState<StanLadowania>("laduje");
  const [dane, setDane] = useState<TransportDaneWsi | null>(null);

  useEffect(() => {
    let anuluj = false;

    async function pobierz() {
      try {
        const res = await fetch(`/api/wies/${villageId}/transport`, { credentials: "include" });
        if (anuluj) return;
        if (!res.ok) {
          setStan("blad");
          return;
        }
        setDane((await res.json()) as TransportDaneWsi);
        setStan("ok");
      } catch {
        if (!anuluj) setStan("blad");
      }
    }

    setStan("laduje");
    void pobierz();

    const coMs = 90_000;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void pobierz();
    }, coMs);

    return () => {
      anuluj = true;
      window.clearInterval(timer);
    };
  }, [villageId]);

  if (stan === "laduje") {
    return (
      <section
        id="sekcja-transport"
        className="sekcja-poza-foldem mt-10 h-36 animate-pulse rounded-2xl bg-stone-100"
        aria-busy="true"
        aria-label="Ładowanie transportu"
      />
    );
  }

  if (stan === "blad" || !dane) {
    return (
      <WiesTransportWidget
        status={null}
        odjazdy={[]}
        przystanki={[]}
        stacjeKolejowe={[]}
        stacjePkp={[]}
        linkiZewnetrzne={[]}
        wies={{ name: "Wieś" }}
        maKolej={false}
        maAutobus={false}
        bladLadowania={stan === "blad"}
        zalogowany={zalogowany}
      />
    );
  }

  return <WiesTransportWidget {...dane} zalogowany={zalogowany} />;
}

export function WiesTransportLazy({ villageId, zalogowany = false }: { villageId: string; zalogowany?: boolean }) {
  return (
    <LazyWidoczny
      placeholder={
        <section
          id="sekcja-transport"
          className="sekcja-poza-foldem mt-10 h-36 animate-pulse rounded-2xl bg-stone-100"
          aria-hidden
        />
      }
    >
      <TransportTresc villageId={villageId} zalogowany={zalogowany} />
    </LazyWidoczny>
  );
}
