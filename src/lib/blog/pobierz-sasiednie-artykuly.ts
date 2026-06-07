import type { BlogArtykulPelny } from "@/lib/blog/typy";
import { pobierzOpublikowaneArtykuly } from "@/lib/blog/wczytaj-tresci";

/** Nowszy i starszy artykuł względem bieżącego (lista od najnowszych). */
export function pobierzSasiednieArtykuly(slug: string): {
  nowszy: BlogArtykulPelny | null;
  starszy: BlogArtykulPelny | null;
} {
  const lista = pobierzOpublikowaneArtykuly();
  const idx = lista.findIndex((a) => a.slug === slug);
  if (idx < 0) return { nowszy: null, starszy: null };
  return {
    nowszy: idx > 0 ? (lista[idx - 1] ?? null) : null,
    starszy: idx < lista.length - 1 ? (lista[idx + 1] ?? null) : null,
  };
}
