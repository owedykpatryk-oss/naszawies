import type { Metadata } from "next";
import { LOCALE_PL, NAZWA_WITRYNY, pobierzBazeUrlWitryny } from "@/lib/seo/konfiguracja-domeny";
import { generateCanonical } from "@/lib/seo/generate-canonical";

export type OpcjeSeoMeta = {
  tytul: string;
  opis: string;
  sciezka: string;
  /** Pełny URL lub ścieżka do obrazu OG. */
  obrazOg?: string | null;
  typOg?: "website" | "article";
  dataPublikacji?: string;
  bezIndeksowania?: boolean;
  /** Nadpisanie tytułu w <title> (SEO). */
  tytulSeo?: string;
};

function absolutnyUrlObrazu(obraz: string | null | undefined, baza: string): string | undefined {
  if (!obraz?.trim()) return undefined;
  const o = obraz.trim();
  if (o.startsWith("http://") || o.startsWith("https://")) return o;
  return `${baza}${o.startsWith("/") ? o : `/${o}`}`;
}

/** Spójne metadane Next.js dla stron publicznych. */
export function createSeoMeta(opcje: OpcjeSeoMeta): Metadata {
  const tytulPelny = opcje.tytulSeo?.trim() || opcje.tytul;
  const tytulZSzablonem = tytulPelny.includes(NAZWA_WITRYNY)
    ? tytulPelny
    : `${tytulPelny} | ${NAZWA_WITRYNY}`;
  const kanoniczny = generateCanonical(opcje.sciezka);
  const baza = pobierzBazeUrlWitryny();
  const obraz = absolutnyUrlObrazu(opcje.obrazOg, baza);

  return {
    title: tytulZSzablonem,
    description: opcje.opis.slice(0, 320),
    alternates: { canonical: opcje.sciezka },
    robots: opcje.bezIndeksowania
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      type: opcje.typOg ?? "website",
      locale: LOCALE_PL,
      url: kanoniczny,
      siteName: NAZWA_WITRYNY,
      title: tytulPelny,
      description: opcje.opis.slice(0, 200),
      ...(obraz ? { images: [{ url: obraz, alt: tytulPelny }] } : {}),
      ...(opcje.typOg === "article" && opcje.dataPublikacji
        ? { publishedTime: opcje.dataPublikacji }
        : {}),
    },
    twitter: {
      card: obraz ? "summary_large_image" : "summary",
      title: tytulPelny,
      description: opcje.opis.slice(0, 200),
      ...(obraz ? { images: [obraz] } : {}),
    },
  };
}
