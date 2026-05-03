import type { MetadataRoute } from "next";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

const baza = "https://naszawies.pl";

const maxProfiliWMapieStrony = 800;

/** Odświeżanie listy wsi w sitemap (bez pełnego redeployu). */
export const revalidate = 3600;

/** Strony publiczne + aktywne profile wsi (SEO). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const teraz = new Date();
  const statyczne: MetadataRoute.Sitemap = [
    { url: `${baza}/`, lastModified: teraz, changeFrequency: "weekly", priority: 1 },
    {
      url: `${baza}/o-nas`,
      lastModified: teraz,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baza}/kontakt`,
      lastModified: teraz,
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${baza}/polityka-prywatnosci`,
      lastModified: teraz,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${baza}/regulamin`,
      lastModified: teraz,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${baza}/zglos-naruszenie`,
      lastModified: teraz,
      changeFrequency: "yearly",
      priority: 0.35,
    },
  ];

  const stuby: MetadataRoute.Sitemap = [
    "szukaj",
    "mapa",
    "rejestracja",
    "logowanie",
    "reset-hasla",
    "potwierdz-email",
    "wybierz-wies",
  ].map((sciezka) => ({
    url: `${baza}/${sciezka}`,
    lastModified: teraz,
    changeFrequency: "monthly" as const,
    priority: 0.35,
  }));

  const supabase = createPublicSupabaseClient();
  let wsi: MetadataRoute.Sitemap = [];
  if (supabase) {
    const { data, error } = await supabase
      .from("villages")
      .select("voivodeship, county, commune, slug, updated_at")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(maxProfiliWMapieStrony);

    if (!error && data?.length) {
      wsi = data.map((v) => ({
        url: `${baza}${sciezkaProfiluWsi(v)}`,
        lastModified: v.updated_at ? new Date(v.updated_at) : teraz,
        changeFrequency: "weekly" as const,
        priority: 0.75,
      }));
    }
  }

  return [...statyczne, ...stuby, ...wsi];
}
