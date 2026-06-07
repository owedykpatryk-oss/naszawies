import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { HeroModuluPublicznego } from "@/components/wspolne/hero-modulu-publicznego";
import { BlogBreadcrumbs } from "@/components/blog/blog-breadcrumbs";
import { BlogKartaArtykulu } from "@/components/blog/blog-karta-artykulu";
import { BlogJsonLd } from "@/components/blog/blog-json-ld";
import { BlogWyszukiwarka } from "@/components/blog/blog-wyszukiwarka";
import { BlogCtaStopka } from "@/components/blog/blog-cta-stopka";
import { BlogPaginacja } from "@/components/blog/blog-paginacja";
import { BlogSidebar } from "@/components/blog/blog-sidebar";
import {
  pobierzKategorieBlog,
  pobierzOpublikowaneArtykuly,
  szukajArtykulowBlog,
} from "@/lib/blog/wczytaj-tresci";
import { createSeoMeta } from "@/lib/seo/create-seo-meta";
import { generateBreadcrumbsBlog } from "@/lib/seo/generate-breadcrumbs";

export const revalidate = 3600;

const NA_STRONE = 9;

type Props = {
  searchParams: { q?: string; strona?: string };
};

export function generateMetadata({ searchParams }: Props): Metadata {
  const zapytanie = searchParams.q?.trim();
  const strona = Math.max(1, Number.parseInt(searchParams.strona ?? "1", 10) || 1);

  if (zapytanie) {
    return createSeoMeta({
      tytul: `Szukaj: ${zapytanie}`,
      opis: `Wyniki wyszukiwania na blogu naszawies.pl dla zapytania „${zapytanie}".`,
      sciezka: `/blog?q=${encodeURIComponent(zapytanie)}`,
      bezIndeksowania: true,
    });
  }

  const sciezka = strona > 1 ? `/blog?strona=${strona}` : "/blog";

  return createSeoMeta({
    tytul: "Blog — poradniki o życiu na wsi i narzędziach naszawies.pl",
    opis:
      "Artykuły po polsku dla sołtysów i mieszkańców: profil wsi, świetlica, rynek lokalny, cyfryzacja sołectwa i katalog miejscowości.",
    sciezka,
  });
}

export default function StronaBlog({ searchParams }: Props) {
  const zapytanie = searchParams.q?.trim() ?? "";
  const strona = Math.max(1, Number.parseInt(searchParams.strona ?? "1", 10) || 1);

  const wszystkie = zapytanie ? szukajArtykulowBlog(zapytanie) : pobierzOpublikowaneArtykuly();
  const featured = zapytanie ? [] : wszystkie.filter((a) => a.featured);
  const lista = zapytanie ? wszystkie : wszystkie.filter((a) => !a.featured);
  const offset = (strona - 1) * NA_STRONE;
  const stronaLista = lista.slice(offset, offset + NA_STRONE);
  const kategorie = pobierzKategorieBlog();
  const ostatnie = pobierzOpublikowaneArtykuly();

  const breadcrumbs = generateBreadcrumbsBlog([]);
  const liczbaStron = Math.max(1, Math.ceil(lista.length / NA_STRONE));

  return (
    <main className="page-shell max-w-6xl py-8 sm:py-12">
      <BlogJsonLd
        listing={{
          tytul: "Blog naszawies.pl",
          opis: "Poradniki i artykuły o cyfrowym życiu polskiej wsi.",
          sciezka: "/blog",
        }}
        breadcrumbs={breadcrumbs}
      />

      <BlogBreadcrumbs okruszki={breadcrumbs} />

      <HeroModuluPublicznego
        etykieta="Blog"
        tytul="Wiedza o wsi i narzędziach cyfrowych"
        opis="Poradniki dla sołtysów i mieszkańców — od profilu miejscowości po rynek lokalny i rezerwację świetlicy."
      />
      <p className="mt-3 text-center text-sm text-stone-600 dark:text-stone-400">
        <Link href="/blog/rss.xml" className="font-medium text-green-800 underline decoration-emerald-600/40 dark:text-green-300">
          Subskrybuj RSS
        </Link>
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_280px]">
        <div>
          <Suspense fallback={null}>
            <BlogWyszukiwarka />
          </Suspense>

          {zapytanie ? (
            <p className="mt-4 text-sm text-stone-600 dark:text-stone-400">
              Wyniki dla „<strong>{zapytanie}</strong>” ({wszystkie.length}) ·{" "}
              <Link href="/blog" className="font-medium text-green-800 underline dark:text-green-300">
                Wyczyść wyszukiwanie
              </Link>
            </p>
          ) : null}

          {!zapytanie && featured.length > 0 ? (
            <section className="mt-8" aria-label="Wyróżnione artykuły">
              <div className="grid gap-6 md:grid-cols-2">
                {featured.slice(0, 2).map((a) => (
                  <BlogKartaArtykulu key={a.slug} artykul={a} featured />
                ))}
              </div>
            </section>
          ) : null}

          {stronaLista.length === 0 ? (
            <p className="mt-8 rounded-xl border border-stone-200 bg-stone-50 px-4 py-8 text-center text-sm text-stone-600 dark:border-stone-700 dark:bg-stone-900/40 dark:text-stone-400">
              {zapytanie
                ? "Brak artykułów pasujących do wyszukiwania. Spróbuj innych słów lub przejdź do listy wszystkich wpisów."
                : "Brak artykułów do wyświetlenia."}
            </p>
          ) : (
            <section className="mt-8 grid gap-6 sm:grid-cols-2" aria-label="Lista artykułów">
              {stronaLista.map((a) => (
                <BlogKartaArtykulu key={a.slug} artykul={a} />
              ))}
            </section>
          )}

          <BlogPaginacja strona={strona} liczbaStron={liczbaStron} zapytanie={zapytanie || undefined} />

          <BlogCtaStopka />
        </div>

        <BlogSidebar kategorie={kategorie} ostatnie={ostatnie} />
      </div>
    </main>
  );
}
