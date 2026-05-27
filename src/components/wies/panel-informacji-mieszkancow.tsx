import Link from "next/link";
import type { WiesPubliczna } from "@/lib/wies/znajdz-wies-po-sciezce";
import { sciezkaGminy, sciezkaPowiatu, sciezkaWojewodztwa } from "@/lib/wies/sciezka-publiczna";
import { SkrotyKotwicaWies } from "@/components/wies/skroty-kotwica-wies";
import type { LinkPrzydatnyPubliczny } from "@/lib/wies/linki-przydatne";
import { SekcjaLinkiPrzydatne } from "@/components/wies/sekcja-linki-przydatne";

type Props = {
  wies: WiesPubliczna;
  linkiPrzydatne: LinkPrzydatnyPubliczny[];
  maPrzewodnik: boolean;
  maKontakty: boolean;
  maWiadomosci: boolean;
  maSwietlice: boolean;
  maRynek: boolean;
  maDotacje: boolean;
  maTransport: boolean;
};

const SKROTY = [
  { href: "#sekcja-linki-przydatne", label: "Linki i kontakty", warunek: (p: Props) => p.linkiPrzydatne.length > 0 },
  { href: "#sekcja-przewodnik-samorzadowy", label: "Gmina i urząd", warunek: (p: Props) => p.maPrzewodnik },
  { href: "#kontakty-urzedowe-wsi", label: "Kontakty we wsi", warunek: (p: Props) => p.maKontakty },
  { href: "#sekcja-transport", label: "Transport", warunek: (p: Props) => p.maTransport },
  { href: "#sekcja-rynek-lokalny", label: "Rynek lokalny", warunek: (p: Props) => p.maRynek },
  { href: "#sekcja-dotacje", label: "Dotacje", warunek: (p: Props) => p.maDotacje },
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
  maRynek,
  maDotacje,
  maTransport,
}: Props) {
  const props = {
    wies,
    linkiPrzydatne,
    maPrzewodnik,
    maKontakty,
    maWiadomosci,
    maSwietlice,
    maRynek,
    maDotacje,
    maTransport,
  };
  const widoczneSkroty = SKROTY.filter((s) => s.warunek(props));

  return (
    <section id="informacje-mieszkancow" className="mt-8 scroll-mt-6">
      <div className="panel-informacji-hero wow-wejscie overflow-hidden">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-400/10 blur-2xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-6 left-1/4 h-24 w-40 rounded-full bg-amber-300/10 blur-2xl" aria-hidden />
        <div className="relative z-[1]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-50">
              Dla mieszkańców
            </span>
            {linkiPrzydatne.length > 0 ? (
              <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-medium text-stone-600 ring-1 ring-stone-200/80">
                {linkiPrzydatne.length} linków
              </span>
            ) : null}
          </div>
          <h2 className="mt-3 font-serif text-2xl text-green-950 sm:text-3xl">Informacje dla mieszkańców</h2>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-stone-600">
            Urząd gminy, media lokalne, kontakty we wsi i aktualności — w jednym miejscu na profilu {wies.name}.
          </p>

          {widoczneSkroty.length > 0 ? (
            <>
              <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-stone-500">Przejdź do sekcji</p>
              <SkrotyKotwicaWies skroty={widoczneSkroty.map((s) => ({ href: s.href, label: s.label }))} />
            </>
          ) : null}

          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            <Link
              href={sciezkaGminy(wies)}
              className="karta-wow rounded-xl border border-white/90 bg-white/95 px-3 py-2.5 shadow-sm ring-1 ring-emerald-900/5"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">Gmina</p>
              <p className="mt-0.5 text-sm font-semibold text-green-900">{wies.commune}</p>
            </Link>
            <Link
              href={sciezkaPowiatu(wies)}
              className="karta-wow rounded-xl border border-white/90 bg-white/95 px-3 py-2.5 shadow-sm ring-1 ring-emerald-900/5"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">Powiat</p>
              <p className="mt-0.5 text-sm font-semibold text-green-900">{wies.county}</p>
            </Link>
            <Link
              href={sciezkaWojewodztwa(wies.voivodeship)}
              className="karta-wow rounded-xl border border-white/90 bg-white/95 px-3 py-2.5 shadow-sm ring-1 ring-emerald-900/5"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">Województwo</p>
              <p className="mt-0.5 text-sm font-semibold text-green-900">{wies.voivodeship}</p>
            </Link>
          </div>

          {wies.website?.trim() ? (
            <p className="mt-4 text-sm">
              <span className="text-stone-500">Strona wsi: </span>
              <a
                href={wies.website}
                className="font-semibold text-green-800 underline decoration-emerald-600/30 underline-offset-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                {wies.website}
              </a>
            </p>
          ) : null}
        </div>
      </div>

      <SekcjaLinkiPrzydatne linki={linkiPrzydatne} nazwaGminy={wies.commune} />
    </section>
  );
}
