import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BlogBreadcrumbs } from "@/components/blog/blog-breadcrumbs";
import { BlogFaq } from "@/components/blog/blog-faq";
import { BlogAutorKarta } from "@/components/blog/blog-autor-karta";
import { BlogCtaStopka } from "@/components/blog/blog-cta-stopka";
import { BlogGaleria } from "@/components/blog/blog-galeria";
import { BlogNawigacjaArtykulow } from "@/components/blog/blog-nawigacja-artykulow";
import { pobierzSasiednieArtykuly } from "@/lib/blog/pobierz-sasiednie-artykuly";
import { BlogJsonLd } from "@/components/blog/blog-json-ld";
import { BlogPowiazane } from "@/components/blog/blog-powiazane";
import { BlogSidebar } from "@/components/blog/blog-sidebar";
import { BlogUdostepnij } from "@/components/blog/blog-udostepnij";
import {
  pobierzArtykulPoSlug,
  pobierzKategorieBlog,
  pobierzOpublikowaneArtykuly,
  pobierzPowiazaneArtykuly,
  pobierzWszystkieSlugiOpublikowane,
} from "@/lib/blog/wczytaj-tresci";
import { createInternalLinks } from "@/lib/seo/create-internal-links";
import { createSeoMeta } from "@/lib/seo/create-seo-meta";
import { generateBreadcrumbsBlog } from "@/lib/seo/generate-breadcrumbs";
import { sciezkaOkladkiArtykulu } from "@/lib/images/sciezki-blog";
import { generateAltText } from "@/lib/images/generate-alt-text";
import Link from "next/link";

export const revalidate = 3600;

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return pobierzWszystkieSlugiOpublikowane().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const artykul = pobierzArtykulPoSlug(params.slug);
  if (!artykul) return { title: "Artykuł" };

  const okladka = sciezkaOkladkiArtykulu(artykul.slug, artykul.ogImage ?? artykul.coverImage);

  return createSeoMeta({
    tytul: artykul.title,
    tytulSeo: artykul.seoTitle ?? undefined,
    opis: artykul.seoDescription ?? artykul.excerpt,
    sciezka: `/blog/${artykul.slug}`,
    obrazOg: okladka,
    typOg: "article",
    dataPublikacji: artykul.publishedAt,
  });
}

export default function StronaArtykuluBlog({ params }: Props) {
  const artykul = pobierzArtykulPoSlug(params.slug);
  if (!artykul) notFound();

  const okladka = sciezkaOkladkiArtykulu(artykul.slug, artykul.ogImage ?? artykul.coverImage);
  const breadcrumbs = generateBreadcrumbsBlog([{ nazwa: artykul.title }]);
  const powiazane = pobierzPowiazaneArtykuly(artykul);
  const { nowszy, starszy } = pobierzSasiednieArtykuly(artykul.slug);
  const linki =
    artykul.internalLinks.length > 0
      ? artykul.internalLinks
      : createInternalLinks(artykul.tags, []).map((l) => ({ href: l.href, label: l.etykieta }));

  return (
    <main className="page-shell max-w-6xl py-8 sm:py-12">
      <BlogJsonLd
        artykul={{
          tytul: artykul.title,
          opis: artykul.excerpt,
          sciezka: `/blog/${artykul.slug}`,
          dataPublikacji: artykul.publishedAt,
          autor: artykul.author.name,
          obraz: okladka,
          czasCzytaniaMin: artykul.readingTime,
        }}
        faq={artykul.faq.map((f) => ({ pytanie: f.question, odpowiedz: f.answer }))}
        breadcrumbs={breadcrumbs.filter((b) => b.href)}
      />

      <BlogBreadcrumbs okruszki={breadcrumbs} />

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <article>
          <header>
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
              <Link href={`/blog/kategoria/${artykul.category.slug}`}>{artykul.category.name}</Link>
            </p>
            <h1 className="mt-2 font-serif text-3xl leading-tight text-green-950 dark:text-green-50 sm:text-4xl">
              {artykul.title}
            </h1>
            <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
              {artykul.author.name} · {artykul.readingTime} min czytania ·{" "}
              {new Date(artykul.publishedAt).toLocaleDateString("pl-PL", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-2xl">
              <Image
                src={okladka}
                alt={generateAltText(artykul.title)}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 720px"
                unoptimized={okladka.startsWith("/api/")}
              />
            </div>
          </header>

          <div
            className="blog-tresc-artykulu mt-8"
            dangerouslySetInnerHTML={{ __html: artykul.content }}
          />

          {linki.length > 0 ? (
            <section className="mt-8 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900 dark:text-emerald-200">
                Przydatne na platformie
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {linki.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-green-900 shadow-sm ring-1 ring-stone-200/80 dark:bg-stone-900 dark:text-green-100 dark:ring-stone-700"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {artykul.tags.length > 0 ? (
            <p className="mt-6 flex flex-wrap gap-2 text-sm">
              {artykul.tags.map((t) => (
                <Link
                  key={t}
                  href={`/blog/tag/${encodeURIComponent(t.toLowerCase())}`}
                  className="rounded-full bg-stone-200/80 px-3 py-0.5 text-stone-800 dark:bg-stone-800 dark:text-stone-200"
                >
                  #{t}
                </Link>
              ))}
            </p>
          ) : null}

          <div className="mt-8 border-t border-stone-200 pt-6 dark:border-stone-700">
            <BlogUdostepnij tytul={artykul.title} url={`/blog/${artykul.slug}`} />
          </div>

          <BlogGaleria zdjecia={artykul.gallery} tytulArtykulu={artykul.title} />

          <BlogAutorKarta autor={artykul.author} />
          <BlogFaq pozycje={artykul.faq} />
          <BlogPowiazane artykuly={powiazane} />
          <BlogNawigacjaArtykulow nowszy={nowszy} starszy={starszy} />
          <BlogCtaStopka />
        </article>

        <BlogSidebar
          kategorie={pobierzKategorieBlog()}
          ostatnie={pobierzOpublikowaneArtykuly().filter((a) => a.slug !== artykul.slug)}
          pokazSpis
        />
      </div>
    </main>
  );
}
