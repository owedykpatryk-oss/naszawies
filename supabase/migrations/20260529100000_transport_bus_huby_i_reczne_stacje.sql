-- Autobusy (cache), ręczne mapowanie stacji PKP, sync autobusów

ALTER TABLE public.village_transport_stations
  ADD COLUMN IF NOT EXISTS is_manual_override BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.village_transport_stations.is_manual_override IS
  'Gdy true — synchronizacja OSM nie nadpisuje station_id (mapowanie sołtysa).';

CREATE TABLE IF NOT EXISTS public.bus_departures_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  poi_id UUID REFERENCES public.pois(id) ON DELETE SET NULL,
  stop_id TEXT NOT NULL,
  stop_name TEXT,
  departure_uid TEXT NOT NULL,
  line_label TEXT NOT NULL,
  destination TEXT,
  carrier TEXT,
  planned_at TIMESTAMPTZ NOT NULL,
  provider TEXT NOT NULL DEFAULT 'zewnetrzny'
    CHECK (provider IN ('gtfs', 'epodroznik', 'zewnetrzny', 'manual')),
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw JSONB,
  UNIQUE (village_id, stop_id, departure_uid)
);

CREATE INDEX IF NOT EXISTS idx_bus_departures_cache_village_time
  ON public.bus_departures_cache(village_id, planned_at);

ALTER TABLE public.transport_sync_state
  ADD COLUMN IF NOT EXISTS last_bus_sync_at TIMESTAMPTZ;

ALTER TABLE public.bus_departures_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public bus departures visible" ON public.bus_departures_cache;
CREATE POLICY "Public bus departures visible"
ON public.bus_departures_cache
FOR SELECT
USING (
  planned_at >= now() - interval '2 hours'
  AND planned_at <= now() + interval '48 hours'
);
