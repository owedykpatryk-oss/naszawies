import type { WydarzenieSportowePubliczne } from "@/lib/wies/pobierz-terminarz-sportu-wsi";
import { bazowyUrlWitryny } from "@/lib/wies/kody-embed-wsi";
import { etykietaRodzajuWydarzenia } from "@/lib/wies/teksty-organizacji";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function urlRssSportuWsi(villageId: string): string {
  return `${bazowyUrlWitryny()}/api/wies/${villageId}/sport/rss`;
}

export function urlIcalSportuWsi(villageId: string): string {
  return `${bazowyUrlWitryny()}/api/wies/${villageId}/sport/ical`;
}

export function zbudujRssSportuWsi(opts: {
  nazwaWsi: string;
  villageId: string;
  sciezkaProfilu: string;
  wydarzenia: WydarzenieSportowePubliczne[];
}): string {
  const kanalUrl = `${bazowyUrlWitryny()}${opts.sciezkaProfilu}#sekcja-sport`;
  const selfUrl = urlRssSportuWsi(opts.villageId);
  const items = opts.wydarzenia.slice(0, 40).map((w) => {
    const opis = [
      etykietaRodzajuWydarzenia(w.event_kind),
      w.location_text,
      w.nazwa_grupy,
    ]
      .filter(Boolean)
      .join(" · ");
    const link = `${bazowyUrlWitryny()}${opts.sciezkaProfilu}/wydarzenia/${w.id}`;
    return `<item>
  <title>${escapeXml(w.title)}</title>
  <description>${escapeXml(opis)}</description>
  <link>${escapeXml(link)}</link>
  <guid isPermaLink="true">${escapeXml(link)}</guid>
  <pubDate>${new Date(w.starts_at).toUTCString()}</pubDate>
</item>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${escapeXml(`Sport — ${opts.nazwaWsi}`)}</title>
  <link>${escapeXml(kanalUrl)}</link>
  <description>${escapeXml(`Mecze i treningi we wsi ${opts.nazwaWsi} na naszawies.pl`)}</description>
  <language>pl</language>
  <atom:link href="${escapeXml(selfUrl)}" rel="self" type="application/rss+xml" xmlns:atom="http://www.w3.org/2005/Atom"/>
  ${items.join("\n")}
</channel>
</rss>`;
}
