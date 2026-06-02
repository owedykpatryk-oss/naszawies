const NOWOSC_MS = 7 * 24 * 60 * 60 * 1000;
const POPULARNE_MIN_WYSWIETLEN = 15;

export function czyOgloszenieNowe(publishedAt: string | null, createdAt: string): boolean {
  const ts = Date.parse(publishedAt ?? createdAt);
  if (!Number.isFinite(ts)) return false;
  return Date.now() - ts < NOWOSC_MS;
}

export function czyOgloszeniePopularne(viewCount: number | null | undefined): boolean {
  return (viewCount ?? 0) >= POPULARNE_MIN_WYSWIETLEN;
}

export function czyOgloszenieOddam(listingType: string, priceAmount: number | null): boolean {
  return listingType === "oddam" || priceAmount === 0;
}
