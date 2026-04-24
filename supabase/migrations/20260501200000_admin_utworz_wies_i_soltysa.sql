-- Jedna transakcja: nowa wieś (jeśli nie było w imporcie) + rola sołtysa (aktywna).
-- Wywołanie tylko dla is_platform_admin() — np. z panelu /panel/admin.

CREATE OR REPLACE FUNCTION public.admin_utworz_wies_i_soltysa(
  p_teryt_id text,
  p_name text,
  p_slug text,
  p_voivodeship text,
  p_county text,
  p_commune text,
  p_commune_type text,
  p_soltys_email text,
  p_latitude numeric DEFAULT NULL,
  p_longitude numeric DEFAULT NULL,
  p_population integer DEFAULT NULL
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

  IF p_teryt_id IS NULL OR btrim(p_teryt_id) = '' THEN
    RAISE EXCEPTION 'Wymagany unikalny identyfikator miejscowości (kod z rejestru TERYT / SIMC).';
  END IF;

  SELECT u.id
  INTO v_uid
  FROM auth.users u
  WHERE lower(u.email) = lower(btrim(p_soltys_email))
  LIMIT 1;

  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Nie znaleziono użytkownika z tym adresem e-mail (musi być zarejestrowany w serwisie).';
  END IF;

  IF EXISTS (SELECT 1 FROM public.villages v WHERE v.teryt_id = btrim(p_teryt_id)) THEN
    RAISE EXCEPTION 'Miejscowość o tym identyfikatorze jest już w bazie — użyj przypisania roli w panelu lub zduplikowany wpis w TERYT.';
  END IF;

  INSERT INTO public.villages (
    teryt_id,
    name,
    slug,
    voivodeship,
    county,
    commune,
    commune_type,
    latitude,
    longitude,
    population,
    is_active
  )
  VALUES (
    btrim(p_teryt_id),
    btrim(p_name),
    btrim(p_slug),
    btrim(p_voivodeship),
    btrim(p_county),
    btrim(p_commune),
    btrim(p_commune_type),
    p_latitude,
    p_longitude,
    p_population,
    false
  )
  RETURNING id INTO v_vid;

  INSERT INTO public.user_village_roles (user_id, village_id, role, status)
  VALUES (v_uid, v_vid, 'soltys', 'active');

  RETURN v_vid;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_utworz_wies_i_soltysa(
  text, text, text, text, text, text, text, text, numeric, numeric, integer
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_utworz_wies_i_soltysa(
  text, text, text, text, text, text, text, text, numeric, numeric, integer
) TO authenticated;

COMMENT ON FUNCTION public.admin_utworz_wies_i_soltysa IS
  'Admin: wstawia villages + aktywnego sołtysa. Uruchamia trigger activate_village (is_active, soltys_user_id).';
