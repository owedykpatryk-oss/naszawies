-- Bezpieczeństwo: immutable search_path na funkcjach (Supabase linter: function_search_path_mutable).
-- Waitlist: jedna polityka INSERT z sensownym WITH CHECK zamiast (true).

-- ---------------------------------------------------------------------------
-- search_path (public + pg_temp — brak niejawnego search_path z sesji)
-- ---------------------------------------------------------------------------
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;
ALTER FUNCTION public.activate_village_on_soltys_approval() SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
ALTER FUNCTION public.is_village_soltys(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.is_village_resident(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.is_platform_admin() SET search_path = public, pg_temp;

-- ---------------------------------------------------------------------------
-- Waitlist: usuń duplikaty / polityki z (true), jedna polityka dla anon + authenticated
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "anon moze zapisac waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;

CREATE POLICY "waitlist_insert_public_validated"
ON public.waitlist
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL
  AND length(btrim(email)) BETWEEN 5 AND 320
  AND position('@' in btrim(email)) > 1
  AND position('@' in btrim(email)) < length(btrim(email))
  AND btrim(email) NOT LIKE '% %'
  AND (full_name IS NULL OR length(btrim(full_name)) <= 200)
  AND (village_name IS NULL OR length(btrim(village_name)) <= 200)
  AND (commune IS NULL OR length(btrim(commune)) <= 200)
  AND (role IS NULL OR length(btrim(role)) <= 80)
  AND (source IS NULL OR length(btrim(source)) <= 120)
  AND (utm_source IS NULL OR length(btrim(utm_source)) <= 120)
  AND (utm_medium IS NULL OR length(btrim(utm_medium)) <= 120)
  AND (utm_campaign IS NULL OR length(btrim(utm_campaign)) <= 120)
  AND (consent_text_version IS NULL OR length(btrim(consent_text_version)) <= 64)
  AND consent_given_at IS NOT NULL
  -- Zapis z landingu: bez przypisania do istniejącego użytkownika (service role omija RLS)
  AND converted_user_id IS NULL
);
