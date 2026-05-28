-- Aktywacja istniejącej wsi z katalogu (import TERYT) + rola sołtysa bez nowego INSERT.

CREATE OR REPLACE FUNCTION public.admin_przypisz_soltysa_do_wsi(
  p_village_id uuid,
  p_soltys_email text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid;
  v_vid uuid;
BEGIN
  IF NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Brak uprawnień' USING ERRCODE = '42501';
  END IF;

  IF p_village_id IS NULL THEN
    RAISE EXCEPTION 'Wymagany identyfikator wsi.';
  END IF;

  SELECT u.id
  INTO v_uid
  FROM auth.users u
  WHERE lower(u.email) = lower(btrim(p_soltys_email))
  LIMIT 1;

  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Nie znaleziono użytkownika z tym adresem e-mail (musi być zarejestrowany w serwisie).';
  END IF;

  SELECT v.id
  INTO v_vid
  FROM public.villages v
  WHERE v.id = p_village_id
  LIMIT 1;

  IF v_vid IS NULL THEN
    RAISE EXCEPTION 'Nie znaleziono wsi w katalogu.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_village_roles uvr
    WHERE uvr.user_id = v_uid AND uvr.role = 'soltys' AND uvr.status = 'active'
      AND uvr.village_id <> v_vid
  ) THEN
    RAISE EXCEPTION 'Ten użytkownik ma już aktywną rolę sołtysa w innej wsi.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.villages v
    WHERE v.id = v_vid AND v.soltys_user_id IS NOT NULL AND v.soltys_user_id <> v_uid
  ) THEN
    RAISE EXCEPTION 'Ta wieś ma już innego sołtysa w serwisie.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.user_village_roles uvr
    WHERE uvr.village_id = v_vid AND uvr.role = 'soltys' AND uvr.status = 'active'
      AND uvr.user_id <> v_uid
  ) THEN
    RAISE EXCEPTION 'Ta wieś ma już aktywnego sołtysa.';
  END IF;

  INSERT INTO public.user_village_roles (user_id, village_id, role, status)
  VALUES (v_uid, v_vid, 'soltys', 'active')
  ON CONFLICT (user_id, village_id, role) DO UPDATE
  SET status = 'active', updated_at = now();

  RETURN v_vid;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_przypisz_soltysa_do_wsi(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_przypisz_soltysa_do_wsi(uuid, text) TO authenticated;

COMMENT ON FUNCTION public.admin_przypisz_soltysa_do_wsi(uuid, text) IS
  'Panel admin: aktywacja wsi już w katalogu (import TERYT) przez przypisanie sołtysa.';
