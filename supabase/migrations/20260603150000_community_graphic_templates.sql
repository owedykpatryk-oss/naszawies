-- Tło: siła białego overlay (czytelność tekstu na zdjęciu)
ALTER TABLE public.village_graphic_designs
  ADD COLUMN IF NOT EXISTS background_overlay REAL NOT NULL DEFAULT 0.45;

COMMENT ON COLUMN public.village_graphic_designs.background_overlay IS
  '0 = pełne zdjęcie tła, 1 = maksymalne wybielenie overlay (czytelność tekstu).';

-- Szablony udostępnione przez użytkowników — widoczne dla wszystkich
CREATE TABLE IF NOT EXISTS public.community_graphic_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  village_id UUID REFERENCES public.villages(id) ON DELETE SET NULL,
  village_name TEXT,
  title TEXT NOT NULL,
  description TEXT,
  template_id TEXT NOT NULL,
  theme_id TEXT NOT NULL,
  field_values JSONB NOT NULL DEFAULT '{}'::jsonb,
  logo_data_url TEXT,
  background_data_url TEXT,
  background_overlay REAL NOT NULL DEFAULT 0.45,
  qr_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_graphic_templates_public
  ON public.community_graphic_templates (created_at DESC)
  WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_community_graphic_templates_author
  ON public.community_graphic_templates (created_by, updated_at DESC);

ALTER TABLE public.community_graphic_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read community graphic templates" ON public.community_graphic_templates;
CREATE POLICY "Public read community graphic templates"
  ON public.community_graphic_templates FOR SELECT
  USING (is_public = true);

DROP POLICY IF EXISTS "Users insert own community templates" ON public.community_graphic_templates;
CREATE POLICY "Users insert own community templates"
  ON public.community_graphic_templates FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users update own community templates" ON public.community_graphic_templates;
CREATE POLICY "Users update own community templates"
  ON public.community_graphic_templates FOR UPDATE
  USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users delete own community templates" ON public.community_graphic_templates;
CREATE POLICY "Users delete own community templates"
  ON public.community_graphic_templates FOR DELETE
  USING (auth.uid() = created_by);

COMMENT ON TABLE public.community_graphic_templates IS
  'Szablony graficzne udostępnione przez sołtysów/mieszkańców — każdy może podejrzeć i skopiować.';
