-- Cache cen paliw (BenzynaMAPA) — stacje w całej Polsce, odświeżane cronem.

CREATE TABLE IF NOT EXISTS public.fuel_prices_stats (
  id text PRIMARY KEY DEFAULT 'latest',
  last_updated timestamptz,
  pb95_avg numeric,
  pb98_avg numeric,
  on_avg numeric,
  lpg_avg numeric,
  trend_pb95_7d numeric,
  trend_on_7d numeric,
  trend_lpg_7d numeric,
  total_stations integer,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.fuel_stations_cache (
  external_id text PRIMARY KEY,
  name text NOT NULL,
  brand text,
  lat numeric(10, 7) NOT NULL,
  lng numeric(10, 7) NOT NULL,
  city text,
  address text,
  pb95 numeric,
  pb98 numeric,
  "on" numeric,
  lpg numeric,
  price_source text,
  reported_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fuel_stations_cache_geo
  ON public.fuel_stations_cache (lat, lng);

CREATE INDEX IF NOT EXISTS idx_fuel_stations_cache_pb95
  ON public.fuel_stations_cache (pb95)
  WHERE pb95 IS NOT NULL;

ALTER TABLE public.fuel_prices_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_stations_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read fuel stats" ON public.fuel_prices_stats;
CREATE POLICY "Public read fuel stats"
  ON public.fuel_prices_stats FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Public read fuel stations" ON public.fuel_stations_cache;
CREATE POLICY "Public read fuel stations"
  ON public.fuel_stations_cache FOR SELECT
  USING (true);

COMMENT ON TABLE public.fuel_prices_stats IS
  'Średnie krajowe ceny paliw — synchronizacja z BenzynaMAPA (stats_latest.json).';
COMMENT ON TABLE public.fuel_stations_cache IS
  'Stacje paliw z cenami Pb95/ON/LPG — synchronizacja cron, filtrowane geograficznie na profilu wsi.';
