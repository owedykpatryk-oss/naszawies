import type { MetadataRoute } from "next";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

const baza = "https://naszawies.pl";

const maxProfiliWMapieStrony = 800;
const maxOgloszenRynkuWMapieStrony = 1500;

/** Odświeżanie listy wsi w sitemap (bez pełnego redeployu). */
export const revalidate = 3600;

/** Strony publiczne + aktywne profile wsi (SEO). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const teraz = new Date();
  const statyczne: MetadataRoute.Sitemap = [
    { url: `${baza}/`, lastModified: teraz, changeFrequency: "weekly", priority: 1 },
    {
      url: `${baza}/rynek`,
      lastModified: teraz,
      changeFrequency: "daily",
      priority: 0.85,
    },
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
      url: `${baza}/pomoc`,
      lastModified: teraz,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baza}/zglos-problem-strony`,
      lastModified: teraz,
      changeFrequency: "yearly",
      priority: 0.4,
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

  /** Strony konta — bez katalogu/mapy/transportu (wymagają logowania, middleware). */
  const stuby: MetadataRoute.Sitemap = [
    "rejestracja",
    "logowanie",
    "reset-hasla",
    "potwierdz-email",
  ].map((sciezka) => ({
    url: `${baza}/${sciezka}`,
    lastModified: teraz,
    changeFrequency: "monthly" as const,
    priority: 0.35,
  }));

  const supabase = createPublicSupabaseClient();
  let wsi: MetadataRoute.Sitemap = [];
  let rynek: MetadataRoute.Sitemap = [];
  if (supabase) {
    const { data, error } = await supabase
      .from("villages")
      .select("id, voivodeship, county, commune, slug, name, updated_at")
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

      rynek = data.map((v) => ({
        url: `${baza}${sciezkaProfiluWsi(v)}/rynek`,
        lastModified: v.updated_at ? new Date(v.updated_at) : teraz,
        changeFrequency: "daily" as const,
        priority: 0.65,
      }));

      const idsWsi = data.map((v) => v.id);
      const sciezkaPoId = new Map(data.map((v) => [v.id, sciezkaProfiluWsi(v)]));
      const { data: ogloszenia } = await supabase
        .from("marketplace_listings")
        .select("id, village_id, published_at, updated_at")
        .in("village_id", idsWsi)
        .eq("status", "approved")
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(maxOgloszenRynkuWMapieStrony);

      if (ogloszenia?.length) {
        rynek = [
          ...rynek,
          ...ogloszenia
            .map((o) => {
              const sciezka = sciezkaPoId.get(o.village_id as string);
              if (!sciezka) return null;
              const mod = o.published_at ?? o.updated_at;
              return {
                url: `${baza}${sciezka}/rynek/${o.id}`,
                lastModified: mod ? new Date(mod) : teraz,
                changeFrequency: "weekly" as const,
                priority: 0.55,
              };
            })
            .filter(Boolean) as MetadataRoute.Sitemap,
        ];
      }
    }
  }

  return [...statyczne, ...stuby, ...wsi, ...rynek];
}
