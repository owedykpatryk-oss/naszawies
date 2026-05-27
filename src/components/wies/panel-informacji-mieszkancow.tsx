import Link from "next/link";
import type { WiesPubliczna } from "@/lib/wies/znajdz-wies-po-sciezce";
import { sciezkaGminy, sciezkaPowiatu, sciezkaWojewodztwa } from "@/lib/wies/sciezka-publiczna";
import { SekcjaLinkiPrzydatne } from "@/components/wies/sekcja-linki-przydatne";
import type { LinkPrzydatnyPubliczny } from "@/lib/wies/linki-przydatne";

type Props = {
  wies: WiesPubliczna;
  linkiPrzydatne: LinkPrzydatnyPubliczny[];
  maPrzewodnik: boolean;
  maKontakty: boolean;
  maWiadomosci: boolean;
  maSwietlice: boolean;
};

const SKROTY = [
  { href: "#sekcja-linki-przydatne", label: "Linki i kontakty", warunek: (p: Props) => p.linkiPrzydatne.length > 0 },
  { href: "#sekcja-przewodnik-samorzadowy", label: "Gmina i urząd", warunek: (p: Props) => p.maPrzewodnik },
  { href: "#kontakty-urzedowe-wsi", label: "Kontakty we wsi", warunek: (p: Props) => p.maKontakty },
  { href: "#sekcja-wiadomosci-lokalne", label: "Wiadomości", warunek: (p: Props) => p.maWiadomosci },
  { href: "#swietlice-wsi", label: "Świetlica", warunek: (p: Props) => p.maSwietlice },
  { href: "#sekcja-aktualnosci-laczone", label: "Aktualności", warunek: () => true },
] as const;

export function PanelInformacjiMieszkancow({
  wies,
  linkiPrzydatne,
  maPrzewodnik,
  maKontakty,
  maWiadomosci,
  maSwietlice,
}: Props) {
  const props = { wies, linkiPrzydatne, maPrzewodnik, maKontakty, maWiadomosci, maSwietlice };
  const widoczneSkroty = SKROTY.filter((s) => s.warunek(props));

  return (
    <section id="informacje-mieszkancow" className="mt-8 scroll-mt-6">
      <div className="rounded-2xl border border-green-900/15 bg-gradient-to-br from-[#f5f9f0] via-white to-[#faf8f3] p-5 shadow-sm sm:p-6">
        <h2 className="font-serif text-xl text-green-950 sm:text-2xl">Informacje dla mieszkańców</h2>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-stone-600">
          Skróty do urzędu gminy, mediów lokalnych, kontaktów we wsi i aktualności. Większość treści uzupełnia sołtys —
          warto zaglądać przed wizytą w urzędzie lub szukaniem numeru do gazety czy radia z regionu.
        </p>

        <nav className="mt-4 flex flex-wrap gap-2" aria-label="Skróty na stronie wsi">
          {widoczneSkroty.map((s) => (
            <a
              key={s.href}
              href={s.href}
              className="rounded-full border border-green-800/25 bg-white px-3 py-1.5 text-xs font-medium text-green-900 hover:bg-green-50"
            >
              {s.label}
            </a>
          ))}
        </nav>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-stone-600">
          <span className="rounded bg-white/80 px-2 py-1">
            Gmina:{" "}
            <Link href={sciezkaGminy(wies)} className="font-medium text-green-800 underline">
              {wies.commune}
            </Link>
          </span>
          <span className="rounded bg-white/80 px-2 py-1">
            Powiat:{" "}
            <Link href={sciezkaPowiatu(wies)} className="font-medium text-green-800 underline">
              {wies.county}
            </Link>
          </span>
          <span className="rounded bg-white/80 px-2 py-1">
            Woj.:{" "}
            <Link href={sciezkaWojewodztwa(wies.voivodeship)} className="font-medium text-green-800 underline">
              {wies.voivodeship}
            </Link>
          </span>
        </div>

        {wies.website?.trim() ? (
          <p className="mt-3 text-sm">
            Strona wsi:{" "}
            <a href={wies.website} className="font-medium text-green-800 underline" target="_blank" rel="noopener noreferrer">
              {wies.website}
            </a>
          </p>
        ) : null}
      </div>

      <SekcjaLinkiPrzydatne linki={linkiPrzydatne} nazwaGminy={wies.commune} />
    </section>
  );
}
