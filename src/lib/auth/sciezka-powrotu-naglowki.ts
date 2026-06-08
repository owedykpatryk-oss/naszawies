import { headers } from "next/headers";

export const NAGLOWEK_PATHNAME = "x-pathname";
export const NAGLOWEK_SEARCH = "x-search";

/** Pełna ścieżka bieżącego żądania (pathname + query) — do `next=` po logowaniu. */
export function sciezkaPowrotuZNaglowkow(fallback = "/"): string {
  const pathname = headers().get(NAGLOWEK_PATHNAME)?.trim() || fallback;
  const search = headers().get(NAGLOWEK_SEARCH) ?? "";
  if (!search) return pathname;
  return search.startsWith("?") ? `${pathname}${search}` : `${pathname}?${search}`;
}
