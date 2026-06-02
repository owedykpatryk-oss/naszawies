-- Aktywności fitness mieszkańców (bieg, nordic walking, rower…) + nowe rodzaje wydarzeń sportowych.

ALTER TYPE public.village_event_kind ADD VALUE IF NOT EXISTS 'trening';
ALTER TYPE public.village_event_kind ADD VALUE IF NOT EXISTS 'spacer';
ALTER TYPE public.village_event_kind ADD VALUE IF NOT EXISTS 'rajd';

DO $$ BEGIN
  CREATE TYPE public.fitness_activity_kind AS ENUM (
    'bieg',
    'nordic_walking',
    'rower',
    'turystyka',
    'inne'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.fitness_activity_source AS ENUM ('manual', 'strava_link', 'gpx');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.village_fitness_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.village_community_groups(id) ON DELETE SET NULL,
  activity_kind public.fitness_activity_kind NOT NULL DEFAULT 'inne',
  title TEXT NOT NULL,
  activity_date TIMESTAMPTZ NOT NULL,
  duration_seconds INT CHECK (duration_seconds IS NULL OR duration_seconds > 0),
  distance_meters INT CHECK (distance_meters IS NULL OR distance_meters > 0),
  source public.fitness_activity_source NOT NULL DEFAULT 'manual',
  strava_url TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT village_fitness_activities_title_len CHECK (char_length(title) >= 2 AND char_length(title) <= 200),
  CONSTRAINT village_fitness_activities_notes_len CHECK (notes IS NULL OR char_length(notes) <= 2000),
  CONSTRAINT village_fitness_activities_strava_url_len CHECK (strava_url IS NULL OR char_length(strava_url) <= 2048)
);

CREATE INDEX IF NOT EXISTS idx_village_fitness_activities_village_date
  ON public.village_fitness_activities (village_id, activity_date DESC)
  WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_village_fitness_activities_user
  ON public.village_fitness_activities (user_id, created_at DESC);

DROP TRIGGER IF EXISTS update_village_fitness_activities_updated_at ON public.village_fitness_activities;
CREATE TRIGGER update_village_fitness_activities_updated_at
BEFORE UPDATE ON public.village_fitness_activities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.village_fitness_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public approved fitness activities" ON public.village_fitness_activities;
CREATE POLICY "Public approved fitness activities"
  ON public.village_fitness_activities
  FOR SELECT
  USING (
    status = 'approved'
    AND EXISTS (
      SELECT 1 FROM public.villages v
      WHERE v.id = village_id AND v.is_active = true
    )
  );

DROP POLICY IF EXISTS "Authors see own fitness activities" ON public.village_fitness_activities;
CREATE POLICY "Authors see own fitness activities"
  ON public.village_fitness_activities
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Soltys sees village fitness activities" ON public.village_fitness_activities;
CREATE POLICY "Soltys sees village fitness activities"
  ON public.village_fitness_activities
  FOR SELECT
  USING (public.is_village_soltys(village_id));

DROP POLICY IF EXISTS "Residents add fitness activities" ON public.village_fitness_activities;
CREATE POLICY "Residents add fitness activities"
  ON public.village_fitness_activities
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_village_resident(village_id)
    AND status IN ('pending', 'approved')
  );

DROP POLICY IF EXISTS "Authors edit own fitness activities" ON public.village_fitness_activities;
CREATE POLICY "Authors edit own fitness activities"
  ON public.village_fitness_activities
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Authors delete own fitness activities" ON public.village_fitness_activities;
CREATE POLICY "Authors delete own fitness activities"
  ON public.village_fitness_activities
  FOR DELETE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Soltys manages fitness activities" ON public.village_fitness_activities;
CREATE POLICY "Soltys manages fitness activities"
  ON public.village_fitness_activities
  FOR ALL
  USING (public.is_village_soltys(village_id))
  WITH CHECK (public.is_village_soltys(village_id));
