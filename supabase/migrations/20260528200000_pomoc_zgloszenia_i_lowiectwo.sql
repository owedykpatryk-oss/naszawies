-- Zgłoszenia problemów ze stroną + ostrzeżenia polowań (koła łowieckie)

CREATE TABLE IF NOT EXISTS public.site_feedback_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  category TEXT NOT NULL DEFAULT 'inny'
    CHECK (category IN ('blad_strony', 'logowanie', 'panel', 'mapa', 'platnosci', 'pomysl', 'inny')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  page_url TEXT,
  contact_email TEXT,
  user_agent TEXT,
  status TEXT NOT NULL DEFAULT 'nowe'
    CHECK (status IN ('nowe', 'w_trakcie', 'zamkniete')),
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT site_feedback_title_len CHECK (char_length(title) <= 200),
  CONSTRAINT site_feedback_desc_len CHECK (char_length(description) <= 8000)
);

CREATE INDEX IF NOT EXISTS idx_site_feedback_status ON public.site_feedback_reports(status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.village_hunting_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  area_description TEXT NOT NULL,
  safety_note TEXT,
  contact_phone TEXT,
  contact_name TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
  moderated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  moderated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT hunting_notice_title_len CHECK (char_length(title) <= 160),
  CONSTRAINT hunting_dates_ok CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_hunting_notices_village ON public.village_hunting_notices(village_id, status);
CREATE INDEX IF NOT EXISTS idx_hunting_notices_active ON public.village_hunting_notices(village_id, starts_at, ends_at)
  WHERE status = 'approved';

DROP TRIGGER IF EXISTS update_site_feedback_reports_updated_at ON public.site_feedback_reports;
CREATE TRIGGER update_site_feedback_reports_updated_at
BEFORE UPDATE ON public.site_feedback_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_village_hunting_notices_updated_at ON public.village_hunting_notices;
CREATE TRIGGER update_village_hunting_notices_updated_at
BEFORE UPDATE ON public.village_hunting_notices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.site_feedback_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.village_hunting_notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit site feedback" ON public.site_feedback_reports;
CREATE POLICY "Anyone can submit site feedback"
ON public.site_feedback_reports
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

DROP POLICY IF EXISTS "User sees own site feedback" ON public.site_feedback_reports;
CREATE POLICY "User sees own site feedback"
ON public.site_feedback_reports
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Public active hunting notices" ON public.village_hunting_notices;
CREATE POLICY "Public active hunting notices"
ON public.village_hunting_notices
FOR SELECT
USING (
  status = 'approved'
  AND now() <= ends_at + interval '1 day'
);

DROP POLICY IF EXISTS "Soltys manages hunting notices" ON public.village_hunting_notices;
CREATE POLICY "Soltys manages hunting notices"
ON public.village_hunting_notices
FOR ALL
USING (public.is_village_soltys(village_id))
WITH CHECK (public.is_village_soltys(village_id));

DROP POLICY IF EXISTS "Residents insert hunting notice draft" ON public.village_hunting_notices;
CREATE POLICY "Residents insert hunting notice draft"
ON public.village_hunting_notices
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND status = 'pending'
  AND public.is_village_resident(village_id)
);

DROP POLICY IF EXISTS "Author sees own hunting notices" ON public.village_hunting_notices;
CREATE POLICY "Author sees own hunting notices"
ON public.village_hunting_notices
FOR SELECT
TO authenticated
USING (created_by = auth.uid());
