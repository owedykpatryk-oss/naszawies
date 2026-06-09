/** Czy wieś ma urzędowy obrys PRG (GeoJSON w bazie lub flaga z lekkiego RPC). */
export function wiesMaObrys(w: {
  boundary_geojson?: unknown | null;
  has_boundary?: boolean;
}): boolean {
  if (w.has_boundary === true) return true;
  if (w.has_boundary === false) return false;
  return w.boundary_geojson != null && typeof w.boundary_geojson === "object";
}
