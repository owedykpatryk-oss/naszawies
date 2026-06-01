/** Typowe ścieżki RSS na stronach urzędów i BIP w Polsce. */
const TYPOWE_SCIEZKI_RSS = [
  "/rss",
  "/rss/",
  "/rss.xml",
  "/feed",
  "/feed/",
  "/feed/rss",
  "/aktualnosci/rss",
  "/aktualnosci/rss.xml",
  "/news/rss",
  "/index.php/rss",
  "/?rss=1",
] as const;

export type OdkrytyKanalRss = {
  label: string;
  feed_url: string;
  zrodlo: "link_tag" | "typowa_sciezka" | "redirect";
};

function normalizeUrl(base: string, href: string): string | null {
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

function wyciagnijLinkiRssZHtml(html: string, baseUrl: string): OdkrytyKanalRss[] {
  const wynik: OdkrytyKanalRss[] = [];
  const re = /<link[^>]+rel=["']alternate["'][^>]*>/gi;
  for (const tag of html.match(re) ?? []) {
    if (!/type=["']application\/(rss|atom)\+xml["']/i.test(tag)) continue;
    const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
    if (!hrefMatch?.[1]) continue;
    const feed_url = normalizeUrl(baseUrl, hrefMatch[1]);
    if (!feed_url) continue;
    const titleMatch = tag.match(/title=["']([^"']*)["']/i);
    wynik.push({
      label: titleMatch?.[1]?.trim() || "Kanał RSS ze strony",
      feed_url,
      zrodlo: "link_tag",
    });
  }
  return wynik;
}

async function czyFeedDziala(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "NaszawiesRSS-Discovery/1.0 (+https://naszawies.pl)" },
      signal: AbortSignal.timeout(12000),
      redirect: "follow",
    });
    if (!res.ok) return false;
    const ct = res.headers.get("content-type") ?? "";
    const txt = (await res.text()).slice(0, 4000);
    if (ct.includes("xml") || txt.includes("<rss") || txt.includes("<feed")) return true;
    return false;
  } catch {
    return false;
  }
}

function domenaBezWww(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Szuka kanałów RSS na stronie gminy/BIP (link rel=alternate + typowe ścieżki). */
export async function odkryjKanalyRssNaStronie(stronaUrl: string): Promise<OdkrytyKanalRss[]> {
  const baza = stronaUrl.trim();
  if (!baza) return [];
  let origin: string;
  try {
    origin = new URL(/^https?:\/\//i.test(baza) ? baza : `https://${baza}`).origin;
  } catch {
    return [];
  }

  const znalezione = new Map<string, OdkrytyKanalRss>();

  try {
    const res = await fetch(origin, {
      headers: { "User-Agent": "NaszawiesRSS-Discovery/1.0 (+https://naszawies.pl)" },
      signal: AbortSignal.timeout(15000),
      redirect: "follow",
    });
    if (res.ok) {
      const html = await res.text();
      for (const k of wyciagnijLinkiRssZHtml(html, origin)) {
        znalezione.set(k.feed_url, k);
      }
    }
  } catch {
    /* strona niedostępna — próbujemy typowe ścieżki */
  }

  for (const sciezka of TYPOWE_SCIEZKI_RSS) {
    const feed_url = `${origin}${sciezka}`;
    if (znalezione.has(feed_url)) continue;
    if (await czyFeedDziala(feed_url)) {
      znalezione.set(feed_url, {
        label: `RSS — ${domenaBezWww(origin)}`,
        feed_url,
        zrodlo: "typowa_sciezka",
      });
    }
  }

  return Array.from(znalezione.values()).slice(0, 8);
}

/** Propozycje feedów dla wsi: strona gminy z rekordu villages + opcjonalny BIP z linków. */
export async function proponujKanalyRssDlaWsi(dane: {
  commune?: string | null;
  county?: string | null;
  bipUrl?: string | null;
  stronaGminyUrl?: string | null;
}): Promise<OdkrytyKanalRss[]> {
  const kandydaci: string[] = [];
  if (dane.bipUrl?.trim()) kandydaci.push(dane.bipUrl.trim());
  if (dane.stronaGminyUrl?.trim()) kandydaci.push(dane.stronaGminyUrl.trim());

  const gmina = (dane.commune ?? "").toLowerCase().replace(/\s+/g, "");
  if (gmina && kandydaci.length === 0) {
    kandydaci.push(`https://${gmina}.pl`, `https://bip.${gmina}.pl`, `https://www.${gmina}.pl`);
  }

  const wszystkie = new Map<string, OdkrytyKanalRss>();
  for (const url of kandydaci) {
    const lista = await odkryjKanalyRssNaStronie(url);
    for (const k of lista) {
      wszystkie.set(k.feed_url, k);
    }
  }
  return Array.from(wszystkie.values()).slice(0, 10);
}
