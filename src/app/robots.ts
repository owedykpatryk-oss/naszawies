import type { MetadataRoute } from "next";
import { pobierzBazeUrlWitryny } from "@/lib/seo/konfiguracja-domeny";

export default function robots(): MetadataRoute.Robots {
  const baza = pobierzBazeUrlWitryny();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/panel/",
          "/auth/",
          "/mapa",
          "/mapa/",
          "/wybierz-wies",
          "/transport",
          "/transport/",
          "/grafika",
        ],
      },
    ],
    sitemap: `${baza}/sitemap.xml`,
  };
}
