-- Kreator grafiki: zaproszenia, dyplomy, plakaty — zapis projektów per użytkownik / wieś

CREATE TABLE IF NOT EXISTS public.village_graphic_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID REFERENCES public.villages(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  title TEXT NOT NULL,
  theme_id TEXT NOT NULL DEFAULT 'zielony-wies',
  field_values JSONB NOT NULL DEFAULT '{}'::jsonb,
  logo_data_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_village_graphic_designs_village
  ON public.village_graphic_designs(village_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_village_graphic_designs_user
  ON public.village_graphic_designs(created_by, updated_at DESC);

ALTER TABLE public.village_graphic_designs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own graphic designs" ON public.village_graphic_designs;
CREATE POLICY "Users read own graphic designs"
  ON public.village_graphic_designs FOR SELECT
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users insert own graphic designs" ON public.village_graphic_designs;
CREATE POLICY "Users insert own graphic designs"
  ON public.village_graphic_designs FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND (
      village_id IS NULL
      OR public.is_village_soltys(village_id)
      OR public.is_village_resident(village_id)
    )
  );

DROP POLICY IF EXISTS "Users update own graphic designs" ON public.village_graphic_designs;
CREATE POLICY "Users update own graphic designs"
  ON public.village_graphic_designs FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users delete own graphic designs" ON public.village_graphic_designs;
CREATE POLICY "Users delete own graphic designs"
  ON public.village_graphic_designs FOR DELETE
  USING (created_by = auth.uid());

COMMENT ON TABLE public.village_graphic_designs IS
  'Zapisane projekty kreatora grafiki (zaproszenia, dyplomy, plakaty) — eksport PDF po stronie klienta.';
