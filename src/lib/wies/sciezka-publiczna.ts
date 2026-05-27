import slugify from "slugify";
import { slugCzesciAdministracyjnej } from "@/lib/wies/slug-administracyjny";

export function sciezkaProfiluWsi(v: {
  voivodeship: string;
  county: string;
  commune: string;
  slug: string;
}): string {
  const s = (t: string) => slugify(t, { lower: true, strict: true, locale: "pl" });
  return `/wies/${s(v.voivodeship)}/${s(v.county)}/${s(v.commune)}/${v.slug}`;
}

export function sciezkaGminy(v: { voivodeship: string; county: string; commune: string }): string {
  const s = (t: string) => slugify(t, { lower: true, strict: true, locale: "pl" });
  return `/wies/${s(v.voivodeship)}/${s(v.county)}/${s(v.commune)}`;
}

export function sciezkaPowiatu(v: { voivodeship: string; county: string }): string {
  const s = (t: string) => slugify(t, { lower: true, strict: true, locale: "pl" });
  return `/wies/${s(v.voivodeship)}/${s(v.county)}`;
}

export function sciezkaWojewodztwa(voivodeship: string): string {
  return `/wies/${slugCzesciAdministracyjnej(voivodeship)}`;
}
