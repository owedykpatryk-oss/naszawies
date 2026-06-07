import type { MetadataRoute } from "next";
import { pobierzKategorieBlog, pobierzOpublikowaneArtykuly } from "@/lib/blog/wczytaj-tresci";
import { pobierzBazeUrlWitryny } from "@/lib/seo/konfiguracja-domeny";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import {
  sciezkaStronyOrganizacji,
  segmentDlaOrganizacji,
  slugPublicznyOrganizacji,
} from "@/lib/wies/sciezka-organizacji-publicznej";

const baza = pobierzBazeUrlWitryny();

const maxProfiliWMapieStrony = 800;
const maxOgloszenRynkuWMapieStrony = 1500;
const maxOrganizacjiWMapieStrony = 1200;
const maxWydarzenWMapieStrony = 600;

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
      url: `${baza}/szukaj`,
      lastModified: teraz,
      changeFrequency: "weekly",
      priority: 0.9,
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
      url: `${baza}/blog`,
      lastModified: teraz,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baza}/blog/rss.xml`,
      lastModified: teraz,
      changeFrequency: "daily",
      priority: 0.5,
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
  let organizacje: MetadataRoute.Sitemap = [];
  let wydarzenia: MetadataRoute.Sitemap = [];
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

      const { data: grupyOrg } = await supabase
        .from("village_community_groups")
        .select(
          "id, name, group_type, public_slug, updated_at, villages!inner(voivodeship, county, commune, slug, is_active)",
        )
        .eq("is_active", true)
        .eq("villages.is_active", true)
        .order("updated_at", { ascending: false })
        .limit(maxOrganizacjiWMapieStrony);

      if (grupyOrg?.length) {
        organizacje = grupyOrg
          .map((g) => {
            const surowe = g.villages as
              | { voivodeship: string; county: string; commune: string; slug: string }
              | { voivodeship: string; county: string; commune: string; slug: string }[]
              | null;
            const v = Array.isArray(surowe) ? surowe[0] : surowe;
            if (!v) return null;
            const segment = segmentDlaOrganizacji(g.group_type, g.name);
            if (!segment) return null;
            const sciezka = sciezkaStronyOrganizacji(
              v,
              segment,
              slugPublicznyOrganizacji(g.name, g.id, g.public_slug),
            );
            return {
              url: `${baza}${sciezka}`,
              lastModified: g.updated_at ? new Date(g.updated_at) : teraz,
              changeFrequency: "weekly" as const,
              priority: 0.62,
            };
          })
          .filter(Boolean) as MetadataRoute.Sitemap;
      }

      const odWydarzen = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const { data: evWydarzenia } = await supabase
        .from("village_community_events")
        .select("id, village_id, starts_at, updated_at")
        .in("village_id", idsWsi)
        .eq("status", "approved")
        .gte("starts_at", odWydarzen)
        .order("starts_at", { ascending: true })
        .limit(maxWydarzenWMapieStrony);

      if (evWydarzenia?.length) {
        wydarzenia = evWydarzenia
          .map((ev) => {
            const sciezka = sciezkaPoId.get(ev.village_id as string);
            if (!sciezka) return null;
            const mod = ev.starts_at ?? ev.updated_at;
            return {
              url: `${baza}${sciezka}/wydarzenia/${ev.id}`,
              lastModified: mod ? new Date(mod) : teraz,
              changeFrequency: "weekly" as const,
              priority: 0.58,
            };
          })
          .filter(Boolean) as MetadataRoute.Sitemap;
      }
    }
  }

  const blogKategorie: MetadataRoute.Sitemap = pobierzKategorieBlog().map((k) => ({
    url: `${baza}/blog/kategoria/${k.slug}`,
    lastModified: teraz,
    changeFrequency: "weekly" as const,
    priority: 0.68,
  }));

  const blog: MetadataRoute.Sitemap = pobierzOpublikowaneArtykuly().map((a) => {
    const obrazy = Array.from(
      new Set(
        [a.coverImage, a.ogImage, ...(a.gallery ?? []), ...(a.generatedImages ?? [])]
          .filter((x): x is string => Boolean(x?.trim()))
          .map((src) => (src.startsWith("http") ? src : `${baza}${src.startsWith("/") ? src : `/${src}`}`)),
      ),
    );
    return {
      url: `${baza}/blog/${a.slug}`,
      lastModified: new Date(a.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.72,
      ...(obrazy.length ? { images: obrazy } : {}),
    };
  });

  return [...statyczne, ...stuby, ...blogKategorie, ...blog, ...wsi, ...rynek, ...organizacje, ...wydarzenia];
}
