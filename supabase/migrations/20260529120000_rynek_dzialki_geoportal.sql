-- Rynek: sprzedaż działek / nieruchomości z geometrią z Geoportalu (ULDK)

ALTER TABLE marketplace_listings
  ADD COLUMN IF NOT EXISTS parcel_geojson jsonb,
  ADD COLUMN IF NOT EXISTS parcel_number text,
  ADD COLUMN IF NOT EXISTS cadastral_district text,
  ADD COLUMN IF NOT EXISTS parcel_area_m2 numeric,
  ADD COLUMN IF NOT EXISTS geoportal_parcel_id text;

COMMENT ON COLUMN marketplace_listings.parcel_geojson IS 'GeoJSON Polygon/MultiPolygon granicy działki (WGS84)';
COMMENT ON COLUMN marketplace_listings.parcel_number IS 'Numer działki ewidencyjnej';
COMMENT ON COLUMN marketplace_listings.cadastral_district IS 'Obręb ewidencyjny';
COMMENT ON COLUMN marketplace_listings.parcel_area_m2 IS 'Powierzchnia działki w m² (z ULDK lub obliczona)';
COMMENT ON COLUMN marketplace_listings.geoportal_parcel_id IS 'Pełny identyfikator działki w ULDK GUGiK';

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_parcel_geojson
  ON marketplace_listings USING gin (parcel_geojson)
  WHERE parcel_geojson IS NOT NULL;
