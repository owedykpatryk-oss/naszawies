-- Bezpieczeństwo RLS: rozdziel FOR ALL (unikaj zduplikowanego SELECT) + initplan dla is_village_soltys.

-- ---------------------------------------------------------------------------
-- village_agriculture_profiles
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Soltys manages agriculture profiles" ON public.village_agriculture_profiles;

CREATE POLICY "Soltys read agriculture profiles"
ON public.village_agriculture_profiles
FOR SELECT
USING ((select public.is_village_soltys(village_id)));

CREATE POLICY "Soltys insert agriculture profiles"
ON public.village_agriculture_profiles
FOR INSERT
WITH CHECK ((select public.is_village_soltys(village_id)));

CREATE POLICY "Soltys update agriculture profiles"
ON public.village_agriculture_profiles
FOR UPDATE
USING ((select public.is_village_soltys(village_id)))
WITH CHECK ((select public.is_village_soltys(village_id)));

CREATE POLICY "Soltys delete agriculture profiles"
ON public.village_agriculture_profiles
FOR DELETE
USING ((select public.is_village_soltys(village_id)));

ALTER TABLE public.village_agriculture_profiles
  DROP CONSTRAINT IF EXISTS village_agriculture_profiles_data_size_chk;

ALTER TABLE public.village_agriculture_profiles
  ADD CONSTRAINT village_agriculture_profiles_data_size_chk
  CHECK (pg_column_size(profile_data) <= 65536);

-- ---------------------------------------------------------------------------
-- village_forestry_profiles
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Soltys manages forestry profiles" ON public.village_forestry_profiles;

CREATE POLICY "Soltys read forestry profiles"
ON public.village_forestry_profiles
FOR SELECT
USING ((select public.is_village_soltys(village_id)));

CREATE POLICY "Soltys insert forestry profiles"
ON public.village_forestry_profiles
FOR INSERT
WITH CHECK ((select public.is_village_soltys(village_id)));

CREATE POLICY "Soltys update forestry profiles"
ON public.village_forestry_profiles
FOR UPDATE
USING ((select public.is_village_soltys(village_id)))
WITH CHECK ((select public.is_village_soltys(village_id)));

CREATE POLICY "Soltys delete forestry profiles"
ON public.village_forestry_profiles
FOR DELETE
USING ((select public.is_village_soltys(village_id)));

ALTER TABLE public.village_forestry_profiles
  DROP CONSTRAINT IF EXISTS village_forestry_profiles_data_size_chk;

ALTER TABLE public.village_forestry_profiles
  ADD CONSTRAINT village_forestry_profiles_data_size_chk
  CHECK (pg_column_size(profile_data) <= 65536);

-- ---------------------------------------------------------------------------
-- village_forestry_notices — sołtys bez zduplikowanego SELECT względem publicznej polityki
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Soltys manages forestry notices" ON public.village_forestry_notices;

CREATE POLICY "Soltys read forestry notices"
ON public.village_forestry_notices
FOR SELECT
USING ((select public.is_village_soltys(village_id)));

CREATE POLICY "Soltys insert forestry notices"
ON public.village_forestry_notices
FOR INSERT
WITH CHECK ((select public.is_village_soltys(village_id)));

CREATE POLICY "Soltys update forestry notices"
ON public.village_forestry_notices
FOR UPDATE
USING ((select public.is_village_soltys(village_id)))
WITH CHECK ((select public.is_village_soltys(village_id)));

CREATE POLICY "Soltys delete forestry notices"
ON public.village_forestry_notices
FOR DELETE
USING ((select public.is_village_soltys(village_id)));
