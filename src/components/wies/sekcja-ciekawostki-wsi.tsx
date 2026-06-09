import Link from "next/link";
import { OslonaSekcjiWies } from "@/components/wies/oslona-sekcji-wies";
import { TytulSekcjiWies } from "@/components/wies/tytul-sekcji-wies";
import { WyswietlTrescBogata } from "@/components/ui/tresc-bogata";
import { UjawnijPoPrzewinieciu } from "@/components/ui/ujawnij-po-przewinieciu";
import type { CiekawostkaMiejscaWsi } from "@/lib/wies/pobierz-ciekawostki-miejsc-wsi";

type Props = {
  ciekawostkiWsi: string | null;
  miejsca: CiekawostkaMiejscaWsi[];
  nazwaWsi: string;
  jestSoltys?: boolean;
};

export function SekcjaCiekawostkiWsi({ ciekawostkiWsi, miejsca, nazwaWsi, jestSoltys = false }: Props) {
  const maWsi = Boolean(ciekawostkiWsi?.trim());
  const maMiejsca = miejsca.length > 0;
  if (!maWsi && !maMiejsca) return null;

  return (
    <OslonaSekcjiWies id="sekcja-ciekawostki" className="wies-sekcja-ciekawostki">
      <UjawnijPoPrzewinieciu as="section">
        <TytulSekcjiWies
          etykieta="Ciekawostki"
          tytul={`Co warto wiedzieć o ${nazwaWsi}`}
          opis="Fakty, legendy i opowieści — od sołtysa i z profili miejsc na mapie wsi."
        />

        {maWsi ? (
          <div className="ciekawostki-wsi-hero ciekawostki-wow-hero mt-5 rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/80 via-white to-amber-50/50 p-5 shadow-sm sm:p-6">
            <p className="relative text-xs font-bold uppercase tracking-widest text-emerald-800/80">O tej miejscowości</p>
            <div className="relative mt-3">
              <span className="float-left mr-2 font-serif text-4xl leading-none text-emerald-700/70" aria-hidden>
                „
              </span>
              <WyswietlTrescBogata tresc={ciekawostkiWsi!} />
            </div>
          </div>
        ) : null}

        {maMiejsca ? (
          <ul className={`grid gap-3 ${maWsi ? "mt-4" : "mt-5"} sm:grid-cols-2`}>
            {miejsca.map((m, i) => (
              <UjawnijPoPrzewinieciu key={m.id} as="li" opoznienieMs={i * 70}>
                <div className="ciekawostka-karta karta-wow h-full rounded-xl border border-stone-200/90 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-800/90">{m.kategoria ?? "Miejsce"}</p>
                  <p className="mt-1 font-medium text-green-950">{m.nazwa}</p>
                  <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm leading-relaxed text-stone-600">{m.tekst}</p>
                  {m.sciezkaMapy ? (
                    <Link href={m.sciezkaMapy} className="mt-3 inline-flex text-xs font-semibold text-green-800 underline">
                      Zobacz na mapie →
                    </Link>
                  ) : null}
                </div>
              </UjawnijPoPrzewinieciu>
            ))}
          </ul>
        ) : null}

        {jestSoltys ? (
          <p className="mt-4 text-xs text-stone-500">
            Edytuj ciekawostki wsi w{" "}
            <Link href="/panel/soltys/moja-wies" className="text-green-800 underline">
              panelu → Wygląd strony
            </Link>
            ; miejsca na mapie — w edytorze POI.
          </p>
        ) : null}
      </UjawnijPoPrzewinieciu>
    </OslonaSekcjiWies>
  );
}
