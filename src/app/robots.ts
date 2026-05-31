import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
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
    sitemap: "https://naszawies.pl/sitemap.xml",
  };
}
