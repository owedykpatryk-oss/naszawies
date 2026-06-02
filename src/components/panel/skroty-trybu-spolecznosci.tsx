"use client";

import Link from "next/link";
import type { TrybOrganizacji } from "@/app/(site)/panel/soltys/spolecznosc/tryby-pracy";
import { klasaPillNawigacji } from "@/lib/panel/klasy-nawigacji-pill";

type Skrot =
  | { typ: "sekcja"; label: string; sekcja: string }
  | { typ: "link"; label: string; href: string };

const SKROTY_WEDLUG_TRYBU: Record<TrybOrganizacji, Skrot[]> = {
  ogolny: [],
  parafia: [
    { typ: "sekcja", label: "Profil parafii", sekcja: "organizacje" },
    { typ: "sekcja", label: "Wydarzenia", sekcja: "wydarzenia" },
    { typ: "sekcja", label: "Grupy tygodnia", sekcja: "harmonogram" },
  ],
  kgw: [
    { typ: "sekcja", label: "Profil KGW", sekcja: "organizacje" },
    { typ: "sekcja", label: "Plan spotkań", sekcja: "harmonogram" },
    { typ: "sekcja", label: "Dotacje", sekcja: "dotacje" },
  ],
  osp: [
    { typ: "sekcja", label: "Profil OSP", sekcja: "organizacje" },
    { typ: "sekcja", label: "Ćwiczenia / wydarzenia", sekcja: "wydarzenia" },
    { typ: "sekcja", label: "Komunikat", sekcja: "wiadomosci" },
  ],
  mysliwi: [
    { typ: "sekcja", label: "Profil koła", sekcja: "organizacje" },
    { typ: "link", label: "Polowania", href: "/panel/soltys/lowiectwo" },
    { typ: "link", label: "Kalendarz łowiecki", href: "/panel/soltys/lowiectwo/kalendarz" },
    { typ: "sekcja", label: "Wydarzenia", sekcja: "wydarzenia" },
  ],
  szkola: [
    { typ: "sekcja", label: "Profil placówki", sekcja: "organizacje" },
    { typ: "link", label: "Tablica szkoły", href: "/panel/soltys/spolecznosc?tryb=szkola" },
    { typ: "link", label: "Wygląd profilu wsi", href: "/panel/soltys/moja-wies" },
  ],
  sport: [
    { typ: "sekcja", label: "Profil klubu", sekcja: "organizacje" },
    { typ: "sekcja", label: "Plan tygodnia", sekcja: "harmonogram" },
    { typ: "sekcja", label: "Mecze / zawody", sekcja: "wydarzenia" },
  ],
};

type Props = {
  tryb: TrybOrganizacji;
  onSekcja: (id: string) => void;
};

export function SkrotyTrybuSpolecznosci({ tryb, onSekcja }: Props) {
  const skroty = SKROTY_WEDLUG_TRYBU[tryb];
  if (skroty.length === 0) return null;

  return (
    <div className="panel-nawigacja-szklo flex flex-wrap items-center gap-2 p-2">
      <span className="w-full px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-800/70 sm:w-auto">
        Skróty trybu
      </span>
      {skroty.map((s) =>
        s.typ === "link" ? (
          <Link key={s.href} href={s.href} className={klasaPillNawigacji(false, true)}>
            {s.label}
          </Link>
        ) : (
          <button
            key={s.sekcja + s.label}
            type="button"
            onClick={() => onSekcja(s.sekcja)}
            className={klasaPillNawigacji(false, true)}
          >
            {s.label}
          </button>
        ),
      )}
    </div>
  );
}
