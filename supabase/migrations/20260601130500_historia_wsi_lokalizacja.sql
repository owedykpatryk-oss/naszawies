-- Lokalizacja i etykieta miejsca dla wpisów historii wsi
ALTER TABLE public.village_history_entries
  ADD COLUMN IF NOT EXISTS location_label TEXT,
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

COMMENT ON COLUMN public.village_history_entries.location_label IS 'Opis miejsca zdarzenia (np. rynek, stary kościół)';
COMMENT ON COLUMN public.village_history_entries.latitude IS 'Szerokość geograficzna pinezki na mapie';
COMMENT ON COLUMN public.village_history_entries.longitude IS 'Długość geograficzna pinezki na mapie';

CREATE INDEX IF NOT EXISTS idx_history_entries_geo
  ON public.village_history_entries (village_id)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
