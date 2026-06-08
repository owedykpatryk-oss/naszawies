-- Profil leśnictwa wsi + ostrzeżenia (zakazy wejścia, wycinki, pożary, wiatr…)

CREATE TABLE IF NOT EXISTS public.village_forestry_profiles (
  village_id UUID PRIMARY KEY REFERENCES public.villages(id) ON DELETE CASCADE,
  profile_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.village_forestry_profiles IS
  'Profil leśny wsi: nadleśnictwo, choinki, drewno, zasady pobytu w lesie (JSON schemaProfilLesnictwa).';

CREATE TABLE IF NOT EXISTS public.village_forestry_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  village_id UUID NOT NULL REFERENCES public.villages(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  notice_kind TEXT NOT NULL DEFAULT 'inne'
    CHECK (notice_kind IN (
      'zakaz_wejscia',
      'wycinka',
      'prace_zmechanizowane',
      'niebezpieczne_drzewo',
      'pozar_lasu',
      'silny_wiatr',
      'burza',
      'zbieractwo',
      'droga_zamknieta',
      'inne'
    )),
  title TEXT NOT NULL,
  area_description TEXT NOT NULL,
  safety_note TEXT,
  contact_phone TEXT,
  contact_name TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  area_geojson JSONB,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
  moderated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  moderated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT forestry_notice_title_len CHECK (char_length(title) <= 160),
  CONSTRAINT forestry_dates_ok CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_forestry_notices_village
  ON public.village_forestry_notices(village_id, status);

CREATE INDEX IF NOT EXISTS idx_forestry_notices_active
  ON public.village_forestry_notices(village_id, starts_at, ends_at)
  WHERE status = 'approved';

DROP TRIGGER IF EXISTS update_village_forestry_profiles_updated_at ON public.village_forestry_profiles;
CREATE TRIGGER update_village_forestry_profiles_updated_at
BEFORE UPDATE ON public.village_forestry_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_village_forestry_notices_updated_at ON public.village_forestry_notices;
CREATE TRIGGER update_village_forestry_notices_updated_at
BEFORE UPDATE ON public.village_forestry_notices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.village_forestry_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.village_forestry_notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published forestry profiles" ON public.village_forestry_profiles;
CREATE POLICY "Public read published forestry profiles"
ON public.village_forestry_profiles
FOR SELECT
USING (is_published = true);

DROP POLICY IF EXISTS "Soltys manages forestry profiles" ON public.village_forestry_profiles;
CREATE POLICY "Soltys manages forestry profiles"
ON public.village_forestry_profiles
FOR ALL
USING (public.is_village_soltys(village_id))
WITH CHECK (public.is_village_soltys(village_id));

DROP POLICY IF EXISTS "Public active forestry notices" ON public.village_forestry_notices;
CREATE POLICY "Public active forestry notices"
ON public.village_forestry_notices
FOR SELECT
USING (
  status = 'approved'
  AND now() <= ends_at + interval '1 day'
);

DROP POLICY IF EXISTS "Soltys manages forestry notices" ON public.village_forestry_notices;
CREATE POLICY "Soltys manages forestry notices"
ON public.village_forestry_notices
FOR ALL
USING (public.is_village_soltys(village_id))
WITH CHECK (public.is_village_soltys(village_id));

DROP POLICY IF EXISTS "Residents insert forestry notice draft" ON public.village_forestry_notices;
CREATE POLICY "Residents insert forestry notice draft"
ON public.village_forestry_notices
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND status = 'pending'
  AND public.is_village_resident(village_id)
);

DROP POLICY IF EXISTS "Author sees own forestry notices" ON public.village_forestry_notices;
CREATE POLICY "Author sees own forestry notices"
ON public.village_forestry_notices
FOR SELECT
TO authenticated
USING (created_by = auth.uid());
