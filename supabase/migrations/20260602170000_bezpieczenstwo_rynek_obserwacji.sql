-- Bezpieczeństwo: nie ujawniaj listy obserwujących profil rynku (tylko agregat liczby).

DROP POLICY IF EXISTS "Authenticated users can read follow rows for active profiles" ON public.marketplace_profile_follows;
DROP POLICY IF EXISTS "Profile owners see follow count via own profile" ON public.marketplace_profile_follows;

CREATE OR REPLACE FUNCTION public.count_marketplace_profile_followers(p_profile_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::bigint
  FROM public.marketplace_profile_follows f
  INNER JOIN public.marketplace_profiles mp ON mp.id = f.profile_id
  WHERE f.profile_id = p_profile_id
    AND mp.is_active = true;
$$;

REVOKE ALL ON FUNCTION public.count_marketplace_profile_followers(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_marketplace_profile_followers(uuid) TO anon, authenticated;

COMMENT ON FUNCTION public.count_marketplace_profile_followers(uuid) IS
  'Publiczny licznik obserwujących profil firmy — bez ujawniania user_id.';

-- Dostawy przypomnień: tylko cron (service_role), użytkownik widzi własne wiersze.
REVOKE INSERT, UPDATE, DELETE ON public.resident_reminder_deliveries FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.resident_reminder_deliveries FROM anon;
