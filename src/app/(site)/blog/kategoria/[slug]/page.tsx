import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BlogBreadcrumbs } from "@/components/blog/blog-breadcrumbs";
import { BlogJsonLd } from "@/components/blog/blog-json-ld";
import { BlogKartaArtykulu } from "@/components/blog/blog-karta-artykulu";
import { BlogCtaStopka } from "@/components/blog/blog-cta-stopka";
import { BlogSidebar } from "@/components/blog/blog-sidebar";
import { HeroModuluPublicznego } from "@/components/wspolne/hero-modulu-publicznego";
import { pobierzPopularneTagi } from "@/lib/blog/pobierz-popularne-tagi";
import {
  pobierzArtykulyKategorii,
  pobierzKategorieBlog,
  pobierzOpublikowaneArtykuly,
} from "@/lib/blog/wczytaj-tresci";
import { createSeoMeta } from "@/lib/seo/create-seo-meta";
import { generateBreadcrumbsBlog } from "@/lib/seo/generate-breadcrumbs";

export const revalidate = 3600;

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return pobierzKategorieBlog().map((k) => ({ slug: k.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const kategoria = pobierzKategorieBlog().find((k) => k.slug === params.slug);
  if (!kategoria) return { title: "Kategoria" };

  return createSeoMeta({
    tytul: `${kategoria.name} — blog`,
    opis: kategoria.description,
    sciezka: `/blog/kategoria/${kategoria.slug}`,
  });
}

export default function StronaKategoriiBlog({ params }: Props) {
  const kategoria = pobierzKategorieBlog().find((k) => k.slug === params.slug);
  if (!kategoria) notFound();

  const artykuly = pobierzArtykulyKategorii(kategoria.slug);
  const breadcrumbs = generateBreadcrumbsBlog([
    { nazwa: kategoria.name, href: `/blog/kategoria/${kategoria.slug}` },
  ]);
  const tagiPopularne = pobierzPopularneTagi();
  const ostatnie = pobierzOpublikowaneArtykuly();

  return (
    <main className="page-shell max-w-6xl py-8 sm:py-12">
      <BlogJsonLd
        listing={{
          tytul: `${kategoria.name} — blog naszawies.pl`,
          opis: kategoria.description,
          sciezka: `/blog/kategoria/${kategoria.slug}`,
        }}
        breadcrumbs={breadcrumbs.filter((b) => b.href)}
      />

      <BlogBreadcrumbs okruszki={breadcrumbs} />

      <HeroModuluPublicznego etykieta="Kategoria" tytul={kategoria.name} opis={kategoria.description} />

      <p className="mt-4 text-sm">
        <Link href="/blog" className="font-medium text-green-800 underline dark:text-green-300">
          ← Wszystkie artykuły
        </Link>
        {" · "}
        <span className="text-stone-600 dark:text-stone-400">{artykuly.length} artykułów</span>
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_280px]">
        <div>
          {artykuly.length === 0 ? (
            <p className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-8 text-center text-sm text-stone-600 dark:border-stone-700 dark:bg-stone-900/40 dark:text-stone-400">
              Brak artykułów w tej kategorii.
            </p>
          ) : (
            <section className="grid gap-6 sm:grid-cols-2">
              {artykuly.map((a) => (
                <BlogKartaArtykulu key={a.slug} artykul={a} />
              ))}
            </section>
          )}

          <BlogCtaStopka />
        </div>

        <BlogSidebar kategorie={pobierzKategorieBlog()} ostatnie={ostatnie} tagiPopularne={tagiPopularne} />
      </div>
    </main>
  );
}
