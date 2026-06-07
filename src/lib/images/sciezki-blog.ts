import fs from "node:fs";
import path from "node:path";

function istniejeWPublic(sciezkaUrl: string): boolean {
  const wzgledna = sciezkaUrl.replace(/^\//, "");
  return fs.existsSync(path.join(process.cwd(), "public", wzgledna));
}

/** URL okładki artykułu — plik statyczny, domyślna okładka lub dynamiczna grafika. */
export function sciezkaOkladkiArtykulu(slug: string, statyczna?: string | null): string {
  if (statyczna?.trim() && !statyczna.includes("[slug]")) {
    const src = statyczna.trim();
    if (istniejeWPublic(src)) return src;
  }
  const domyslna = `/blog/${slug}/cover.webp`;
  if (istniejeWPublic(domyslna)) return domyslna;
  return `/api/blog/okladka/${encodeURIComponent(slug)}`;
}

export function katalogPublicznyBlog(slug: string): string {
  return `/blog/${slug}`;
}
