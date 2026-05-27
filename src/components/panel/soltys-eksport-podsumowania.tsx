"use client";

import { useMemo } from "react";
import type { LicznikiOczekujacychSoltysa } from "@/lib/panel/liczniki-oczekujacych-soltysa";
import { zbudujHtmlRaportuSoltysa, type WierszRaportuKolejki } from "@/lib/panel/html-raport-soltysa";
import { EksportHtmlPdfKlient } from "./eksport-html-pdf-klient";

const ETYKIETY_TYP: Record<string, string> = {
  wniosek: "Wniosek o rolę",
  post: "Post",
  rynek: "Rynek",
  pomoc: "Pomoc",
  zgloszenie: "Zgłoszenie",
  zdjecie: "Zdjęcie",
};

export function SoltysEksportPodsumowania({
  liczniki,
  kolejka,
  nazwyWsi = [],
}: {
  liczniki: LicznikiOczekujacychSoltysa;
  kolejka: { typ: string; tytul: string; wies: string; data: string }[];
  nazwyWsi?: string[];
}) {
  const html = useMemo(() => {
    const data = new Date().toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const wiersze: WierszRaportuKolejki[] = kolejka.map((p) => ({
      typ: ETYKIETY_TYP[p.typ] ?? p.typ,
      tytul: p.tytul,
      wies: p.wies,
      data: new Date(p.data).toLocaleString("pl-PL"),
    }));
    return zbudujHtmlRaportuSoltysa({ data, liczniki, kolejka: wiersze, nazwyWsi });
  }, [liczniki, kolejka, nazwyWsi]);

  const nazwaPliku = `podsumowanie-soltys-${new Date().toISOString().slice(0, 10)}`;

  return (
    <EksportHtmlPdfKlient
      html={html}
      nazwaPliku={nazwaPliku}
      etykietaPrzycisku="PDF — podsumowanie pracy"
    />
  );
}
