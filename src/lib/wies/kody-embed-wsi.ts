/** Publiczne adresy widgetów do osadzenia na stronie gminy (iframe). */

export function bazowyUrlWitryny(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (env) return env;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://naszawies.pl";
}

export function urlEmbedKalendarzWsi(villageId: string): string {
  return `${bazowyUrlWitryny()}/embed/wies/${villageId}/kalendarz`;
}

export function urlEmbedRynekWsi(villageId: string): string {
  return `${bazowyUrlWitryny()}/embed/wies/${villageId}/rynek`;
}

export function urlEmbedSzkolaWsi(villageId: string): string {
  return `${bazowyUrlWitryny()}/embed/wies/${villageId}/szkola`;
}

export function urlEmbedHistoriaWsi(villageId: string): string {
  return `${bazowyUrlWitryny()}/embed/wies/${villageId}/historia`;
}

export function urlEmbedSportWsi(villageId: string): string {
  return `${bazowyUrlWitryny()}/embed/wies/${villageId}/sport`;
}

export function kodIframeEmbed(src: string, wysokosc = 480): string {
  return `<iframe src="${src}" width="100%" height="${wysokosc}" style="border:0;border-radius:12px;max-width:100%" loading="lazy" title="naszawies.pl — widget wsi"></iframe>`;
}

export type KodyEmbedWsi = {
  kalendarz: { url: string; iframe: string };
  rynek: { url: string; iframe: string };
  szkola: { url: string; iframe: string };
  historia: { url: string; iframe: string };
  sport: { url: string; iframe: string };
};

export function zbudujKodyEmbedWsi(villageId: string): KodyEmbedWsi {
  const kalendarzUrl = urlEmbedKalendarzWsi(villageId);
  const rynekUrl = urlEmbedRynekWsi(villageId);
  const szkolaUrl = urlEmbedSzkolaWsi(villageId);
  const historiaUrl = urlEmbedHistoriaWsi(villageId);
  const sportUrl = urlEmbedSportWsi(villageId);
  return {
    kalendarz: { url: kalendarzUrl, iframe: kodIframeEmbed(kalendarzUrl, 520) },
    rynek: { url: rynekUrl, iframe: kodIframeEmbed(rynekUrl, 640) },
    szkola: { url: szkolaUrl, iframe: kodIframeEmbed(szkolaUrl, 560) },
    historia: { url: historiaUrl, iframe: kodIframeEmbed(historiaUrl, 520) },
    sport: { url: sportUrl, iframe: kodIframeEmbed(sportUrl, 480) },
  };
}
