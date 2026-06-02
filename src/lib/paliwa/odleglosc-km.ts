const R_KM = 6371;

/** Odległość w km (wzor haversine). */
export function odlegloscKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Przybliżony bbox (stopnie) dla promienia w km. */
export function bboxDlaPromieniaKm(lat: number, promienKm: number): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} {
  const deltaLat = promienKm / 111;
  const deltaLng = promienKm / (111 * Math.max(Math.cos((lat * Math.PI) / 180), 0.15));
  return {
    minLat: lat - deltaLat,
    maxLat: lat + deltaLat,
    minLng: -180,
    maxLng: 180,
  };
}
