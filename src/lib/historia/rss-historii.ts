import type { WpisHistoriiPubliczny } from "@/lib/historia/typy-historii";
import { bazowyUrlWitryny } from "@/lib/wies/kody-embed-wsi";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function urlRssHistoriiWsi(villageId: string): string {
  return `${bazowyUrlWitryny()}/api/wies/${villageId}/historia/rss`;
}

export function zbudujRssHistoriiWsi(opts: {
  nazwaWsi: string;
  villageId: string;
  sciezkaProfilu: string;
  wpisy: WpisHistoriiPubliczny[];
}): string {
  const kanalUrl = `${bazowyUrlWitryny()}${opts.sciezkaProfilu}/historia`;
  const selfUrl = urlRssHistoriiWsi(opts.villageId);
  const items = opts.wpisy
    .slice(0, 40)
    .map((w) => {
      const opis = w.short_description?.trim() || w.body?.trim()?.slice(0, 400) || w.title;
      const link = `${bazowyUrlWitryny()}${opts.sciezkaProfilu}/historia/${w.id}`;
      const data = w.event_date ?? w.created_at;
      return `<item>
  <title>${escapeXml(w.title)}</title>
  <description>${escapeXml(opis)}</description>
  <link>${escapeXml(link)}</link>
  <guid isPermaLink="true">${escapeXml(link)}</guid>
  <pubDate>${new Date(data).toUTCString()}</pubDate>
</item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${escapeXml(`Kronika — ${opts.nazwaWsi}`)}</title>
  <link>${escapeXml(kanalUrl)}</link>
  <description>${escapeXml(`Historia i wspomnienia z ${opts.nazwaWsi} na naszawies.pl`)}</description>
  <language>pl</language>
  <atom:link href="${escapeXml(selfUrl)}" rel="self" type="application/rss+xml" xmlns:atom="http://www.w3.org/2005/Atom"/>
  ${items}
</channel>
</rss>`;
}
