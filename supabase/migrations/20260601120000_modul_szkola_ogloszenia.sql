-- Moduł szkoły: tablica ogłoszeń szkolnych
CREATE TABLE IF NOT EXISTS public.school_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  school_group_id UUID REFERENCES public.village_community_groups(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT,
  audience TEXT NOT NULL DEFAULT 'ogolne',
  class_label TEXT,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  attachment_url TEXT,
  valid_until TIMESTAMPTZ,
  status public.publication_status NOT NULL DEFAULT 'approved',
  published_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT school_announcements_audience_check CHECK (
    audience IN ('ogolne', 'rodzice', 'kadra', 'klasy_1_3', 'klasy_4_6', 'klasy_7_8', 'klasa')
  )
);

CREATE INDEX IF NOT EXISTS idx_school_announcements_village ON public.school_announcements(village_id);
CREATE INDEX IF NOT EXISTS idx_school_announcements_published ON public.school_announcements(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_school_announcements_pinned ON public.school_announcements(village_id, is_pinned) WHERE is_pinned = true;

ALTER TABLE public.school_announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read approved school announcements" ON public.school_announcements;
CREATE POLICY "Public read approved school announcements"
ON public.school_announcements FOR SELECT
USING (status = 'approved' AND (valid_until IS NULL OR valid_until > now()));

DROP POLICY IF EXISTS "Soltys manages school announcements" ON public.school_announcements;
CREATE POLICY "Soltys manages school announcements"
ON public.school_announcements FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_village_roles uvr
    WHERE uvr.user_id = auth.uid()
      AND uvr.village_id = school_announcements.village_id
      AND uvr.status = 'active'
      AND uvr.role IN ('soltys', 'wspoladmin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_village_roles uvr
    WHERE uvr.user_id = auth.uid()
      AND uvr.village_id = school_announcements.village_id
      AND uvr.status = 'active'
      AND uvr.role IN ('soltys', 'wspoladmin')
  )
);

COMMENT ON TABLE public.school_announcements IS 'Tablica ogłoszeń szkoły na profilu wsi (moduł szkola).';
