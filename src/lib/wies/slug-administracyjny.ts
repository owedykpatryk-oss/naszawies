import slugify from "slugify";

/** Slug segmentu URL (woj/powiat/gmina) — ten sam algorytm co w bazie `slug_pl`. */
export function slugCzesciAdministracyjnej(tekst: string): string {
  return slugify(decodeURIComponent(tekst), { lower: true, strict: true, locale: "pl" });
}

export function slugCzesciZBazy(tekst: string): string {
  return slugify(tekst, { lower: true, strict: true, locale: "pl" });
}
