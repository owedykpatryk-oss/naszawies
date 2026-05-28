-- Rejon polowania na mapie (GeoJSON Polygon)
ALTER TABLE public.village_hunting_notices
  ADD COLUMN IF NOT EXISTS area_geojson JSONB;

COMMENT ON COLUMN public.village_hunting_notices.area_geojson IS
  'GeoJSON Polygon — zaznaczony obszar polowania (współrzędne [lon, lat]).';
