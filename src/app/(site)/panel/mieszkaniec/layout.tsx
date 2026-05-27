import Link from "next/link";
import {
  NawigacjaPaneluGrupowana,
  type GrupaNawigacjiPanelu,
} from "@/components/panel/nawigacja-panelu-grupowana";

const GRUPY: GrupaNawigacjiPanelu[] = [
  {
    id: "start",
    tytul: "Start",
    linki: [{ href: "/panel/mieszkaniec", label: "Przegląd" }],
  },
  {
    id: "codzienne",
    tytul: "Na co dzień",
    linki: [
      { href: "/panel/mieszkaniec/ogloszenia", label: "Ogłoszenia" },
      { href: "/panel/mieszkaniec/lista-zakupow", label: "Lista zakupów" },
      { href: "/panel/mieszkaniec/swietlica", label: "Świetlica" },
      { href: "/panel/mieszkaniec/grafika", label: "Kreator grafiki", highlight: true },
    ],
  },
  {
    id: "aktywnosc",
    tytul: "Aktywność",
    linki: [
      { href: "/panel/mieszkaniec/zgloszenia", label: "Zgłoszenia" },
      { href: "/panel/mieszkaniec/fotokronika", label: "Fotokronika" },
      { href: "/panel/mieszkaniec/pomoc", label: "Pomoc" },
      { href: "/pomoc?rola=mieszkaniec", label: "Centrum pomocy" },
    ],
  },
];

export default function MieszkaniecLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="no-print mb-4 rounded-xl border border-sky-200/80 bg-sky-50/40 px-3 py-2 text-xs text-stone-700">
        <span className="font-semibold text-sky-900">Podpowiedź:</span>{" "}
        <Link href="/panel/mieszkaniec/grafika" className="font-medium text-green-800 underline">
          zaproszenie na imprezę
        </Link>
        , potem{" "}
        <Link href="/panel/mieszkaniec/ogloszenia" className="text-green-800 underline">
          ogłoszenia
        </Link>{" "}
        i{" "}
        <Link href="/panel/powiadomienia" className="text-green-800 underline">
          powiadomienia
        </Link>
        .
      </div>
      <NawigacjaPaneluGrupowana grupy={GRUPY} ariaLabel="Panel mieszkańca" />
      {children}
    </div>
  );
}
