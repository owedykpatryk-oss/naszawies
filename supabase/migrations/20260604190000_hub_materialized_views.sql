-- Hub administracyjny: pre-agregacja zamiast GROUP BY na ~160k wierszach villages przy każdym RPC.

CREATE MATERIALIZED VIEW IF NOT EXISTS public.village_hub_powiaty_mv AS
SELECT
  v.voivodeship_slug,
  v.county_slug,
  max(v.voivodeship) AS voivodeship,
  max(v.county) AS county,
  count(DISTINCT v.commune_slug)::bigint AS liczba_gmin,
  count(*)::bigint AS liczba_wsi,
  count(*) FILTER (WHERE v.is_active)::bigint AS liczba_aktywnych
FROM public.villages v
WHERE v.voivodeship_slug IS NOT NULL
  AND v.county_slug IS NOT NULL
GROUP BY v.voivodeship_slug, v.county_slug
WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS village_hub_powiaty_mv_pk
  ON public.village_hub_powiaty_mv (voivodeship_slug, county_slug);

CREATE MATERIALIZED VIEW IF NOT EXISTS public.village_hub_gminy_mv AS
SELECT
  v.voivodeship_slug,
  v.county_slug,
  v.commune_slug,
  max(v.commune) AS commune,
  max(v.commune_type) AS commune_type,
  count(*)::bigint AS liczba_wsi,
  count(*) FILTER (WHERE v.is_active)::bigint AS liczba_aktywnych
FROM public.villages v
WHERE v.voivodeship_slug IS NOT NULL
  AND v.county_slug IS NOT NULL
  AND v.commune_slug IS NOT NULL
GROUP BY v.voivodeship_slug, v.county_slug, v.commune_slug
WITH NO DATA;

CREATE UNIQUE INDEX IF NOT EXISTS village_hub_gminy_mv_pk
  ON public.village_hub_gminy_mv (voivodeship_slug, county_slug, commune_slug);

REFRESH MATERIALIZED VIEW public.village_hub_powiaty_mv;
REFRESH MATERIALIZED VIEW public.village_hub_gminy_mv;

CREATE OR REPLACE FUNCTION public.refresh_village_hub_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.village_hub_powiaty_mv;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.village_hub_gminy_mv;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_village_hub_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_village_hub_stats() TO service_role;

CREATE OR REPLACE FUNCTION public.hub_podsumowanie_wojewodztw()
RETURNS TABLE (
  voivodeship text,
  voivodeship_slug text,
  liczba_wsi bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    max(h.voivodeship) AS voivodeship,
    h.voivodeship_slug,
    sum(h.liczba_wsi)::bigint AS liczba_wsi
  FROM public.village_hub_powiaty_mv h
  GROUP BY h.voivodeship_slug
  ORDER BY max(h.voivodeship) ASC;
$$;

CREATE OR REPLACE FUNCTION public.hub_powiaty_w_wojewodztwie(p_woj_slug text)
RETURNS TABLE (
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
    h.county,
    h.liczba_gmin,
    h.liczba_wsi,
    h.liczba_aktywnych
  FROM public.village_hub_powiaty_mv h
  WHERE h.voivodeship_slug = p_woj_slug
  ORDER BY h.county ASC;
$$;

CREATE OR REPLACE FUNCTION public.hub_gminy_w_powiacie(p_woj_slug text, p_pow_slug text)
RETURNS TABLE (
  commune text,
  commune_type text,
  liczba_wsi bigint,
  liczba_aktywnych bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    h.commune,
    h.commune_type,
    h.liczba_wsi,
    h.liczba_aktywnych
  FROM public.village_hub_gminy_mv h
  WHERE h.voivodeship_slug = p_woj_slug
    AND h.county_slug = p_pow_slug
  ORDER BY h.commune ASC;
$$;

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
  IF v_count > 0 THEN
    PERFORM public.refresh_village_hub_stats();
  END IF;
  RETURN v_count;
END;
$$;
