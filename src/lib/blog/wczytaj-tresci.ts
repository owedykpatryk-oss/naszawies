import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import type { BlogArtykul, BlogAutor, BlogKategoria, BlogArtykulPelny } from "@/lib/blog/typy";
import { szacujCzasCzytania } from "@/lib/blog/szacuj-czas-czytania";

const KATALOG_TRESCI = path.join(process.cwd(), "content", "blog");

function wczytajJson<T>(sciezka: string): T | null {
  try {
    const raw = fs.readFileSync(sciezka, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

const wczytajAutorow = cache((): Map<string, BlogAutor> => {
  const dane = wczytajJson<BlogAutor[]>(path.join(KATALOG_TRESCI, "authors.json")) ?? [];
  return new Map(dane.map((a) => [a.id, a]));
});

const wczytajKategorie = cache((): Map<string, BlogKategoria> => {
  const dane = wczytajJson<BlogKategoria[]>(path.join(KATALOG_TRESCI, "categories.json")) ?? [];
  return new Map(dane.map((k) => [k.slug, k]));
});

const wczytajSuroweArtykuly = cache((): BlogArtykul[] => {
  const katalog = path.join(KATALOG_TRESCI, "articles");
  if (!fs.existsSync(katalog)) return [];

  const pliki = fs.readdirSync(katalog).filter((f) => f.endsWith(".json"));
  const artykuly: BlogArtykul[] = [];

  for (const plik of pliki) {
    const artykul = wczytajJson<BlogArtykul>(path.join(katalog, plik));
    if (artykul?.slug && artykul.title) artykuly.push(artykul);
  }

  return artykuly.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
});

function uzupelnijArtykul(artykul: BlogArtykul): BlogArtykulPelny | null {
  const autorzy = wczytajAutorow();
  const kategorie = wczytajKategorie();
  const autor = autorzy.get(artykul.authorId);
  const kategoria = kategorie.get(artykul.categorySlug);
  if (!autor || !kategoria) return null;

  const czas =
    artykul.readingTime && artykul.readingTime > 0
      ? artykul.readingTime
      : szacujCzasCzytania(`${artykul.excerpt} ${artykul.content}`);

  return { ...artykul, author: autor, category: kategoria, readingTime: czas };
}

/** Opublikowane artykuły posortowane od najnowszych. */
export const pobierzOpublikowaneArtykuly = cache((): BlogArtykulPelny[] => {
  return wczytajSuroweArtykuly()
    .filter((a) => a.status === "published")
    .map(uzupelnijArtykul)
    .filter((a): a is BlogArtykulPelny => Boolean(a));
});

export const pobierzArtykulPoSlug = cache((slug: string): BlogArtykulPelny | null => {
  const surowy = wczytajSuroweArtykuly().find((a) => a.slug === slug && a.status === "published");
  if (!surowy) return null;
  return uzupelnijArtykul(surowy);
});

export const pobierzWszystkieSlugiOpublikowane = cache((): string[] => {
  return wczytajSuroweArtykuly()
    .filter((a) => a.status === "published")
    .map((a) => a.slug);
});

export function pobierzKategorieBlog(): BlogKategoria[] {
  return Array.from(wczytajKategorie().values());
}

export function pobierzArtykulyKategorii(slugKategorii: string): BlogArtykulPelny[] {
  return pobierzOpublikowaneArtykuly().filter((a) => a.categorySlug === slugKategorii);
}

export function pobierzArtykulyTagu(slugTagu: string): BlogArtykulPelny[] {
  const tag = slugTagu.toLowerCase();
  return pobierzOpublikowaneArtykuly().filter((a) =>
    a.tags.some((t) => t.toLowerCase() === tag),
  );
}

export function pobierzPowiazaneArtykuly(artykul: BlogArtykulPelny, limit = 3): BlogArtykulPelny[] {
  const wszystkie = pobierzOpublikowaneArtykuly().filter((a) => a.slug !== artykul.slug);
  const poSlug = new Set(artykul.relatedSlugs);
  const wybrane: BlogArtykulPelny[] = [];

  for (const s of artykul.relatedSlugs) {
    const znaleziony = wszystkie.find((a) => a.slug === s);
    if (znaleziony) wybrane.push(znaleziony);
  }

  for (const a of wszystkie) {
    if (wybrane.length >= limit) break;
    if (wybrane.some((w) => w.slug === a.slug)) continue;
    if (poSlug.has(a.slug) || a.categorySlug === artykul.categorySlug) wybrane.push(a);
  }

  return wybrane.slice(0, limit);
}

export function szukajArtykulowBlog(zapytanie: string): BlogArtykulPelny[] {
  const q = zapytanie.trim().toLowerCase();
  if (!q || q.length < 2) return [];
  return pobierzOpublikowaneArtykuly().filter((a) => {
    const haystack = `${a.title} ${a.excerpt} ${a.tags.join(" ")} ${a.category.name}`.toLowerCase();
    return haystack.includes(q);
  });
}

/** Wersja admin — także szkice. */
export function pobierzWszystkieArtykulyAdmin(): BlogArtykulPelny[] {
  return wczytajSuroweArtykuly()
    .map(uzupelnijArtykul)
    .filter((a): a is BlogArtykulPelny => Boolean(a));
}
