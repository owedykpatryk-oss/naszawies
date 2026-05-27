import Link from "next/link";
import {
  NawigacjaPaneluGrupowana,
  type GrupaNawigacjiPanelu,
} from "@/components/panel/nawigacja-panelu-grupowana";

const GRUPY: GrupaNawigacjiPanelu[] = [
  {
    id: "start",
    tytul: "Start",
    linki: [{ href: "/panel/soltys", label: "Przegląd" }],
  },
  {
    id: "promocja",
    tytul: "Wieś i promocja",
    linki: [
      { href: "/panel/soltys/moja-wies", label: "Profil wsi" },
      { href: "/panel/soltys/grafika", label: "Kreator grafiki", highlight: true },
      { href: "/panel/soltys/fotokronika", label: "Fotokronika" },
    ],
  },
  {
    id: "spolecznosc",
    tytul: "Społeczność",
    linki: [
      { href: "/panel/soltys/spolecznosc", label: "Społeczność i WOW" },
      { href: "/panel/soltys/wiadomosci-lokalne", label: "Wiadomości lokalne" },
      { href: "/panel/soltys/kanaly-rss", label: "Kanały RSS" },
    ],
  },
  {
    id: "organizacja",
    tytul: "Organizacja",
    linki: [
      { href: "/panel/soltys/rezerwacje", label: "Rezerwacje sal" },
      { href: "/panel/soltys/swietlica", label: "Świetlica" },
      { href: "/panel/soltys/dokumenty", label: "Generator dokumentów" },
    ],
  },
  {
    id: "admin",
    tytul: "Administracja",
    linki: [
      { href: "/panel/soltys/zgloszenia", label: "Zgłoszenia" },
      { href: "/panel/soltys/samorzad", label: "Przewodnik samorządowy" },
      { href: "/panel/soltys/informacje-lokalne", label: "Informacje dla mieszkańców" },
      { href: "/panel/soltys/pomoc", label: "Pomoc krok po kroku" },
    ],
  },
];

export default function SoltysLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="no-print mb-4 rounded-xl border border-emerald-200/80 bg-emerald-50/40 px-3 py-2 text-xs text-stone-700">
        <span className="font-semibold text-emerald-900">Szybki rytm pracy:</span>{" "}
        <Link href="/panel/soltys/grafika" className="font-medium text-green-800 underline">
          plakat w 3 zakładkach
        </Link>
        , potem{" "}
        <Link href="/panel/soltys/wiadomosci-lokalne" className="text-green-800 underline">
          wiadomości
        </Link>
        ,{" "}
        <Link href="/panel/soltys/rezerwacje" className="text-green-800 underline">
          rezerwacje
        </Link>
        . Tryb społeczności:{" "}
        <Link href="/panel/soltys/spolecznosc?tryb=ogolny" className="text-green-800 underline">
          ogólny
        </Link>
        {" / "}
        <Link href="/panel/soltys/spolecznosc?tryb=kgw" className="text-green-800 underline">
          KGW
        </Link>
        {" / "}
        <Link href="/panel/soltys/spolecznosc?tryb=osp" className="text-green-800 underline">
          OSP
        </Link>
      </div>
      <NawigacjaPaneluGrupowana grupy={GRUPY} ariaLabel="Panel sołtysa" />
      {children}
    </div>
  );
}
