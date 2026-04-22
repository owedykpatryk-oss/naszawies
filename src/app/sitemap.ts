import type { MetadataRoute } from "next";

const baza = "https://naszawies.pl";

/** Strony publiczne (stuby mają niski priorytet — indeksacja do czasu pełnej treści). */
export default function sitemap(): MetadataRoute.Sitemap {
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
    priority: 0.3,
  }));

  return [...statyczne, ...stuby];
}
