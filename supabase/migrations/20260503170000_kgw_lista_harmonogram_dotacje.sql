-- Wspólna lista zakupów (KGW / wieś), tygodniowy plan stałych zajęć, katalog możliwych źródeł dofinansowania (informacyjnie)

-- =========================================
-- Lista zakupów
-- =========================================

CREATE TABLE IF NOT EXISTS public.village_shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  note TEXT,
  quantity_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_done BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT village_shopping_title_len CHECK (char_length(title) <= 240),
  CONSTRAINT village_shopping_note_len CHECK (note IS NULL OR char_length(note) <= 500)
);

CREATE INDEX IF NOT EXISTS idx_village_shopping_village ON public.village_shopping_list_items(village_id);
CREATE INDEX IF NOT EXISTS idx_village_shopping_done ON public.village_shopping_list_items(village_id, is_done);

DROP TRIGGER IF EXISTS update_village_shopping_list_items_updated_at ON public.village_shopping_list_items;
CREATE TRIGGER update_village_shopping_list_items_updated_at
BEFORE UPDATE ON public.village_shopping_list_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.village_shopping_list_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public shopping list read active village" ON public.village_shopping_list_items;
CREATE POLICY "Public shopping list read active village"
ON public.village_shopping_list_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.villages v
    WHERE v.id = village_id
      AND (
        v.is_active = true
        OR public.is_village_resident(village_id)
        OR public.is_village_soltys(village_id)
      )
  )
);

DROP POLICY IF EXISTS "Residents insert shopping items" ON public.village_shopping_list_items;
CREATE POLICY "Residents insert shopping items"
ON public.village_shopping_list_items
FOR INSERT
WITH CHECK (
  public.is_village_resident(village_id) OR public.is_village_soltys(village_id)
);

DROP POLICY IF EXISTS "Residents update shopping items" ON public.village_shopping_list_items;
CREATE POLICY "Residents update shopping items"
ON public.village_shopping_list_items
FOR UPDATE
USING (public.is_village_resident(village_id) OR public.is_village_soltys(village_id))
WITH CHECK (public.is_village_resident(village_id) OR public.is_village_soltys(village_id));

DROP POLICY IF EXISTS "Residents delete own or soltys any shopping" ON public.village_shopping_list_items;
CREATE POLICY "Residents delete own or soltys any shopping"
ON public.village_shopping_list_items
FOR DELETE
USING (
  public.is_village_soltys(village_id)
  OR (
    public.is_village_resident(village_id)
    AND created_by IS NOT NULL
    AND created_by = auth.uid()
  )
);

-- =========================================
-- Tygodniowy harmonogram (stałe zajęcia)
-- =========================================

CREATE TABLE IF NOT EXISTS public.village_weekly_schedule_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  time_start TIME NOT NULL,
  time_end TIME,
  title TEXT NOT NULL,
  description TEXT,
  group_id UUID REFERENCES public.village_community_groups(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT village_weekly_title_len CHECK (char_length(title) <= 200),
  CONSTRAINT village_weekly_desc_len CHECK (description IS NULL OR char_length(description) <= 2000)
);

CREATE INDEX IF NOT EXISTS idx_village_weekly_village ON public.village_weekly_schedule_slots(village_id);
CREATE INDEX IF NOT EXISTS idx_village_weekly_day ON public.village_weekly_schedule_slots(village_id, day_of_week, time_start);

DROP TRIGGER IF EXISTS update_village_weekly_schedule_slots_updated_at ON public.village_weekly_schedule_slots;
CREATE TRIGGER update_village_weekly_schedule_slots_updated_at
BEFORE UPDATE ON public.village_weekly_schedule_slots
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.village_weekly_schedule_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public weekly slots read active village" ON public.village_weekly_schedule_slots;
CREATE POLICY "Public weekly slots read active village"
ON public.village_weekly_schedule_slots
FOR SELECT
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM public.villages v
    WHERE v.id = village_id
      AND (
        v.is_active = true
        OR public.is_village_resident(village_id)
        OR public.is_village_soltys(village_id)
      )
  )
);

DROP POLICY IF EXISTS "Soltys manages weekly schedule" ON public.village_weekly_schedule_slots;
CREATE POLICY "Soltys manages weekly schedule"
ON public.village_weekly_schedule_slots
FOR ALL
USING (public.is_village_soltys(village_id))
WITH CHECK (public.is_village_soltys(village_id));

-- =========================================
-- Źródła dofinansowania (informacje, bez porad prawnych)
-- =========================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'village_funding_category'
  ) THEN
    CREATE TYPE public.village_funding_category AS ENUM (
      'fundusz_solecki',
      'gmina_powiat_woj',
      'ue_prow',
      'ngo_fundacja',
      'sponsor',
      'inne'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.village_funding_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  category public.village_funding_category NOT NULL DEFAULT 'inne',
  title TEXT NOT NULL,
  summary TEXT,
  body TEXT,
  source_url TEXT,
  amount_hint TEXT,
  application_deadline DATE,
  status public.publication_status NOT NULL DEFAULT 'approved',
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT village_funding_title_len CHECK (char_length(title) <= 220),
  CONSTRAINT village_funding_summary_len CHECK (summary IS NULL OR char_length(summary) <= 800),
  CONSTRAINT village_funding_body_len CHECK (body IS NULL OR char_length(body) <= 12000)
);

CREATE INDEX IF NOT EXISTS idx_village_funding_village ON public.village_funding_sources(village_id);
CREATE INDEX IF NOT EXISTS idx_village_funding_status ON public.village_funding_sources(village_id, status);

DROP TRIGGER IF EXISTS update_village_funding_sources_updated_at ON public.village_funding_sources;
CREATE TRIGGER update_village_funding_sources_updated_at
BEFORE UPDATE ON public.village_funding_sources
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.village_funding_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public approved funding read active village" ON public.village_funding_sources;
CREATE POLICY "Public approved funding read active village"
ON public.village_funding_sources
FOR SELECT
USING (
  status = 'approved'
  AND EXISTS (
    SELECT 1 FROM public.villages v
    WHERE v.id = village_id
      AND (
        v.is_active = true
        OR public.is_village_resident(village_id)
        OR public.is_village_soltys(village_id)
      )
  )
);

DROP POLICY IF EXISTS "Soltys manages funding sources" ON public.village_funding_sources;
CREATE POLICY "Soltys manages funding sources"
ON public.village_funding_sources
FOR ALL
USING (public.is_village_soltys(village_id))
WITH CHECK (public.is_village_soltys(village_id));
