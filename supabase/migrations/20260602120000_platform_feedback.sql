-- Opinie i sugestie użytkowników platformy (ankieta 14 dni + dobrowolne zgłoszenia)

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS feedback_prompt_snooze_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS feedback_never_ask BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.users.feedback_prompt_snooze_until IS 'Ukryj automatyczny prompt do tej daty (np. „przypomnij za tydzień”).';
COMMENT ON COLUMN public.users.feedback_never_ask IS 'Użytkownik wybrał „nie pytaj więcej” o automatyczną ankietę.';

CREATE TABLE IF NOT EXISTS public.platform_user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  village_id UUID REFERENCES public.villages(id) ON DELETE SET NULL,
  survey_kind TEXT NOT NULL,
  rating_overall SMALLINT,
  rating_ease SMALLINT,
  what_works TEXT,
  what_improve TEXT,
  free_notes TEXT,
  page_path TEXT,
  user_role_snapshot TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  admin_status TEXT NOT NULL DEFAULT 'new',
  admin_notes TEXT,
  admin_updated_at TIMESTAMPTZ,
  admin_updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  CONSTRAINT chk_platform_feedback_kind CHECK (
    survey_kind IN ('onboarding_14d', 'voluntary', 'prompt')
  ),
  CONSTRAINT chk_platform_feedback_rating_overall CHECK (
    rating_overall IS NULL OR (rating_overall >= 1 AND rating_overall <= 5)
  ),
  CONSTRAINT chk_platform_feedback_rating_ease CHECK (
    rating_ease IS NULL OR (rating_ease >= 1 AND rating_ease <= 5)
  ),
  CONSTRAINT chk_platform_feedback_admin_status CHECK (
    admin_status IN ('new', 'read', 'planned', 'done')
  )
);

CREATE INDEX IF NOT EXISTS idx_platform_feedback_created
  ON public.platform_user_feedback (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_feedback_user_kind
  ON public.platform_user_feedback (user_id, survey_kind);

CREATE INDEX IF NOT EXISTS idx_platform_feedback_admin_status
  ON public.platform_user_feedback (admin_status, created_at DESC);

ALTER TABLE public.platform_user_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User inserts own platform feedback" ON public.platform_user_feedback;
CREATE POLICY "User inserts own platform feedback"
ON public.platform_user_feedback FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "User reads own platform feedback" ON public.platform_user_feedback;
CREATE POLICY "User reads own platform feedback"
ON public.platform_user_feedback FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Platform admin reads all feedback" ON public.platform_user_feedback;
CREATE POLICY "Platform admin reads all feedback"
ON public.platform_user_feedback FOR SELECT
TO authenticated
USING (public.is_platform_admin());

DROP POLICY IF EXISTS "Platform admin updates feedback admin fields" ON public.platform_user_feedback;
CREATE POLICY "Platform admin updates feedback admin fields"
ON public.platform_user_feedback FOR UPDATE
TO authenticated
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());
