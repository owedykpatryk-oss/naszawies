-- Cache mapowania powiat → region GUS (mniej zapytań API przy synchronizacji).

CREATE TABLE IF NOT EXISTS public.agri_powiat_region_cache (
  powiat_teryt_kod text PRIMARY KEY,
  county text NOT NULL,
  voivodeship text NOT NULL,
  gus_region_id text NOT NULL,
  gus_region_nazwa text NOT NULL,
  resolved_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agri_powiat_region_cache_region
  ON public.agri_powiat_region_cache (gus_region_id);

ALTER TABLE public.agri_powiat_region_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read agri powiat region cache" ON public.agri_powiat_region_cache;
CREATE POLICY "Public read agri powiat region cache"
ON public.agri_powiat_region_cache FOR SELECT
USING (true);

COMMENT ON TABLE public.agri_powiat_region_cache IS
  'Mapowanie powiat_teryt_kod → region NUTS2 BDL; uzupełniane przez cron GUS.';
