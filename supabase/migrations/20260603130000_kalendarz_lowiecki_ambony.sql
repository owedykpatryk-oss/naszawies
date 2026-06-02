-- Kalendarz łowiecki: polowania, zebrania, obsada ambony (kto na jakiej ambony)

CREATE TABLE IF NOT EXISTS public.village_hunting_schedule_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.village_community_groups(id) ON DELETE SET NULL,
  entry_kind TEXT NOT NULL DEFAULT 'inne'
    CHECK (entry_kind IN (
      'obowiazek_ambony',
      'polowanie_zbiorowe',
      'zebranie_kola',
      'szkolenie',
      'patrol',
      'inne'
    )),
  title TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  poi_id UUID REFERENCES public.pois(id) ON DELETE SET NULL,
  stand_label TEXT,
  hunter_name TEXT,
  hunter_phone TEXT,
  notes TEXT,
  hunting_notice_id UUID REFERENCES public.village_hunting_notices(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT hunting_schedule_title_len CHECK (char_length(title) <= 200),
  CONSTRAINT hunting_schedule_dates_ok CHECK (ends_at > starts_at),
  CONSTRAINT hunting_schedule_stand_or_poi CHECK (
    entry_kind <> 'obowiazek_ambony'
    OR poi_id IS NOT NULL
    OR (stand_label IS NOT NULL AND char_length(trim(stand_label)) >= 2)
  ),
  CONSTRAINT hunting_schedule_hunter_ambona CHECK (
    entry_kind <> 'obowiazek_ambony'
    OR (hunter_name IS NOT NULL AND char_length(trim(hunter_name)) >= 2)
  )
);

CREATE INDEX IF NOT EXISTS idx_hunting_schedule_village_dates
  ON public.village_hunting_schedule_entries(village_id, starts_at, ends_at);

CREATE INDEX IF NOT EXISTS idx_hunting_schedule_kind
  ON public.village_hunting_schedule_entries(village_id, entry_kind, starts_at);

DROP TRIGGER IF EXISTS update_village_hunting_schedule_entries_updated_at
  ON public.village_hunting_schedule_entries;
CREATE TRIGGER update_village_hunting_schedule_entries_updated_at
BEFORE UPDATE ON public.village_hunting_schedule_entries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.village_hunting_schedule_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Soltys manages hunting schedule" ON public.village_hunting_schedule_entries;
CREATE POLICY "Soltys manages hunting schedule"
ON public.village_hunting_schedule_entries
FOR ALL
USING (public.is_village_soltys(village_id))
WITH CHECK (public.is_village_soltys(village_id));

DROP POLICY IF EXISTS "Residents read hunting schedule" ON public.village_hunting_schedule_entries;
CREATE POLICY "Residents read hunting schedule"
ON public.village_hunting_schedule_entries
FOR SELECT
TO authenticated
USING (public.is_village_resident(village_id) OR public.is_village_soltys(village_id));
