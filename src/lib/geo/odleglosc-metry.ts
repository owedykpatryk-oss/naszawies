/** Odległość między dwoma punktami WGS84 (metry). */
export function odlegloscMetry(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatujOdleglosc(metry: number): string {
  if (!Number.isFinite(metry)) return "—";
  if (metry < 1000) return `${Math.round(metry)} m`;
  return `${(metry / 1000).toFixed(metry < 10_000 ? 1 : 0)} km`;
}
