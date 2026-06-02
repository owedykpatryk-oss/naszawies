-- Unikalny link Strava na użytkownika we wsi (bez duplikatów importu).

CREATE UNIQUE INDEX IF NOT EXISTS idx_village_fitness_strava_per_user
  ON public.village_fitness_activities (village_id, user_id, strava_url)
  WHERE strava_url IS NOT NULL AND status <> 'rejected';
