import type { Metadata } from "next";
import Link from "next/link";
import { RynekHubJsonLd } from "@/components/wies/rynek-hub-json-ld";
import { RynekHubWyszukiwarka } from "@/components/wies/rynek-hub-wyszukiwarka";
import { RynekPrzewagiPasek } from "@/components/wies/rynek-przewagi-pasek";
import { NaglowekStronyRynku } from "@/components/wies/rynek-ui";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import { pobierzHubRynku } from "@/lib/marketplace/pobierz-hub-rynku";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Rynek lokalny — miód, sery, działki i usługi we wsiach",
  description:
    "Darmowy rynek lokalny naszawies.pl: produkty z gospodarstw, maszyny rolnicze, działki z mapą Geoportalu. Bez prowizji — kontakt między sąsiadami, zatwierdzane przez sołtysa.",
  alternates: { canonical: "/rynek" },
  openGraph: {
    title: "Rynek lokalny we wsiach — naszawies.pl",
    description: "Hyperlokalne ogłoszenia: miód, sery, warzywa, działki, usługi. 0 zł dla mieszkańców wsi.",
    url: "https://naszawies.pl/rynek",
    type: "website",
  },
};

export default async function RynekHubPage() {
  const supabase = createPublicSupabaseClient();
  const hub =
    supabase != null
      ? await pobierzHubRynku(supabase)
      : { wsie: [], ostatnie: [], lacznieOgloszen: 0, lacznieWsi: 0 };

  return (
    <>
      <RynekHubJsonLd hub={hub} />
      <main className="page-shell py-10 sm:py-14">
        <p className="mb-4 text-sm text-stone-500">
          <Link href="/" className="text-green-800 underline">
            ← Strona główna
          </Link>
          {" · "}
          <Link href="/szukaj" className="text-green-800 underline">
            Szukaj wsi
          </Link>
          {" · "}
          <Link href="/mapa" className="text-green-800 underline">
            Mapa
          </Link>
        </p>

        <NaglowekStronyRynku
          tytul="Rynek lokalny we wsiach"
          opis="Hyperlokalne ogłoszenia zatwierdzane przez sołtysa: miód i nabiał z gospodarstw, maszyny rolnicze, działki z Geoportalem, usługi sąsiadów. Bez prowizji — rozliczacie się między sobą (czat, telefon, WhatsApp)."
          liczbaOgloszen={hub.lacznieOgloszen}
          liczbaProfili={hub.lacznieWsi}
        />
        <RynekPrzewagiPasek />

        <section className="mt-10">
          <h2 className="font-serif text-xl text-green-950">Wybierz wieś</h2>
          <p className="mt-1 text-sm text-stone-600">
            Każda wieś ma własny rynek — jak tablica ogłoszeń, tylko z mapą, czatem i powiadomieniami o nowym miodzie czy
            serniku.
          </p>
          <div className="mt-4">
            <RynekHubWyszukiwarka wsie={hub.wsie} />
          </div>
        </section>

        {hub.ostatnie.length > 0 ? (
          <section className="mt-10 rounded-2xl border border-orange-200/70 bg-orange-50/30 p-5 sm:p-6">
            <h2 className="font-serif text-xl text-green-950">Ostatnio na rynkach</h2>
            <ul className="mt-3 divide-y divide-orange-200/50">
              {hub.ostatnie.map((o) => (
                <li key={o.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5">
                  <Link href={o.sciezka} className="font-medium text-green-900 hover:underline">
                    {o.title}
                  </Link>
                  <span className="text-xs text-stone-600">
                    {o.nazwaWsi} · {o.gmina}
                    {o.published_at
                      ? ` · ${new Date(o.published_at).toLocaleDateString("pl-PL")}`
                      : null}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-green-200/80 bg-green-50/40 p-5">
            <h2 className="font-serif text-lg text-green-950">Masz coś do sprzedania?</h2>
            <p className="mt-2 text-sm text-stone-700">
              Zaloguj się, wybierz wieś i dodaj ogłoszenie — sołtys je zatwierdzi. Na kiermaszu KGW użyj pakietu 20
              produktów jednym kliknięciem.
            </p>
            <Link
              href="/logowanie?next=/panel/mieszkaniec/marketplace"
              className="mt-4 inline-block rounded-lg bg-green-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-900"
            >
              Dodaj ogłoszenie →
            </Link>
          </div>
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-5">
            <h2 className="font-serif text-lg text-green-950">Jesteś sołtysem?</h2>
            <p className="mt-2 text-sm text-stone-700">
              Udostępnij link do rynku wsi na Facebooku:{" "}
              <code className="rounded bg-white/80 px-1 text-xs">twoja-wies/rynek</code>. Ustaw banner sezonowy w panelu
              Moja wieś.
            </p>
            <Link href="/panel/soltys" className="mt-4 inline-block text-sm font-semibold text-green-800 underline">
              Panel sołtysa →
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
