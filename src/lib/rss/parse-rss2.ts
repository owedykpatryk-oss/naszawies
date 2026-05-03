import { XMLParser } from "fast-xml-parser";

export type WpisRss2 = {
  title: string;
  link: string;
  guid: string;
  pubDate: string | null;
  description: string | null;
};

function jedenLubTablica<T>(x: T | T[] | undefined): T[] {
  if (x == null) return [];
  return Array.isArray(x) ? x : [x];
}

function oczyscHtmlDoTekstu(s: string | undefined | null): string | null {
  if (s == null || typeof s !== "string") return null;
  const bezTagow = s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return bezTagow.length > 0 ? bezTagow : null;
}

/**
 * Minimalny parser kanału RSS 2.0 (channel/item). Atom obsługiwany tylko jeśli struktura zbliżona — inaczej pusta lista.
 */
export function parseRss2Items(xml: string): WpisRss2[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    trimValues: true,
  });
  let d: unknown;
  try {
    d = parser.parse(xml);
  } catch {
    return [];
  }
  if (d == null || typeof d !== "object") return [];

  const root = d as Record<string, unknown>;
  const rss = root.rss as Record<string, unknown> | undefined;
  const channel = rss?.channel as Record<string, unknown> | undefined;
  if (!channel) return [];

  const items = jedenLubTablica(channel.item as Record<string, unknown> | Record<string, unknown>[] | undefined);
  const wynik: WpisRss2[] = [];
  for (const it of items) {
    if (!it || typeof it !== "object") continue;
    const title = String((it as { title?: unknown }).title ?? "").trim();
    const link = String((it as { link?: unknown }).link ?? "").trim();
    const guidRaw = (it as { guid?: unknown }).guid;
    let guid = "";
    if (typeof guidRaw === "object" && guidRaw != null) {
      const g = guidRaw as Record<string, unknown>;
      if (typeof g["#text"] === "string") guid = g["#text"].trim();
      else guid = JSON.stringify(guidRaw).slice(0, 500);
    } else if (guidRaw != null) {
      guid = String(guidRaw).trim();
    }
    const pubDateRaw = (it as { pubDate?: unknown }).pubDate;
    const pubDate = pubDateRaw != null ? String(pubDateRaw).trim() : null;
    const descRaw = (it as { description?: unknown }).description;
    const description = oczyscHtmlDoTekstu(descRaw != null ? String(descRaw) : null);
    const stabilny = guid || link;
    if (!title || !stabilny) continue;
    wynik.push({
      title: title.slice(0, 500),
      link: link.slice(0, 2048),
      guid: stabilny.slice(0, 2048),
      pubDate: pubDate && pubDate.length > 0 ? pubDate.slice(0, 120) : null,
      description: description ? description.slice(0, 8000) : null,
    });
  }
  return wynik;
}
