-- Transport publiczny (kolej): cache odjazdów, status linii, ulubione relacje mieszkańca.

CREATE TABLE IF NOT EXISTS public.village_transport_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  poi_id UUID REFERENCES public.pois(id) ON DELETE SET NULL,
  station_id TEXT NOT NULL,
  station_name TEXT NOT NULL,
  station_name_source TEXT,
  distance_km NUMERIC(8,3),
  is_active BOOLEAN NOT NULL DEFAULT true,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (village_id, station_id)
);

CREATE INDEX IF NOT EXISTS idx_village_transport_stations_village
  ON public.village_transport_stations(village_id, is_active, distance_km);

CREATE TABLE IF NOT EXISTS public.transport_departures_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  station_id TEXT NOT NULL,
  station_name TEXT,
  departure_uid TEXT NOT NULL,
  train_label TEXT NOT NULL,
  destination TEXT,
  carrier TEXT,
  platform TEXT,
  planned_at TIMESTAMPTZ NOT NULL,
  realtime_at TIMESTAMPTZ,
  delay_min INT,
  status TEXT,
  is_cancelled BOOLEAN NOT NULL DEFAULT false,
  source_updated_at TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw JSONB,
  UNIQUE (village_id, station_id, departure_uid)
);

CREATE INDEX IF NOT EXISTS idx_transport_departures_cache_village_time
  ON public.transport_departures_cache(village_id, planned_at);

CREATE INDEX IF NOT EXISTS idx_transport_departures_cache_station_time
  ON public.transport_departures_cache(station_id, planned_at);

CREATE TABLE IF NOT EXISTS public.village_transport_line_status (
  village_id UUID PRIMARY KEY REFERENCES public.villages(id) ON DELETE CASCADE,
  status_color TEXT NOT NULL DEFAULT 'green',
  status_label TEXT NOT NULL DEFAULT 'Ruch bez większych zakłóceń',
  delayed_count INT NOT NULL DEFAULT 0,
  cancelled_count INT NOT NULL DEFAULT 0,
  observed_departures INT NOT NULL DEFAULT 0,
  last_realtime_at TIMESTAMPTZ,
  fallback_mode BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transport_sync_state (
  village_id UUID PRIMARY KEY REFERENCES public.villages(id) ON DELETE CASCADE,
  last_planned_sync_at TIMESTAMPTZ,
  last_realtime_sync_at TIMESTAMPTZ,
  last_error TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_transport_favorite_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  relation_key TEXT NOT NULL,
  title TEXT NOT NULL,
  target_label TEXT,
  target_station_id TEXT,
  target_station_name TEXT,
  notify_delay_min INT NOT NULL DEFAULT 15 CHECK (notify_delay_min BETWEEN 1 AND 240),
  notify_cancelled BOOLEAN NOT NULL DEFAULT true,
  notify_disruptions BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, village_id, relation_key)
);

CREATE INDEX IF NOT EXISTS idx_user_transport_favorite_relations_user
  ON public.user_transport_favorite_relations(user_id, village_id, is_active);

DROP TRIGGER IF EXISTS update_village_transport_stations_updated_at ON public.village_transport_stations;
CREATE TRIGGER update_village_transport_stations_updated_at
BEFORE UPDATE ON public.village_transport_stations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_village_transport_line_status_updated_at ON public.village_transport_line_status;
CREATE TRIGGER update_village_transport_line_status_updated_at
BEFORE UPDATE ON public.village_transport_line_status
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_transport_sync_state_updated_at ON public.transport_sync_state;
CREATE TRIGGER update_transport_sync_state_updated_at
BEFORE UPDATE ON public.transport_sync_state
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_transport_favorite_relations_updated_at ON public.user_transport_favorite_relations;
CREATE TRIGGER update_user_transport_favorite_relations_updated_at
BEFORE UPDATE ON public.user_transport_favorite_relations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.village_transport_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_departures_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.village_transport_line_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_sync_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_transport_favorite_relations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public village transport stations visible" ON public.village_transport_stations;
CREATE POLICY "Public village transport stations visible"
ON public.village_transport_stations
FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Soltys manages village transport stations" ON public.village_transport_stations;
CREATE POLICY "Soltys manages village transport stations"
ON public.village_transport_stations
FOR ALL
USING (public.is_village_soltys(village_id))
WITH CHECK (public.is_village_soltys(village_id));

DROP POLICY IF EXISTS "Public departures cache visible" ON public.transport_departures_cache;
CREATE POLICY "Public departures cache visible"
ON public.transport_departures_cache
FOR SELECT
USING (planned_at > now() - interval '12 hours' AND planned_at < now() + interval '48 hours');

DROP POLICY IF EXISTS "Public transport line status visible" ON public.village_transport_line_status;
CREATE POLICY "Public transport line status visible"
ON public.village_transport_line_status
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Only platform admin reads transport sync state" ON public.transport_sync_state;
CREATE POLICY "Only platform admin reads transport sync state"
ON public.transport_sync_state
FOR SELECT
USING (public.is_platform_admin());

DROP POLICY IF EXISTS "Resident reads own transport favorites" ON public.user_transport_favorite_relations;
CREATE POLICY "Resident reads own transport favorites"
ON public.user_transport_favorite_relations
FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Resident manages own transport favorites" ON public.user_transport_favorite_relations;
CREATE POLICY "Resident manages own transport favorites"
ON public.user_transport_favorite_relations
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND (public.is_village_resident(village_id) OR public.is_village_soltys(village_id))
);
