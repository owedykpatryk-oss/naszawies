import type { AktywnoscFitnessPubliczna } from "@/lib/wies/aktywnosc-fitness-wspolne";
import {
  etykietaRodzajuAktywnosci,
  formatujCzas,
  formatujDystans,
} from "@/lib/wies/aktywnosc-fitness-wspolne";
import { bazowyUrlWitryny } from "@/lib/wies/kody-embed-wsi";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function urlRssAktywnosciFitnessWsi(villageId: string): string {
  return `${bazowyUrlWitryny()}/api/wies/${villageId}/sport/aktywnosc/rss`;
}

export function zbudujRssAktywnosciFitnessWsi(opts: {
  nazwaWsi: string;
  villageId: string;
  sciezkaProfilu: string;
  aktywnosci: AktywnoscFitnessPubliczna[];
}): string {
  const kanalUrl = `${bazowyUrlWitryny()}${opts.sciezkaProfilu}#sekcja-sport`;
  const selfUrl = urlRssAktywnosciFitnessWsi(opts.villageId);

  const items = opts.aktywnosci.slice(0, 40).map((a) => {
    const opis = [
      etykietaRodzajuAktywnosci(a.activity_kind),
      formatujDystans(a.distance_meters),
      formatujCzas(a.duration_seconds),
      a.autor?.display_name,
      a.nazwa_klubu,
      a.notes,
    ]
      .filter(Boolean)
      .join(" · ");
    const link = a.strava_url ?? kanalUrl;
    return `<item>
  <title>${escapeXml(a.title)}</title>
  <description>${escapeXml(opis)}</description>
  <link>${escapeXml(link)}</link>
  <guid isPermaLink="false">fitness-${escapeXml(a.id)}</guid>
  <pubDate>${new Date(a.activity_date).toUTCString()}</pubDate>
</item>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${escapeXml(`Aktywność — ${opts.nazwaWsi}`)}</title>
  <link>${escapeXml(kanalUrl)}</link>
  <description>${escapeXml(`Biegi, nordic walking i rowery mieszkańców wsi ${opts.nazwaWsi}`)}</description>
  <language>pl</language>
  <atom:link href="${escapeXml(selfUrl)}" rel="self" type="application/rss+xml" xmlns:atom="http://www.w3.org/2005/Atom"/>
  ${items.join("\n")}
</channel>
</rss>`;
}
