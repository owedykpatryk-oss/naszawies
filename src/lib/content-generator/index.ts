/**
 * Pipeline AI (faza 7) — szkielety bez auto-publikacji.
 * Podłącz providera dopiero po konfiguracji kluczy i moderacji treści.
 */

import { generujSlugBlog } from "@/lib/blog/generuj-slug";
import { szacujCzasCzytania } from "@/lib/blog/szacuj-czas-czytania";
import { createInternalLinks } from "@/lib/seo/create-internal-links";

export function generateSlug(tekst: string): string {
  return generujSlugBlog(tekst);
}

export function estimateReadingTime(html: string): number {
  return szacujCzasCzytania(html);
}

export type KonturArtykulu = {
  tytul: string;
  sekcje: { naglowek: string; punkty: string[] }[];
};

export async function generateOutline(slowoKluczowe: string): Promise<KonturArtykulu> {
  void slowoKluczowe;
  return {
    tytul: "Szkic artykułu — wymaga uzupełnienia przez redakcję",
    sekcje: [
      { naglowek: "Wprowadzenie", punkty: ["Kontekst dla mieszkańców wsi"] },
      { naglowek: "Rozwiązanie", punkty: ["Jak naszawies.pl pomaga"] },
      { naglowek: "Podsumowanie", punkty: ["Wezwanie do działania"] },
    ],
  };
}

export function suggestKeywords(tekst: string): string[] {
  const slowa = tekst
    .toLowerCase()
    .replace(/[^a-ząćęłńóśźż0-9\s-]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length > 4);
  return Array.from(new Set(slowa)).slice(0, 12);
}

export function generateInternalLinks(tags: string[]) {
  return createInternalLinks(tags);
}

export function generateFAQ(tytul: string): { question: string; answer: string }[] {
  void tytul;
  return [];
}

export async function createArticle(kontur: KonturArtykulu): Promise<string> {
  void kontur;
  return "<p>Treść wygenerowana — wymaga przeglądu redakcyjnego przed publikacją.</p>";
}
