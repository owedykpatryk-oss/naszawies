/** Zwraca href tylko dla http(s) — blokuje javascript: i data: w atrybutach. */
export function bezpiecznyHref(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  try {
    const u = new URL(url.trim());
    if (u.protocol === "http:" || u.protocol === "https:") {
      return u.href;
    }
    return null;
  } catch {
    return null;
  }
}

/** Ścieżka względna w aplikacji (bez open redirect). */
export function bezpiecznaSciezkaWzgledna(url: string | null | undefined): string | null {
  const s = url?.trim();
  if (!s || !s.startsWith("/") || s.startsWith("//")) return null;
  if (s.includes("\\") || s.includes("\0")) return null;
  return s;
}

/** Link w powiadomieniu: https do BIP albo ścieżka w serwisie. */
export function linkPowiadomienia(url: string | null | undefined, fallback: string): string {
  return bezpiecznyHref(url) ?? bezpiecznaSciezkaWzgledna(url) ?? fallback;
}
