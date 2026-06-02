-- Hub: voivodeship w RPC, auto-refresh MV, wyszukiwarka trigram, RLS initplan catch-up.

DROP FUNCTION IF EXISTS public.hub_powiaty_w_wojewodztwie(text);

CREATE OR REPLACE FUNCTION public.hub_powiaty_w_wojewodztwie(p_woj_slug text)
RETURNS TABLE (
  voivodeship text,
  county text,
  liczba_gmin bigint,
  liczba_wsi bigint,
  liczba_aktywnych bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    h.voivodeship,
    h.county,
    h.liczba_gmin,
    h.liczba_wsi,
    h.liczba_aktywnych
  FROM public.village_hub_powiaty_mv h
  WHERE h.voivodeship_slug = p_woj_slug
  ORDER BY h.county ASC;
$$;

REVOKE ALL ON FUNCTION public.hub_powiaty_w_wojewodztwie(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.hub_powiaty_w_wojewodztwie(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.villages_refresh_hub_stats_stmt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  PERFORM public.refresh_village_hub_stats();
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS villages_refresh_hub_stats ON public.villages;
CREATE TRIGGER villages_refresh_hub_stats
  AFTER INSERT
  OR UPDATE OF is_active, voivodeship, county, commune, commune_type
  OR DELETE
  ON public.villages
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.villages_refresh_hub_stats_stmt();

CREATE OR REPLACE FUNCTION public.upsert_villages_simc(p_rows jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' THEN
    RETURN 0;
  END IF;

  INSERT INTO public.villages (
    teryt_id, gmina_teryt_kod, name, slug, voivodeship, county, commune, commune_type, is_active
  )
  SELECT
    r.teryt_id,
    r.gmina_teryt_kod,
    r.name,
    r.slug,
    r.voivodeship,
    r.county,
    r.commune,
    r.commune_type,
    COALESCE(r.is_active, false)
  FROM jsonb_to_recordset(p_rows) AS r(
    teryt_id text,
    gmina_teryt_kod text,
    name text,
    slug text,
    voivodeship text,
    county text,
    commune text,
    commune_type text,
    is_active boolean
  )
  ON CONFLICT (teryt_id) DO UPDATE SET
    gmina_teryt_kod = COALESCE(EXCLUDED.gmina_teryt_kod, villages.gmina_teryt_kod),
    name = EXCLUDED.name,
    slug = EXCLUDED.slug,
    voivodeship = EXCLUDED.voivodeship,
    county = EXCLUDED.county,
    commune = EXCLUDED.commune,
    commune_type = EXCLUDED.commune_type,
    updated_at = NOW()
  WHERE
    villages.is_active = false
    AND villages.soltys_user_id IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_villages_commune_trgm
  ON public.villages USING gin (commune gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_villages_county_trgm
  ON public.villages USING gin (county gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_villages_voivodeship_trgm
  ON public.villages USING gin (voivodeship gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_villages_slug_trgm
  ON public.villages USING gin (slug gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_villages_teryt_trgm
  ON public.villages USING gin (teryt_id gin_trgm_ops);

CREATE OR REPLACE FUNCTION public.szukaj_wsi_katalog(p_fraza text)
RETURNS TABLE (
  id uuid,
  name text,
  slug text,
  voivodeship text,
  county text,
  commune text,
  commune_type text,
  teryt_id text
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH f AS (
    SELECT btrim(p_fraza) AS t
  )
  SELECT
    v.id,
    v.name,
    v.slug,
    v.voivodeship,
    v.county,
    v.commune,
    v.commune_type,
    v.teryt_id
  FROM public.villages v
  CROSS JOIN f
  WHERE length(f.t) >= 2
    AND (
      v.name ILIKE '%' || f.t || '%'
      OR v.commune ILIKE '%' || f.t || '%'
      OR v.county ILIKE '%' || f.t || '%'
      OR v.voivodeship ILIKE '%' || f.t || '%'
      OR v.teryt_id ILIKE f.t || '%'
      OR v.slug ILIKE '%' || f.t || '%'
    )
  ORDER BY
    (lower(v.name) = lower(f.t)) DESC,
    (lower(v.name) LIKE lower(f.t) || '%') DESC,
    v.name ASC
  LIMIT 50;
$$;

-- Catch-up auth_rls_initplan dla polityk dodanych po poprzednim skrocie.
DO $$
DECLARE
  pol record;
  new_qual text;
  new_with_check text;
  roles_clause text;
  permissive_clause text;
  create_sql text;
BEGIN
  FOR pol IN
    SELECT
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname IN ('public', 'storage')
      AND (
        qual ~ 'auth\.(uid|jwt|role)\(\)'
        OR with_check ~ 'auth\.(uid|jwt|role)\(\)'
        OR qual ~ 'current_setting\('
        OR with_check ~ 'current_setting\('
      )
  LOOP
    new_qual := pol.qual;
    new_with_check := pol.with_check;

    IF new_qual IS NOT NULL THEN
      new_qual := regexp_replace(new_qual, '(?<!\(select )auth\.uid\(\)', '(select auth.uid())', 'g');
      new_qual := regexp_replace(new_qual, '(?<!\(select )auth\.jwt\(\)', '(select auth.jwt())', 'g');
      new_qual := regexp_replace(new_qual, '(?<!\(select )auth\.role\(\)', '(select auth.role())', 'g');
      new_qual := regexp_replace(
        new_qual,
        '(?<!\(select )current_setting\(([^)]*)\)',
        '(select current_setting(\1))',
        'g'
      );
    END IF;

    IF new_with_check IS NOT NULL THEN
      new_with_check := regexp_replace(new_with_check, '(?<!\(select )auth\.uid\(\)', '(select auth.uid())', 'g');
      new_with_check := regexp_replace(new_with_check, '(?<!\(select )auth\.jwt\(\)', '(select auth.jwt())', 'g');
      new_with_check := regexp_replace(new_with_check, '(?<!\(select )auth\.role\(\)', '(select auth.role())', 'g');
      new_with_check := regexp_replace(
        new_with_check,
        '(?<!\(select )current_setting\(([^)]*)\)',
        '(select current_setting(\1))',
        'g'
      );
    END IF;

    IF new_qual IS NOT DISTINCT FROM pol.qual
       AND new_with_check IS NOT DISTINCT FROM pol.with_check THEN
      CONTINUE;
    END IF;

    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      pol.policyname,
      pol.schemaname,
      pol.tablename
    );

    IF pol.roles IS NOT NULL AND cardinality(pol.roles) > 0 THEN
      SELECT ' TO ' || string_agg(quote_ident(r), ', ')
      INTO roles_clause
      FROM unnest(pol.roles) AS r;
    ELSE
      roles_clause := '';
    END IF;

    permissive_clause := CASE
      WHEN pol.permissive = 'RESTRICTIVE' THEN ' AS RESTRICTIVE'
      ELSE ''
    END;

    create_sql := format(
      'CREATE POLICY %I ON %I.%I%s FOR %s%s',
      pol.policyname,
      pol.schemaname,
      pol.tablename,
      permissive_clause,
      pol.cmd,
      COALESCE(roles_clause, '')
    );

    IF new_qual IS NOT NULL THEN
      create_sql := create_sql || format(' USING (%s)', new_qual);
    END IF;

    IF new_with_check IS NOT NULL THEN
      create_sql := create_sql || format(' WITH CHECK (%s)', new_with_check);
    END IF;

    EXECUTE create_sql;
  END LOOP;
END $$;
