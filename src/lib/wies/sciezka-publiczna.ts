import slugify from "slugify";

export function sciezkaProfiluWsi(v: {
  voivodeship: string;
  county: string;
  commune: string;
  slug: string;
}): string {
  const s = (t: string) => slugify(t, { lower: true, strict: true, locale: "pl" });
  return `/wies/${s(v.voivodeship)}/${s(v.county)}/${s(v.commune)}/${v.slug}`;
}
