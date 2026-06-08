import Link from "next/link";
import { linkChroniony } from "@/lib/auth/sciezki-chronione";
import type { OstrzezenieLowieckie } from "@/lib/lowiectwo/pobierz-ostrzezenia-publiczne";
import { OstrzezeniaLowieckieWsi } from "@/components/wies/ostrzezenia-lowieckie-wsi";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import type { WiesPubliczna } from "@/lib/wies/znajdz-wies-po-sciezce";

export function StronaLowiectwaWsi({
  wies,
  ostrzezenia,
  maProfilKola = false,
  zalogowany = false,
}: {
  wies: WiesPubliczna;
  ostrzezenia: OstrzezenieLowieckie[];
  maProfilKola?: boolean;
  zalogowany?: boolean;
}) {
  const sciezka = sciezkaProfiluWsi(wies);

  return (
    <main className="mx-auto min-w-0 w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12 text-stone-800">
      <nav className="text-sm text-stone-600" aria-label="Okruszki">
        <Link href={sciezka} className="hover:text-amber-900">
          {wies.name}
        </Link>
        <span className="mx-2 text-stone-400">/</span>
        <span className="text-stone-900">Łowiectwo</span>
      </nav>

      <header className="mt-6">
        <p className="text-xs font-bold uppercase tracking-wide text-amber-800">Polowania · bezpieczeństwo</p>
        <h1 className="mt-1 font-serif text-3xl text-amber-950 sm:text-4xl">Łowiectwo — {wies.name}</h1>
        <p className="mt-3 max-w-2xl text-sm text-stone-600">
          Bieżące ostrzeżenia o polowaniach dla mieszkańców i turystów. Obszary i terminy widać też na mapie publicznej.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={linkChroniony("/mapa", zalogowany, "?warstwa=lowiectwo&polowania=1")}
            className="rounded-full border border-amber-700/30 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-950 hover:bg-amber-100"
          >
            🗺️ Mapa — warstwa łowiectwa
          </Link>
          <Link
            href={`${sciezka}/lesnictwo`}
            className="rounded-full border border-emerald-700/30 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-100"
          >
            🌲 Leśnictwo i las
          </Link>
          <Link href={sciezka} className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50">
            ← Profil wsi
          </Link>
        </div>
      </header>

      {ostrzezenia.length > 0 ? (
        <div className="mt-8">
          <OstrzezeniaLowieckieWsi
            ostrzezenia={ostrzezenia}
            nazwaWsi={wies.name}
            maProfilKola={maProfilKola}
            zalogowany={zalogowany}
          />
        </div>
      ) : null}

      <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/40 p-5 sm:p-6">
        <h2 className="font-serif text-lg text-amber-950">Bezpieczeństwo w terenie</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-stone-700">
          <li>Unikaj oznaczonych obszarów polowania w podanym czasie.</li>
          <li>Na mapie: czerwony obrys = polowanie trwa, pomarańczowy = zaplanowane.</li>
          <li>W razie wątpliwości skontaktuj się z kołem łowieckim lub sołtysem.</li>
        </ul>
        {maProfilKola ? (
          <p className="mt-4">
            <Link href={`${sciezka}#mysliwi`} className="text-sm font-medium text-amber-900 underline">
              Profile kół łowieckich na stronie wsi →
            </Link>
          </p>
        ) : null}
      </section>

      {ostrzezenia.some((o) => o.maObszarMapy) ? (
        <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
          <h2 className="font-serif text-lg text-stone-900">Obszary na mapie</h2>
          <p className="mt-2 text-sm text-stone-600">
            Aktywne polowania z zaznaczonym obszarem są widoczne na mapie katalogu wsi.
          </p>
          <Link
            href={linkChroniony("/mapa", zalogowany, "?warstwa=lowiectwo&polowania=1")}
            className="mt-4 inline-flex rounded-full border border-amber-700/40 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-950 hover:bg-amber-100"
          >
            Otwórz mapę z polowaniami →
          </Link>
        </section>
      ) : null}
    </main>
  );
}
