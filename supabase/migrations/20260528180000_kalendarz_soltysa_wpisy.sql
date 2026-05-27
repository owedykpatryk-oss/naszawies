-- Własne wpisy kalendarza sołtysa (zadania, terminy urzędowe, notatki)

CREATE TABLE IF NOT EXISTS public.village_soltys_calendar_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  entry_kind TEXT NOT NULL DEFAULT 'zadanie'
    CHECK (entry_kind IN ('zadanie', 'termin', 'zebranie', 'notatka')),
  title TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  is_done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT soltys_calendar_title_len CHECK (char_length(title) <= 200)
);

CREATE INDEX IF NOT EXISTS idx_soltys_calendar_village_start ON public.village_soltys_calendar_entries(village_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_soltys_calendar_done ON public.village_soltys_calendar_entries(village_id, is_done);

DROP TRIGGER IF EXISTS update_village_soltys_calendar_entries_updated_at ON public.village_soltys_calendar_entries;
CREATE TRIGGER update_village_soltys_calendar_entries_updated_at
BEFORE UPDATE ON public.village_soltys_calendar_entries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.village_soltys_calendar_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Soltys manages calendar entries" ON public.village_soltys_calendar_entries;
CREATE POLICY "Soltys manages calendar entries"
ON public.village_soltys_calendar_entries
FOR ALL
USING (public.is_village_soltys(village_id))
WITH CHECK (public.is_village_soltys(village_id));
