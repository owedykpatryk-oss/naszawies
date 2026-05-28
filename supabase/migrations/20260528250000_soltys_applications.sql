-- Wnioski o rolę sołtysa (kolejka admina) + zatwierdzenie jednym RPC

CREATE TABLE IF NOT EXISTS public.soltys_village_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  village_id UUID REFERENCES public.villages(id) ON DELETE SET NULL,
  teryt_id TEXT NOT NULL,
  village_name TEXT NOT NULL,
  commune TEXT NOT NULL,
  county TEXT NOT NULL,
  voivodeship TEXT NOT NULL,
  applicant_display_name TEXT,
  applicant_phone TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
  admin_note TEXT,
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT soltys_app_teryt_len CHECK (char_length(teryt_id) BETWEEN 4 AND 20),
  CONSTRAINT soltys_app_note_len CHECK (admin_note IS NULL OR char_length(admin_note) <= 2000)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_soltys_app_user_pending
  ON public.soltys_village_applications (user_id)
  WHERE status = 'pending';

CREATE UNIQUE INDEX IF NOT EXISTS idx_soltys_app_teryt_pending
  ON public.soltys_village_applications (teryt_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_soltys_app_status_created
  ON public.soltys_village_applications (status, created_at DESC);

DROP TRIGGER IF EXISTS update_soltys_village_applications_updated_at ON public.soltys_village_applications;
CREATE TRIGGER update_soltys_village_applications_updated_at
BEFORE UPDATE ON public.soltys_village_applications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.soltys_village_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User inserts own soltys application" ON public.soltys_village_applications;
CREATE POLICY "User inserts own soltys application"
ON public.soltys_village_applications
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'
);

DROP POLICY IF EXISTS "User reads own soltys applications" ON public.soltys_village_applications;
CREATE POLICY "User reads own soltys applications"
ON public.soltys_village_applications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "User withdraws own pending application" ON public.soltys_village_applications;
CREATE POLICY "User withdraws own pending application"
ON public.soltys_village_applications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id AND status IN ('pending', 'withdrawn'));

DROP POLICY IF EXISTS "Platform admin reads soltys applications" ON public.soltys_village_applications;
CREATE POLICY "Platform admin reads soltys applications"
ON public.soltys_village_applications
FOR SELECT
TO authenticated
USING (public.is_platform_admin());

-- Zatwierdzenie: wieś (jeśli brak) + aktywny sołtys + aktywacja wsi (trigger)
CREATE OR REPLACE FUNCTION public.admin_zatwierdz_wniosek_soltysa(p_application_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_app public.soltys_village_applications%ROWTYPE;
  v_vid UUID;
  v_uid UUID;
  v_slug TEXT;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Brak uprawnień' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_app
  FROM public.soltys_village_applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nie znaleziono wniosku.';
  END IF;
  IF v_app.status <> 'pending' THEN
    RAISE EXCEPTION 'Wniosek nie oczekuje na decyzję (status: %).', v_app.status;
  END IF;

  v_uid := v_app.user_id;

  IF EXISTS (
    SELECT 1 FROM public.user_village_roles uvr
    WHERE uvr.user_id = v_uid AND uvr.role = 'soltys' AND uvr.status = 'active'
  ) THEN
    RAISE EXCEPTION 'Ten użytkownik ma już aktywną rolę sołtysa w innej wsi.';
  END IF;

  v_vid := v_app.village_id;
  IF v_vid IS NULL THEN
    SELECT v.id INTO v_vid FROM public.villages v WHERE v.teryt_id = btrim(v_app.teryt_id) LIMIT 1;
  END IF;

  IF v_vid IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.villages v WHERE v.id = v_vid AND v.soltys_user_id IS NOT NULL
    ) THEN
      RAISE EXCEPTION 'Ta wieś ma już przypisanego sołtysa w serwisie.';
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.user_village_roles uvr
      WHERE uvr.village_id = v_vid AND uvr.role = 'soltys' AND uvr.status = 'active'
    ) THEN
      RAISE EXCEPTION 'Ta wieś ma już aktywnego sołtysa.';
    END IF;
  ELSE
    v_slug := lower(regexp_replace(btrim(v_app.village_name), '[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]+', '-', 'g'));
    v_slug := trim(both '-' from v_slug);
    IF v_slug = '' THEN
      v_slug := 'wies-' || btrim(v_app.teryt_id);
    END IF;
    IF EXISTS (SELECT 1 FROM public.villages v WHERE v.teryt_id = btrim(v_app.teryt_id)) THEN
      SELECT v.id INTO v_vid FROM public.villages v WHERE v.teryt_id = btrim(v_app.teryt_id) LIMIT 1;
    ELSE
      INSERT INTO public.villages (
        teryt_id, name, slug, voivodeship, county, commune, commune_type, is_active
      )
      VALUES (
        btrim(v_app.teryt_id),
        btrim(v_app.village_name),
        v_slug,
        btrim(v_app.voivodeship),
        btrim(v_app.county),
        btrim(v_app.commune),
        'gmina_miejsko_wiejska',
        false
      )
      RETURNING id INTO v_vid;
    END IF;
  END IF;

  INSERT INTO public.user_village_roles (user_id, village_id, role, status)
  VALUES (v_uid, v_vid, 'soltys', 'active');

  UPDATE public.soltys_village_applications
  SET
    status = 'approved',
    village_id = v_vid,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    updated_at = now()
  WHERE id = p_application_id;

  RETURN v_vid;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_odrzuc_wniosek_soltysa(
  p_application_id UUID,
  p_admin_note TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Brak uprawnień' USING ERRCODE = '42501';
  END IF;

  UPDATE public.soltys_village_applications
  SET
    status = 'rejected',
    admin_note = NULLIF(btrim(p_admin_note), ''),
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    updated_at = now()
  WHERE id = p_application_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nie znaleziono oczekującego wniosku.';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_zatwierdz_wniosek_soltysa(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_zatwierdz_wniosek_soltysa(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.admin_odrzuc_wniosek_soltysa(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_odrzuc_wniosek_soltysa(UUID, TEXT) TO authenticated;

COMMENT ON TABLE public.soltys_village_applications IS
  'Kolejka wniosków o rolę sołtysa — zatwierdzenie przez admin_zatwierdz_wniosek_soltysa.';

-- Sołtys może od razu nadać współadministratora (bez wniosku pending)
DROP POLICY IF EXISTS "Soltys assigns wspoladmin" ON public.user_village_roles;
CREATE POLICY "Soltys assigns wspoladmin"
ON public.user_village_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_village_soltys(village_id)
  AND role = 'wspoladmin'
  AND status = 'active'
);

-- issues: status wysłania pisma do gminy
ALTER TABLE public.issues
  ADD COLUMN IF NOT EXISTS gmina_letter_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS gmina_letter_status TEXT
    CHECK (gmina_letter_status IS NULL OR gmina_letter_status IN ('draft', 'sent', 'answered'));

COMMENT ON COLUMN public.issues.gmina_letter_sent_at IS 'Kiedy sołtys oznaczył wysłanie pisma do gminy.';
