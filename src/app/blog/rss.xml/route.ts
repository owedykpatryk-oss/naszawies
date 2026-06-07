import { pobierzOpublikowaneArtykuly } from "@/lib/blog/wczytaj-tresci";
import { sciezkaOkladkiArtykulu } from "@/lib/images/sciezki-blog";
import { generateCanonical } from "@/lib/seo/generate-canonical";
import { pobierzBazeUrlWitryny } from "@/lib/seo/konfiguracja-domeny";

export const revalidate = 3600;

function ucieczkaXml(tekst: string): string {
  return tekst
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const artykuly = pobierzOpublikowaneArtykuly().slice(0, 50);
  const kanal = generateCanonical("/blog");
  const baza = pobierzBazeUrlWitryny();
  const opis = "Blog naszawies.pl — poradniki o życiu na wsi i narzędziach cyfrowych.";

  const items = artykuly
    .map((a) => {
      const link = generateCanonical(`/blog/${a.slug}`);
      const okladkaSciezka = sciezkaOkladkiArtykulu(a.slug, a.ogImage ?? a.coverImage);
      const okladkaUrl = okladkaSciezka.startsWith("http")
        ? okladkaSciezka
        : `${baza}${okladkaSciezka.startsWith("/") ? okladkaSciezka : `/${okladkaSciezka}`}`;
      const enclosure = `<enclosure url="${ucieczkaXml(okladkaUrl)}" type="image/webp" />`;
      return `<item>
  <title>${ucieczkaXml(a.title)}</title>
  <link>${link}</link>
  <guid isPermaLink="true">${link}</guid>
  <description>${ucieczkaXml(a.excerpt)}</description>
  <pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate>
  <category>${ucieczkaXml(a.category.name)}</category>
  ${enclosure}
</item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Blog naszawies.pl</title>
    <link>${kanal}</link>
    <description>${ucieczkaXml(opis)}</description>
    <language>pl</language>
    <atom:link href="${generateCanonical("/blog/rss.xml")}" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
