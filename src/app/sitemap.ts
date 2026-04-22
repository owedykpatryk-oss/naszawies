import type { MetadataRoute } from "next";

const baza = "https://naszawies.pl";

export default function sitemap(): MetadataRoute.Sitemap {
  const teraz = new Date();
  return [
    { url: baza + "/", lastModified: teraz, changeFrequency: "weekly", priority: 1 },
    {
      url: baza + "/o-nas",
      lastModified: teraz,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: baza + "/kontakt",
      lastModified: teraz,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: baza + "/polityka-prywatnosci",
      lastModified: teraz,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: baza + "/regulamin",
      lastModified: teraz,
      changeFrequency: "yearly",
      priority: 0.4,
    },
  ];
}
