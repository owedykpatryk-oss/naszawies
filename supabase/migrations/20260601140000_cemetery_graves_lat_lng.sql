-- Współrzędne grobów (georeferencja planu ↔ obrys OSM).

ALTER TABLE public.cemetery_grave_records
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);

CREATE INDEX IF NOT EXISTS idx_cemetery_graves_geo
  ON public.cemetery_grave_records (cemetery_plan_id, latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
