-- Ulubiona gmina bez przypisanej wsi + zapisane ogłoszenia / wydarzenia.

CREATE TABLE IF NOT EXISTS public.user_commune_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  voivodeship TEXT NOT NULL,
  county TEXT NOT NULL,
  commune TEXT NOT NULL,
  notify_posts BOOLEAN NOT NULL DEFAULT true,
  notify_events BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, voivodeship, county, commune)
);

CREATE INDEX IF NOT EXISTS idx_user_commune_follows_user ON public.user_commune_follows(user_id);

ALTER TABLE public.user_commune_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own commune follows" ON public.user_commune_follows;
CREATE POLICY "Users manage own commune follows"
  ON public.user_commune_follows
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.user_saved_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'event')),
  content_id UUID NOT NULL,
  title_cache TEXT NOT NULL,
  href_cache TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, content_type, content_id)
);

CREATE INDEX IF NOT EXISTS idx_user_saved_content_user ON public.user_saved_content(user_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_content_village ON public.user_saved_content(village_id);

ALTER TABLE public.user_saved_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own saved content" ON public.user_saved_content;
CREATE POLICY "Users manage own saved content"
  ON public.user_saved_content
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
