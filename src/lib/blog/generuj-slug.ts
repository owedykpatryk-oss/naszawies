import slugify from "slugify";

/** Slug URL przyjazny SEO — tylko polskie znaki transliterowane. */
export function generujSlugBlog(tekst: string): string {
  return slugify(tekst, { lower: true, strict: true, locale: "pl" });
}
