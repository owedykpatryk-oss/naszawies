import type { Metadata } from "next";
import Link from "next/link";
import { BlogBreadcrumbs } from "@/components/blog/blog-breadcrumbs";
import { BlogJsonLd } from "@/components/blog/blog-json-ld";
import { BlogKartaArtykulu } from "@/components/blog/blog-karta-artykulu";
import { BlogCtaStopka } from "@/components/blog/blog-cta-stopka";
import { HeroModuluPublicznego } from "@/components/wspolne/hero-modulu-publicznego";
import { pobierzArtykulyTagu, pobierzOpublikowaneArtykuly } from "@/lib/blog/wczytaj-tresci";
import { createSeoMeta } from "@/lib/seo/create-seo-meta";
import { generateBreadcrumbsBlog } from "@/lib/seo/generate-breadcrumbs";

export const revalidate = 3600;

type Props = { params: { slug: string } };

export function generateStaticParams() {
  const tagi = new Set<string>();
  for (const a of pobierzOpublikowaneArtykuly()) {
    for (const t of a.tags) tagi.add(t.toLowerCase());
  }
  return Array.from(tagi).map((slug) => ({ slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const etykieta = decodeURIComponent(params.slug);
  return createSeoMeta({
    tytul: `Tag: ${etykieta}`,
    opis: `Artykuły na blogu naszawies.pl oznaczone tagiem „${etykieta}".`,
    sciezka: `/blog/tag/${params.slug}`,
  });
}

export default function StronaTaguBlog({ params }: Props) {
  const etykieta = decodeURIComponent(params.slug);
  const artykuly = pobierzArtykulyTagu(etykieta);
  const breadcrumbs = generateBreadcrumbsBlog([
    { nazwa: `#${etykieta}`, href: `/blog/tag/${params.slug}` },
  ]);

  return (
    <main className="page-shell max-w-6xl py-8 sm:py-12">
      <BlogJsonLd
        listing={{
          tytul: `Tag ${etykieta}`,
          opis: `Lista artykułów z tagiem ${etykieta}.`,
          sciezka: `/blog/tag/${params.slug}`,
        }}
        breadcrumbs={breadcrumbs.filter((b) => b.href)}
      />

      <BlogBreadcrumbs okruszki={breadcrumbs} />

      <HeroModuluPublicznego
        etykieta="Tag"
        tytul={`#${etykieta}`}
        opis="Artykuły powiązane tematycznie."
      />

      <p className="mt-4 text-sm">
        <Link href="/blog" className="font-medium text-green-800 underline dark:text-green-300">
          ← Blog
        </Link>
      </p>

      {artykuly.length === 0 ? (
        <p className="mt-8 rounded-xl border border-stone-200 bg-stone-50 px-4 py-8 text-center text-sm text-stone-600 dark:border-stone-700 dark:bg-stone-900/40 dark:text-stone-400">
          Brak artykułów z tym tagiem.
        </p>
      ) : (
        <section className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {artykuly.map((a) => (
            <BlogKartaArtykulu key={a.slug} artykul={a} />
          ))}
        </section>
      )}

      <BlogCtaStopka />
    </main>
  );
}
