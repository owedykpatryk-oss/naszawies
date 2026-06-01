import type { OgloszenieSzkolyPubliczne } from "@/lib/szkola/teksty-szkoly";
import { bazowyUrlWitryny } from "@/lib/wies/kody-embed-wsi";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function urlRssTablicySzkoly(villageId: string): string {
  return `${bazowyUrlWitryny()}/api/wies/${villageId}/szkola/rss`;
}

export function zbudujRssTablicySzkoly(opts: {
  nazwaWsi: string;
  villageId: string;
  sciezkaProfilu: string;
  ogloszenia: OgloszenieSzkolyPubliczne[];
}): string {
  const kanalUrl = `${bazowyUrlWitryny()}${opts.sciezkaProfilu}#sekcja-szkola`;
  const selfUrl = urlRssTablicySzkoly(opts.villageId);
  const items = opts.ogloszenia
    .slice(0, 40)
    .map((o) => {
      const opis = o.body?.trim() || o.title;
      const guid = `${selfUrl}#${o.id}`;
      return `<item>
  <title>${escapeXml(o.title)}</title>
  <description>${escapeXml(opis)}</description>
  <link>${escapeXml(kanalUrl)}</link>
  <guid isPermaLink="false">${escapeXml(guid)}</guid>
  <pubDate>${new Date(o.published_at).toUTCString()}</pubDate>
</item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${escapeXml(`Tablica szkoły — ${opts.nazwaWsi}`)}</title>
  <link>${escapeXml(kanalUrl)}</link>
  <description>${escapeXml(`Ogłoszenia szkolne dla ${opts.nazwaWsi} na naszawies.pl`)}</description>
  <language>pl</language>
  <atom:link href="${escapeXml(selfUrl)}" rel="self" type="application/rss+xml" xmlns:atom="http://www.w3.org/2005/Atom"/>
  ${items}
</channel>
</rss>`;
}
