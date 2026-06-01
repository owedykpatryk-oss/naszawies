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

export function kodIframeEmbed(src: string, wysokosc = 480): string {
  return `<iframe src="${src}" width="100%" height="${wysokosc}" style="border:0;border-radius:12px;max-width:100%" loading="lazy" title="naszawies.pl — widget wsi"></iframe>`;
}

export type KodyEmbedWsi = {
  kalendarz: { url: string; iframe: string };
  rynek: { url: string; iframe: string };
};

export function zbudujKodyEmbedWsi(villageId: string): KodyEmbedWsi {
  const kalendarzUrl = urlEmbedKalendarzWsi(villageId);
  const rynekUrl = urlEmbedRynekWsi(villageId);
  return {
    kalendarz: { url: kalendarzUrl, iframe: kodIframeEmbed(kalendarzUrl, 520) },
    rynek: { url: rynekUrl, iframe: kodIframeEmbed(rynekUrl, 640) },
  };
}
