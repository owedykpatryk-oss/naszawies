type PrzystanekPoi = {
  id: string;
  name: string;
  latitude: number | string | null;
  longitude: number | string | null;
};

function odlegloscM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function normNazwa(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Najbliższy POI „przystanek” dla nazwy przystanku z GTFS/API (heurystyka). */
export function dopasujPoiPrzystanku(
  pois: PrzystanekPoi[],
  stopName: string,
  wiesLat: number,
  wiesLon: number,
): string | null {
  if (pois.length === 0) return null;

  const stopNorm = normNazwa(stopName);
  const slowaStop = stopNorm.split(/\s+/).filter((w) => w.length >= 4);

  let najlepszy: { id: string; score: number } | null = null;

  for (const p of pois) {
    const plat = Number(p.latitude);
    const plon = Number(p.longitude);
    const poiNorm = normNazwa(p.name);
    let score = 0;

    if (poiNorm && stopNorm && (poiNorm.includes(stopNorm) || stopNorm.includes(poiNorm))) {
      score += 50;
    }
    for (const w of slowaStop) {
      if (poiNorm.includes(w)) score += 12;
    }
    if (Number.isFinite(plat) && Number.isFinite(plon)) {
      const m = odlegloscM(wiesLat, wiesLon, plat, plon);
      if (m < 500) score += 30;
      else if (m < 2000) score += 15;
      else if (m < 5000) score += 5;
    }

    if (!najlepszy || score > najlepszy.score) {
      najlepszy = { id: p.id, score };
    }
  }

  return najlepszy && najlepszy.score >= 10 ? najlepszy.id : null;
}
