-- Połączenia OAuth Strava (tokeny — tylko serwer / service role).

ALTER TYPE public.fitness_activity_source ADD VALUE IF NOT EXISTS 'strava_oauth';

ALTER TABLE public.village_fitness_activities
  ADD COLUMN IF NOT EXISTS strava_activity_id BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_village_fitness_strava_activity_id
  ON public.village_fitness_activities (village_id, user_id, strava_activity_id)
  WHERE strava_activity_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.user_strava_connections (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  strava_athlete_id BIGINT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  scopes TEXT,
  athlete_firstname TEXT,
  athlete_lastname TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS update_user_strava_connections_updated_at ON public.user_strava_connections;
CREATE TRIGGER update_user_strava_connections_updated_at
BEFORE UPDATE ON public.user_strava_connections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.user_strava_connections ENABLE ROW LEVEL SECURITY;

-- Brak polityk dla authenticated — tokeny tylko przez service role (Server Actions / API).

CREATE OR REPLACE FUNCTION public.czy_uzytkownik_polaczony_ze_strava(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_strava_connections c WHERE c.user_id = p_user_id
  );
$$;

GRANT EXECUTE ON FUNCTION public.czy_uzytkownik_polaczony_ze_strava(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.czy_uzytkownik_polaczony_ze_strava(UUID) TO service_role;
