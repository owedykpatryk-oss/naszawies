"use client";

import { useEffect, useState } from "react";
import { LazyWidoczny } from "@/components/ui/lazy-widoczny";
import {
  WiesTransportWidget,
  type TransportDaneWsi,
} from "@/components/wies/wies-transport-widget";

type StanLadowania = "laduje" | "ok" | "blad";

function TransportTresc({ sciezkaWsi, villageId }: { sciezkaWsi: string; villageId: string }) {
  const [stan, setStan] = useState<StanLadowania>("laduje");
  const [dane, setDane] = useState<TransportDaneWsi | null>(null);

  useEffect(() => {
    let anuluj = false;
    setStan("laduje");
    void (async () => {
      try {
        const res = await fetch(`/api/wies/${villageId}/transport`);
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
    })();
    return () => {
      anuluj = true;
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
        sciezkaWsi={sciezkaWsi}
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
      />
    );
  }

  return <WiesTransportWidget sciezkaWsi={sciezkaWsi} {...dane} />;
}

export function WiesTransportLazy({ sciezkaWsi, villageId }: { sciezkaWsi: string; villageId: string }) {
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
      <TransportTresc sciezkaWsi={sciezkaWsi} villageId={villageId} />
    </LazyWidoczny>
  );
}
