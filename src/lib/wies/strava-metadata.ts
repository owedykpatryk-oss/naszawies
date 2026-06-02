export type MetadaneStrava = {
  title: string | null;
  distanceMeters: number | null;
};

function dystansZTytuluStrava(title: string): number | null {
  const km = title.match(/([\d.,]+)\s*km/i);
  if (km) {
    const v = parseFloat(km[1].replace(",", "."));
    if (Number.isFinite(v) && v > 0) return Math.round(v * 1000);
  }
  const m = title.match(/([\d.,]+)\s*m(?!\w)/i);
  if (m) {
    const v = parseFloat(m[1].replace(",", "."));
    if (Number.isFinite(v) && v > 0) return Math.round(v);
  }
  return null;
}

/** Publiczne metadane aktywności Strava (oEmbed, bez OAuth). */
export async function pobierzMetadaneStrava(url: string): Promise<MetadaneStrava> {
  try {
    const res = await fetch(
      `https://www.strava.com/api/v3/oembed?url=${encodeURIComponent(url.trim())}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return { title: null, distanceMeters: null };
    const data = (await res.json()) as { title?: string };
    const title = typeof data.title === "string" ? data.title.trim() : null;
    return {
      title,
      distanceMeters: title ? dystansZTytuluStrava(title) : null,
    };
  } catch {
    return { title: null, distanceMeters: null };
  }
}

export function wyciagnijIdAktywnosciStrava(url: string): string | null {
  const m = url.match(/strava\.com\/activities\/(\d+)/i);
  return m?.[1] ?? null;
}
