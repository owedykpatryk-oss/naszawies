import { pobierzOpublikowaneArtykuly } from "@/lib/blog/wczytaj-tresci";

/** Tagi posortowane malejąco po liczbie artykułów. */
export function pobierzPopularneTagi(limit = 14): { nazwa: string; slug: string; liczba: number }[] {
  const liczniki = new Map<string, { nazwa: string; liczba: number }>();

  for (const a of pobierzOpublikowaneArtykuly()) {
    for (const tag of a.tags) {
      const slug = tag.toLowerCase();
      const istniejacy = liczniki.get(slug);
      if (istniejacy) istniejacy.liczba += 1;
      else liczniki.set(slug, { nazwa: tag, liczba: 1 });
    }
  }

  return Array.from(liczniki.entries())
    .map(([slug, d]) => ({ slug, nazwa: d.nazwa, liczba: d.liczba }))
    .sort((a, b) => b.liczba - a.liczba || a.nazwa.localeCompare(b.nazwa, "pl"))
    .slice(0, limit);
}
