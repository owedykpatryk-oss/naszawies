import { pobierzBazeUrlWitryny, NAZWA_WITRYNY } from "@/lib/seo/konfiguracja-domeny";
import { generateCanonical } from "@/lib/seo/generate-canonical";
import type { Okruszek } from "@/lib/seo/generate-breadcrumbs";

export type SchemaFaqPozycja = { pytanie: string; odpowiedz: string };

export type SchemaArtykul = {
  tytul: string;
  opis: string;
  sciezka: string;
  dataPublikacji: string;
  dataModyfikacji?: string;
  autor: string;
  obraz?: string | null;
  czasCzytaniaMin?: number;
};

function absolutny(href: string): string {
  if (href.startsWith("http")) return href;
  return generateCanonical(href);
}

export function createSchema() {
  return {
    article(artykul: SchemaArtykul) {
      const url = absolutny(artykul.sciezka);
      const baza = pobierzBazeUrlWitryny();
      const obraz = artykul.obraz
        ? artykul.obraz.startsWith("http")
          ? artykul.obraz
          : `${baza}${artykul.obraz}`
        : undefined;

      return {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: artykul.tytul,
        description: artykul.opis,
        url,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        datePublished: artykul.dataPublikacji,
        dateModified: artykul.dataModyfikacji ?? artykul.dataPublikacji,
        author: {
          "@type": "Person",
          name: artykul.autor,
        },
        publisher: {
          "@type": "Organization",
          name: NAZWA_WITRYNY,
          url: baza,
        },
        inLanguage: "pl-PL",
        ...(obraz ? { image: [obraz] } : {}),
        ...(artykul.czasCzytaniaMin
          ? { timeRequired: `PT${artykul.czasCzytaniaMin}M` }
          : {}),
      };
    },

    faq(pozycje: SchemaFaqPozycja[]) {
      if (!pozycje.length) return null;
      return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: pozycje.map((p) => ({
          "@type": "Question",
          name: p.pytanie,
          acceptedAnswer: {
            "@type": "Answer",
            text: p.odpowiedz,
          },
        })),
      };
    },

    breadcrumb(okruszki: Okruszek[]) {
      const zHref = okruszki.filter((o) => o.href);
      return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: zHref.map((o, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: o.nazwa,
          item: absolutny(o.href),
        })),
      };
    },

    blogListing(tytul: string, opis: string, sciezka: string) {
      return {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: tytul,
        description: opis,
        url: absolutny(sciezka),
        inLanguage: "pl-PL",
        isPartOf: {
          "@type": "WebSite",
          name: NAZWA_WITRYNY,
          url: pobierzBazeUrlWitryny(),
        },
      };
    },
  };
}
