export type BboxMapy = {
  south: number;
  west: number;
  north: number;
  east: number;
};

export function punktWBbox(lat: number, lon: number, bbox: BboxMapy, marginesStopni = 0.08): boolean {
  return (
    lat >= bbox.south - marginesStopni &&
    lat <= bbox.north + marginesStopni &&
    lon >= bbox.west - marginesStopni &&
    lon <= bbox.east + marginesStopni
  );
}

export function filtrujZnacznikiWBbox<T extends { lat: number; lon: number }>(
  znaczniki: T[],
  bbox: BboxMapy | null,
  limit: number,
): T[] {
  if (!bbox) return znaczniki.slice(0, limit);
  const w = znaczniki.filter((z) => punktWBbox(z.lat, z.lon, bbox));
  return w.length > 0 ? w.slice(0, limit) : znaczniki.slice(0, Math.min(limit, 40));
}
