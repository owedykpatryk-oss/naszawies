-- Ustawienia wyglądu i układu profilu wsi (sołtys)

CREATE TABLE IF NOT EXISTS public.village_settings (
  village_id UUID PRIMARY KEY REFERENCES public.villages(id) ON DELETE CASCADE,
  theme_id TEXT NOT NULL DEFAULT 'zielony-wies',
  logo_url TEXT,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_village_settings_theme ON public.village_settings(theme_id);

ALTER TABLE public.village_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read village settings" ON public.village_settings;
CREATE POLICY "Public read village settings"
  ON public.village_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Soltys manages village settings" ON public.village_settings;
CREATE POLICY "Soltys manages village settings"
  ON public.village_settings FOR ALL
  USING (public.is_village_soltys(village_id) OR public.is_platform_admin())
  WITH CHECK (public.is_village_soltys(village_id) OR public.is_platform_admin());

COMMENT ON TABLE public.village_settings IS
  'Motyw kolorystyczny, logo i układ modułów publicznego profilu wsi.';
