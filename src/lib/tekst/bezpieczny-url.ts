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
